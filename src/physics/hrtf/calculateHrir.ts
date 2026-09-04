import { fft } from '../../audio/fft'
import type { Complex } from '../core/complex'
import { type OuterEarParameters } from '../outerEar/parameters'
import { calculateHrtfAtFrequency, calculateHrtfResponse, type HrtfResponse, type SourceDirection } from './calculateHrtf'
import { createHrtfParameters, type HrtfParameters } from './parameters'

export type HrirOptions = {
  sampleRate: number
  fftSize: number
  /** An optional common transfer cascaded into both ears before the inverse FFT. */
  sharedTransferAtFrequency?: (frequencyHz: number) => Complex
}

export type HrirPair = {
  left: Float64Array
  right: Float64Array
  sampleRate: number
  hrtf: HrtfResponse
}

export const defaultHrirOptions: Readonly<HrirOptions> = Object.freeze({
  sampleRate: 48000,
  fftSize: 2048,
})

/**
 * Estimates left-leading-positive ITD from a HRIR pair with normalized
 * cross-correlation. The search is deliberately limited to plausible human
 * interaural delays so unrelated late impulse-response structure is ignored.
 */
export function estimateItdFromHrir(left: Float64Array, right: Float64Array, sampleRate: number, maximumItdSeconds = 0.001): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) throw new RangeError('ITD estimation requires equal, non-empty HRIR channels.')
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isFinite(maximumItdSeconds) || maximumItdSeconds <= 0) throw new RangeError('ITD estimation requires positive sample rate and search duration.')
  const maximumLag = Math.min(left.length - 1, Math.max(1, Math.round(maximumItdSeconds * sampleRate)))
  let bestLag = 0
  let bestCorrelation = -Infinity

  for (let lag = -maximumLag; lag <= maximumLag; lag += 1) {
    const start = Math.max(0, -lag)
    const end = Math.min(left.length, right.length - lag)
    let crossEnergy = 0
    let leftEnergy = 0
    let rightEnergy = 0
    for (let index = start; index < end; index += 1) {
      const leftSample = left[index]
      const rightSample = right[index + lag]
      crossEnergy += leftSample * rightSample
      leftEnergy += leftSample * leftSample
      rightEnergy += rightSample * rightSample
    }
    const correlation = crossEnergy / Math.sqrt(leftEnergy * rightEnergy)
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestLag = lag
    }
  }
  return bestLag / sampleRate
}

function assertOptions(options: HrirOptions): void {
  if (!Number.isFinite(options.sampleRate) || options.sampleRate <= 0) throw new RangeError('Sample rate must be greater than zero.')
  if (options.fftSize < 2 || (options.fftSize & (options.fftSize - 1)) !== 0) throw new RangeError('FFT size must be a power of two greater than one.')
}

/** Synthesizes causal, real-valued HRIRs by applying an inverse FFT to the complex HRTF pair. */
export function calculateHrirPair(
  direction: SourceDirection,
  outerEarParameters?: OuterEarParameters,
  hrtfParameters: HrtfParameters = createHrtfParameters(),
  options: HrirOptions = defaultHrirOptions,
): HrirPair {
  assertOptions(options)
  const leftReal = new Float64Array(options.fftSize)
  const leftImaginary = new Float64Array(options.fftSize)
  const rightReal = new Float64Array(options.fftSize)
  const rightImaginary = new Float64Array(options.fftSize)
  const positiveFrequencies: number[] = []

  for (let bin = 0; bin <= options.fftSize / 2; bin += 1) {
    const frequencyHz = bin * options.sampleRate / options.fftSize
    positiveFrequencies.push(Math.max(frequencyHz, 1))
    const point = calculateHrtfAtFrequency(Math.max(frequencyHz, 1), direction, outerEarParameters, hrtfParameters)
    const sharedTransfer = options.sharedTransferAtFrequency?.(Math.max(frequencyHz, 1))
    const leftTransfer = sharedTransfer === undefined ? point.left.transfer : point.left.transfer.multiply(sharedTransfer)
    const rightTransfer = sharedTransfer === undefined ? point.right.transfer : point.right.transfer.multiply(sharedTransfer)
    leftReal[bin] = leftTransfer.real
    rightReal[bin] = rightTransfer.real
    if (bin > 0 && bin < options.fftSize / 2) {
      leftImaginary[bin] = leftTransfer.imaginary
      rightImaginary[bin] = rightTransfer.imaginary
      leftReal[options.fftSize - bin] = leftTransfer.real
      leftImaginary[options.fftSize - bin] = -leftTransfer.imaginary
      rightReal[options.fftSize - bin] = rightTransfer.real
      rightImaginary[options.fftSize - bin] = -rightTransfer.imaginary
    }
  }

  fft(leftReal, leftImaginary, true)
  fft(rightReal, rightImaginary, true)
  return {
    left: leftReal,
    right: rightReal,
    sampleRate: options.sampleRate,
    hrtf: calculateHrtfResponse(positiveFrequencies, direction, outerEarParameters, hrtfParameters),
  }
}
