import { fft, nextPowerOfTwo } from './fft'
import { calculateMiddleEarAtFrequency } from '../physics/middleEar/calculateMiddleEar'
import { createMiddleEarParameters, type MiddleEarParameters } from '../physics/middleEar/parameters'
import { calculateHrirPair, defaultHrirOptions, type HrirOptions, type HrirPair } from '../physics/hrtf/calculateHrir'
import type { SourceDirection } from '../physics/hrtf/calculateHrtf'
import { createHrtfParameters, type HrtfParameters } from '../physics/hrtf/parameters'
import { createOuterEarParameters, type OuterEarParameters } from '../physics/outerEar/parameters'

export type BinauralRenderOptions = {
  direction: SourceDirection
  outerEarParameters?: OuterEarParameters
  middleEarParameters?: MiddleEarParameters
  hrtfParameters?: HrtfParameters
  hrirOptions?: Omit<HrirOptions, 'sampleRate' | 'sharedTransferAtFrequency'>
}

export type BinauralRender = {
  left: Float32Array
  right: Float32Array
  sampleRate: number
  hrir: HrirPair
}

/**
 * Linear, FFT-based convolution. The output retains the full tail and is not
 * normalized so callers can preserve meaningful interaural level differences.
 */
export function convolveLinear(signal: Float32Array, impulseResponse: Float64Array): Float64Array {
  if (signal.length === 0 || impulseResponse.length === 0) return new Float64Array()
  const outputLength = signal.length + impulseResponse.length - 1
  const fftSize = nextPowerOfTwo(outputLength)
  const signalReal = new Float64Array(fftSize)
  const signalImaginary = new Float64Array(fftSize)
  const impulseReal = new Float64Array(fftSize)
  const impulseImaginary = new Float64Array(fftSize)
  signalReal.set(signal)
  impulseReal.set(impulseResponse)
  fft(signalReal, signalImaginary)
  fft(impulseReal, impulseImaginary)

  for (let index = 0; index < fftSize; index += 1) {
    const real = signalReal[index] * impulseReal[index] - signalImaginary[index] * impulseImaginary[index]
    signalImaginary[index] = signalReal[index] * impulseImaginary[index] + signalImaginary[index] * impulseReal[index]
    signalReal[index] = real
  }
  fft(signalReal, signalImaginary, true)
  return signalReal.slice(0, outputLength)
}

function normalizeStereo(left: Float64Array, right: Float64Array): { left: Float32Array; right: Float32Array } {
  let peak = 0
  for (const sample of left) peak = Math.max(peak, Math.abs(sample))
  for (const sample of right) peak = Math.max(peak, Math.abs(sample))
  const scale = peak > 0.98 ? 0.98 / peak : 1
  return {
    left: Float32Array.from(left, (sample) => sample * scale),
    right: Float32Array.from(right, (sample) => sample * scale),
  }
}

/**
 * Renders mono source samples through the bilateral HRTF/HRIR pair and the
 * same middle-ear transfer in both channels. The caller chooses a model rate;
 * the UI will resample non-48 kHz uploads before using the standard renderer.
 */
export function renderBinaural(
  source: Float32Array,
  sampleRate: number,
  options: BinauralRenderOptions,
): BinauralRender {
  if (source.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError('A non-empty audio source and a valid sample rate are required.')
  }
  const middleEarParameters = options.middleEarParameters ?? createMiddleEarParameters()
  const hrirOptions: HrirOptions = {
    ...defaultHrirOptions,
    ...options.hrirOptions,
    sampleRate,
    sharedTransferAtFrequency: (frequencyHz) => calculateMiddleEarAtFrequency(frequencyHz, middleEarParameters).transfer,
  }
  const hrir = calculateHrirPair(
    options.direction,
    options.outerEarParameters ?? createOuterEarParameters(),
    options.hrtfParameters ?? createHrtfParameters(),
    hrirOptions,
  )
  const left = convolveLinear(source, hrir.left)
  const right = convolveLinear(source, hrir.right)
  const normalized = normalizeStereo(left, right)
  return { ...normalized, sampleRate, hrir }
}
