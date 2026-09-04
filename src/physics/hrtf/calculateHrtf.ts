import { Complex } from '../core/complex'
import { calculateOuterEarAtFrequency } from '../outerEar/calculateOuterEar'
import { createOuterEarParameters, type OuterEarParameters } from '../outerEar/parameters'
import { createHrtfParameters, type HrtfParameters } from './parameters'

const SPEED_OF_SOUND_MPS = 343
const CAUSAL_REFERENCE_DELAY_SECONDS = 0.001

export type SourceDirection = {
  /** 0° is front; positive azimuth is the listener's left. */
  azimuthDegrees: number
  /** Positive elevation is up. */
  elevationDegrees: number
}

export type EarHrtf = {
  transfer: Complex
  outerEarTransfer: Complex
  elevationCue: Complex
  headShadowGain: number
  timeDelaySeconds: number
}

export type HrtfPoint = {
  frequencyHz: number
  left: EarHrtf
  right: EarHrtf
  ildDb: number
}

export type HrtfResponse = {
  direction: SourceDirection
  points: HrtfPoint[]
  /** Positive means that the left ear leads the right ear. */
  itdSeconds: number
  maximumItdSeconds: number
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

function complexDelay(frequencyHz: number, delaySeconds: number): Complex {
  const phase = -2 * Math.PI * frequencyHz * delaySeconds
  return new Complex(Math.cos(phase), Math.sin(phase))
}

function decibels(value: number): number {
  return 20 * Math.log10(Math.max(value, Number.MIN_VALUE))
}

function assertDirection(direction: SourceDirection): void {
  if (!Number.isFinite(direction.azimuthDegrees) || !Number.isFinite(direction.elevationDegrees)) {
    throw new RangeError('Source azimuth and elevation must be finite numbers.')
  }
}

function elevationSpectralCue(
  frequencyHz: number,
  elevationDegrees: number,
  outerEarParameters: OuterEarParameters,
  parameters: HrtfParameters,
): Complex {
  const elevation = Math.sin(degreesToRadians(elevationDegrees))
  if (Math.abs(elevation) < Number.EPSILON) return Complex.ONE

  // A small elevation-dependent delayed reflection moves a peak/notch pattern
  // without claiming to reproduce a measured pinna geometry.
  const pathMeters = outerEarParameters.pathLengthMm / 1000
    * parameters.elevationPathShiftRatio * elevation
  const reflection = complexDelay(frequencyHz, pathMeters / SPEED_OF_SOUND_MPS)
    .scale(parameters.elevationReflectionStrength * Math.abs(elevation))
  return Complex.ONE.add(reflection)
}

function headShadowGain(
  frequencyHz: number,
  azimuthDegrees: number,
  ear: 'left' | 'right',
  parameters: HrtfParameters,
): number {
  const lateralAmount = Math.abs(Math.sin(degreesToRadians(azimuthDegrees)))
  const highFrequencyAmount = frequencyHz / (frequencyHz + parameters.headShadowCornerHz)
  const attenuationDb = parameters.headShadowMaxDb * lateralAmount * highFrequencyAmount
  const sourceIsOnLeft = azimuthDegrees > 0
  const isFarEar = sourceIsOnLeft ? ear === 'right' : azimuthDegrees < 0 && ear === 'left'
  return isFarEar ? 10 ** (-attenuationDb / 20) : 1
}

function earOuterParameters(
  direction: SourceDirection,
  ear: 'left' | 'right',
  outerEarParameters: OuterEarParameters,
): OuterEarParameters {
  // Mirror the current single-ear outer-ear prototype across the median plane.
  // This gives each ear its own directional spectral response while retaining
  // the validated HW1 model unchanged.
  const mirroredAzimuth = ear === 'left' ? direction.azimuthDegrees : -direction.azimuthDegrees
  return createOuterEarParameters({
    ...outerEarParameters,
    azimuthDegrees: mirroredAzimuth,
    elevationDegrees: direction.elevationDegrees,
  })
}

export function calculateHrtfAtFrequency(
  frequencyHz: number,
  direction: SourceDirection,
  outerEarParameters: OuterEarParameters = createOuterEarParameters(),
  hrtfParameters: HrtfParameters = createHrtfParameters(),
): HrtfPoint {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError('Frequency must be a finite value greater than 0 Hz.')
  }
  assertDirection(direction)

  const headDiameterMeters = hrtfParameters.headDiameterMm / 1000
  if (!Number.isFinite(headDiameterMeters) || headDiameterMeters <= 0) {
    throw new RangeError('Head diameter must be a finite value greater than zero.')
  }

  const itdSeconds = headDiameterMeters / SPEED_OF_SOUND_MPS * Math.sin(degreesToRadians(direction.azimuthDegrees))
  const leftDelaySeconds = CAUSAL_REFERENCE_DELAY_SECONDS - itdSeconds / 2
  const rightDelaySeconds = CAUSAL_REFERENCE_DELAY_SECONDS + itdSeconds / 2
  const leftOuterParameters = earOuterParameters(direction, 'left', outerEarParameters)
  const rightOuterParameters = earOuterParameters(direction, 'right', outerEarParameters)
  const leftOuterEarTransfer = calculateOuterEarAtFrequency(frequencyHz, leftOuterParameters).transfer
  const rightOuterEarTransfer = calculateOuterEarAtFrequency(frequencyHz, rightOuterParameters).transfer
  const leftElevationCue = elevationSpectralCue(frequencyHz, direction.elevationDegrees, leftOuterParameters, hrtfParameters)
  const rightElevationCue = elevationSpectralCue(frequencyHz, direction.elevationDegrees, rightOuterParameters, hrtfParameters)
  const leftHeadShadowGain = headShadowGain(frequencyHz, direction.azimuthDegrees, 'left', hrtfParameters)
  const rightHeadShadowGain = headShadowGain(frequencyHz, direction.azimuthDegrees, 'right', hrtfParameters)
  const leftTransfer = leftOuterEarTransfer.multiply(leftElevationCue)
    .multiply(complexDelay(frequencyHz, leftDelaySeconds)).scale(leftHeadShadowGain)
  const rightTransfer = rightOuterEarTransfer.multiply(rightElevationCue)
    .multiply(complexDelay(frequencyHz, rightDelaySeconds)).scale(rightHeadShadowGain)

  return {
    frequencyHz,
    left: {
      transfer: leftTransfer, outerEarTransfer: leftOuterEarTransfer, elevationCue: leftElevationCue,
      headShadowGain: leftHeadShadowGain, timeDelaySeconds: leftDelaySeconds,
    },
    right: {
      transfer: rightTransfer, outerEarTransfer: rightOuterEarTransfer, elevationCue: rightElevationCue,
      headShadowGain: rightHeadShadowGain, timeDelaySeconds: rightDelaySeconds,
    },
    ildDb: decibels(leftTransfer.magnitude() / rightTransfer.magnitude()),
  }
}

export function calculateHrtfResponse(
  frequenciesHz: readonly number[],
  direction: SourceDirection,
  outerEarParameters: OuterEarParameters = createOuterEarParameters(),
  hrtfParameters: HrtfParameters = createHrtfParameters(),
): HrtfResponse {
  if (frequenciesHz.length === 0) throw new RangeError('At least one frequency is required to calculate an HRTF response.')
  assertDirection(direction)
  const maximumItdSeconds = hrtfParameters.headDiameterMm / 1000 / SPEED_OF_SOUND_MPS
  const itdSeconds = maximumItdSeconds * Math.sin(degreesToRadians(direction.azimuthDegrees))
  return {
    direction: { ...direction },
    points: frequenciesHz.map((frequencyHz) => calculateHrtfAtFrequency(frequencyHz, direction, outerEarParameters, hrtfParameters)),
    itdSeconds,
    maximumItdSeconds,
  }
}
