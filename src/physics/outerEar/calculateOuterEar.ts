import { Complex } from '../core/complex'
import { defaultOuterEarParameters, type OuterEarParameters } from './parameters'

const SPEED_OF_SOUND_MPS = 343

export type OuterEarComponents = {
  reflector: Complex
  cavity: Complex
  canal: Complex
  pinna: Complex
}

export type OuterEarInfo = {
  canalFundamentalHz: number
  helmholtzHz: number
  firstNotchHz: number
  reflectorPeakHz: number
}

export type OuterEarPoint = {
  frequencyHz: number
  transfer: Complex
  components: OuterEarComponents
  info: OuterEarInfo
  magnitudeDb: number
  phaseRadians: number
}

export type OuterEarResponse = {
  points: OuterEarPoint[]
  normalizationMagnitude: number
}

type RawOuterEarPoint = Omit<OuterEarPoint, 'transfer' | 'magnitudeDb' | 'phaseRadians'> & {
  rawTransfer: Complex
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

function cosineDegrees(degrees: number): number {
  return Math.cos(degreesToRadians(degrees))
}

function sineDegrees(degrees: number): number {
  return Math.sin(degreesToRadians(degrees))
}

function magnitudeToDecibels(value: number): number {
  return 20 * Math.log10(Math.max(value, Number.MIN_VALUE))
}

function calculateRawOuterEarAtFrequency(
  frequencyHz: number,
  parameters: OuterEarParameters,
): RawOuterEarPoint {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError('Frequency must be a finite value greater than 0 Hz.')
  }

  const canalLengthM = parameters.canalLengthMm / 1000
  const canalRadiusM = parameters.canalDiameterMm / 2000
  const conchaDepthM = parameters.conchaDepthMm / 1000
  const conchaVolumeM3 = parameters.conchaVolumeCm3 * 1e-6
  const apertureRadiusM = parameters.apertureDiameterMm / 2000
  const reflectorDiameterM = parameters.reflectorDiameterMm / 1000
  const focalLengthM = parameters.focalLengthMm / 1000
  const pathLengthM = parameters.pathLengthMm / 1000
  const angularFrequency = 2 * Math.PI * frequencyHz
  const waveNumber = angularFrequency / SPEED_OF_SOUND_MPS
  const sourceAngle = Math.hypot(parameters.azimuthDegrees, parameters.elevationDegrees) * Math.PI / 180

  const reflectorFocusHz = SPEED_OF_SOUND_MPS / (4 * Math.max(focalLengthM, Number.EPSILON))
  const reflectorRatio = Math.PI * reflectorDiameterM * frequencyHz / SPEED_OF_SOUND_MPS
  const directivity = reflectorRatio ** 2 / (1 + reflectorRatio ** 2)
  const focusShape = 1 + 0.65 * Math.exp(-0.5 * (Math.log2(Math.max(frequencyHz, 1) / reflectorFocusHz) / 0.85) ** 2)
  const reflector = new Complex(1 + Math.cos(sourceAngle) ** 2 * directivity * (focusShape - 1), 0)

  const apertureAreaM2 = Math.PI * apertureRadiusM ** 2
  const effectiveNeckLengthM = conchaDepthM + 1.7 * apertureRadiusM
  const helmholtzHz = SPEED_OF_SOUND_MPS / (2 * Math.PI) * Math.sqrt(apertureAreaM2 / (conchaVolumeM3 * effectiveNeckLengthM))
  const cavityQ = 3.2
  const normalizedFrequency = Math.max(frequencyHz, 1) / helmholtzHz
  const cavityNumerator = new Complex(0, normalizedFrequency / cavityQ)
  const cavityDenominator = new Complex(1 - normalizedFrequency ** 2, normalizedFrequency / cavityQ)
  const cavity = Complex.ONE.add(cavityNumerator.divide(cavityDenominator).scale(1.4))

  const tubeDenominator = new Complex(
    Math.cos(waveNumber * canalLengthM),
    parameters.canalLoss * Math.sin(waveNumber * canalLengthM),
  )
  const areaGain = 1 + 0.12 * (canalRadiusM / 0.00375 - 1)
  const canal = tubeDenominator.reciprocal().scale(areaGain)

  const directionGain = Math.max(0, cosineDegrees(parameters.azimuthDegrees))
    * Math.max(0.25, cosineDegrees(parameters.elevationDegrees))
  const effectivePathM = pathLengthM * (1 + 0.22 * sineDegrees(parameters.azimuthDegrees) * cosineDegrees(parameters.elevationDegrees))
  const reflection = parameters.reflectionStrength * directionGain
  const delayedReflection = new Complex(
    Math.cos(-waveNumber * effectivePathM),
    Math.sin(-waveNumber * effectivePathM),
  ).scale(reflection)
  const pinna = Complex.ONE.add(delayedReflection)

  const rawTransfer = reflector.multiply(cavity).multiply(canal).multiply(pinna)
  const info = {
    canalFundamentalHz: SPEED_OF_SOUND_MPS / (4 * canalLengthM),
    helmholtzHz,
    firstNotchHz: SPEED_OF_SOUND_MPS / (2 * effectivePathM),
    reflectorPeakHz: reflectorFocusHz,
  }

  return { frequencyHz, rawTransfer, components: { reflector, cavity, canal, pinna }, info }
}

function normalizeRawPoint(rawPoint: RawOuterEarPoint, normalizationMagnitude: number): OuterEarPoint {
  const transfer = rawPoint.rawTransfer.scale(1 / normalizationMagnitude)
  return {
    frequencyHz: rawPoint.frequencyHz,
    transfer,
    components: rawPoint.components,
    info: rawPoint.info,
    magnitudeDb: magnitudeToDecibels(transfer.magnitude()),
    phaseRadians: transfer.phaseRadians(),
  }
}

/**
 * Reproduces MATLAB's scalar magnitude normalization using the supplied reference frequency.
 * For exact vector parity, prefer calculateOuterEarResponse(), which uses the first vector bin.
 */
export function calculateOuterEarAtFrequency(
  frequencyHz: number,
  parameters: OuterEarParameters = defaultOuterEarParameters,
  normalizationReferenceHz = 100,
): OuterEarPoint {
  const reference = calculateRawOuterEarAtFrequency(normalizationReferenceHz, parameters)
  const normalizationMagnitude = Math.max(reference.rawTransfer.magnitude(), Number.EPSILON)
  return normalizeRawPoint(calculateRawOuterEarAtFrequency(frequencyHz, parameters), normalizationMagnitude)
}

export function calculateOuterEarResponse(
  frequenciesHz: readonly number[],
  parameters: OuterEarParameters = defaultOuterEarParameters,
): OuterEarResponse {
  if (frequenciesHz.length === 0) {
    throw new RangeError('At least one frequency is required to calculate a response.')
  }

  const rawPoints = frequenciesHz.map((frequencyHz) => calculateRawOuterEarAtFrequency(frequencyHz, parameters))
  const normalizationMagnitude = Math.max(rawPoints[0].rawTransfer.magnitude(), Number.EPSILON)
  return {
    points: rawPoints.map((point) => normalizeRawPoint(point, normalizationMagnitude)),
    normalizationMagnitude,
  }
}
