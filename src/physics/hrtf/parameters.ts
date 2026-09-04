export type HrtfParameterId =
  | 'headDiameterMm'
  | 'headShadowMaxDb'
  | 'headShadowCornerHz'
  | 'elevationReflectionStrength'
  | 'elevationPathShiftRatio'

export type HrtfParameterClassification = 'derived' | 'fitted' | 'assumed'

export type HrtfParameter = {
  id: HrtfParameterId
  label: string
  value: number
  unit: string
  classification: HrtfParameterClassification
  source: string
  adjustable: boolean
  min: number
  max: number
  step: number
}

export type HrtfParameters = Record<HrtfParameterId, number>

/**
 * These are pedagogical model controls, not a measured listener profile.
 * The head diameter is intentionally user-adjustable because it controls the
 * geometric ITD predicted by the course-note relation Δt = d sin(azimuth) / c.
 */
export const hw3HrtfParameters: readonly HrtfParameter[] = [
  {
    id: 'headDiameterMm', label: 'Head diameter', value: 175, unit: 'mm', classification: 'assumed',
    source: 'HW3 pedagogical default; user-adjustable head geometry. The supplied notes provide the geometric ITD relationship but no subject-specific diameter.',
    adjustable: true, min: 140, max: 220, step: 1,
  },
  {
    id: 'headShadowMaxDb', label: 'Maximum head-shadow attenuation', value: 18, unit: 'dB', classification: 'assumed',
    source: 'HW3 transparent head-shadow approximation. Chosen to demonstrate increasing high-frequency ILD, not to fit a measured HRTF.',
    adjustable: false, min: 0, max: 30, step: 0.5,
  },
  {
    id: 'headShadowCornerHz', label: 'Head-shadow transition', value: 1000, unit: 'Hz', classification: 'assumed',
    source: 'HW3 transparent head-shadow approximation; sets the frequency range in which contralateral attenuation grows.',
    adjustable: false, min: 200, max: 4000, step: 50,
  },
  {
    id: 'elevationReflectionStrength', label: 'Elevation spectral-cue strength', value: 0.28, unit: 'ratio', classification: 'assumed',
    source: 'HW3 transparent delayed-reflection approximation for elevation-dependent pinna/concha spectral structure.',
    adjustable: false, min: 0, max: 0.8, step: 0.01,
  },
  {
    id: 'elevationPathShiftRatio', label: 'Elevation path shift', value: 0.22, unit: 'ratio', classification: 'assumed',
    source: 'HW3 transparent delayed-reflection approximation; changes the spectral interference path with elevation.',
    adjustable: false, min: 0, max: 0.6, step: 0.01,
  },
]

export const defaultHrtfParameters: Readonly<HrtfParameters> = Object.freeze(
  Object.fromEntries(hw3HrtfParameters.map((parameter) => [parameter.id, parameter.value])) as HrtfParameters,
)

export function createHrtfParameters(overrides: Partial<HrtfParameters> = {}): HrtfParameters {
  return { ...defaultHrtfParameters, ...overrides }
}
