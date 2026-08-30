export type OuterEarParameterId =
  | 'canalLengthMm' | 'canalDiameterMm' | 'conchaDepthMm' | 'conchaVolumeCm3'
  | 'apertureDiameterMm' | 'reflectorDiameterMm' | 'focalLengthMm' | 'pathLengthMm'
  | 'reflectionStrength' | 'azimuthDegrees' | 'elevationDegrees' | 'canalLoss'

export type OuterEarParameterClassification = 'derived' | 'fitted' | 'assumed'

export type OuterEarParameter = {
  id: OuterEarParameterId
  label: string
  value: number
  unit: string
  classification: OuterEarParameterClassification
  source: string
  adjustable: boolean
}

export type OuterEarParameters = Record<OuterEarParameterId, number>

const source = 'Current HW1 outer_ear_model.m prototype; numerical provenance pending source review.'

export const hw1OuterEarParameters: readonly OuterEarParameter[] = [
  { id: 'canalLengthMm', label: 'Canal length', value: 25, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'canalDiameterMm', label: 'Canal diameter', value: 7.5, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'conchaDepthMm', label: 'Concha depth', value: 12, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'conchaVolumeCm3', label: 'Concha volume', value: 10, unit: 'cm³', classification: 'assumed', source, adjustable: true },
  { id: 'apertureDiameterMm', label: 'Aperture diameter', value: 18, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'reflectorDiameterMm', label: 'Reflector diameter', value: 55, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'focalLengthMm', label: 'Reflector focal length', value: 28, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'pathLengthMm', label: 'Reflection path', value: 55, unit: 'mm', classification: 'assumed', source, adjustable: true },
  { id: 'reflectionStrength', label: 'Reflection strength', value: 0.55, unit: 'ratio', classification: 'fitted', source, adjustable: true },
  { id: 'azimuthDegrees', label: 'Source azimuth', value: 0, unit: '°', classification: 'assumed', source, adjustable: true },
  { id: 'elevationDegrees', label: 'Source elevation', value: 0, unit: '°', classification: 'assumed', source, adjustable: true },
  { id: 'canalLoss', label: 'Canal loss factor', value: 0.12, unit: 'ratio', classification: 'fitted', source, adjustable: true },
]

export const defaultOuterEarParameters: Readonly<OuterEarParameters> = Object.freeze(
  Object.fromEntries(hw1OuterEarParameters.map((parameter) => [parameter.id, parameter.value])) as OuterEarParameters,
)

export function createOuterEarParameters(overrides: Partial<OuterEarParameters> = {}): OuterEarParameters {
  return { ...defaultOuterEarParameters, ...overrides }
}
