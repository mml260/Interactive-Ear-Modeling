export type MiddleEarParameterId =
  | 'la' | 'ra' | 'cp' | 'rm' | 'ct'
  | 'cd1' | 'rd1' | 'cd2' | 'rd2' | 'ld' | 'cd3' | 'rd3'
  | 'co' | 'lo' | 'ro' | 'cs' | 'rs' | 'cst' | 'cc' | 'lc' | 'rc'

export type ParameterClassification = 'derived' | 'fitted' | 'simplified'
export type MiddleEarSubsystem = 'cavities' | 'eardrum' | 'ossicles' | 'joint' | 'cochlea'

export type MiddleEarParameter = {
  id: MiddleEarParameterId
  symbol: string
  label: string
  subsystem: MiddleEarSubsystem
  valueSI: number
  unitSI: 'Ω' | 'H' | 'F'
  displayValue: number | string
  displayUnit: 'Ω' | 'mH' | 'μF'
  classification: ParameterClassification
  source: string
  adjustable: boolean
  experimentControl: boolean
}

export type MiddleEarParameters = Record<MiddleEarParameterId, number>

export const lutmanMartinFinalModelSource = {
  id: 'lutman-martin-1979-final-model-v1',
  label: 'Lutman & Martin final fitted analogue model',
  citation: 'M. E. Lutman and A. M. Martin, Development of an electroacoustic analogue model of the middle ear and acoustic reflex (1979), Figure 12 and Table 1.',
  url: 'https://doi.org/10.1016/0022-460X(79)90562-4',
} as const

const source = lutmanMartinFinalModelSource.citation

export const lutmanMartinFinalParameters: readonly MiddleEarParameter[] = [
  { id: 'la', symbol: 'La', label: 'Aditus inertance', subsystem: 'cavities', valueSI: 14e-3, unitSI: 'H', displayValue: 14, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ra', symbol: 'Ra', label: 'Aditus resistance', subsystem: 'cavities', valueSI: 10, unitSI: 'Ω', displayValue: 10, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cp', symbol: 'Cp', label: 'Pneumatic-cavity compliance', subsystem: 'cavities', valueSI: 5.1e-6, unitSI: 'F', displayValue: 5.1, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rm', symbol: 'Rm', label: 'Cavity-wall resistance', subsystem: 'cavities', valueSI: 390, unitSI: 'Ω', displayValue: 390, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ct', symbol: 'Ct', label: 'Tympanic-cavity compliance', subsystem: 'cavities', valueSI: 0.35e-6, unitSI: 'F', displayValue: 0.35, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cd1', symbol: 'CD1', label: 'Eardrum compliance 1', subsystem: 'eardrum', valueSI: 0.8e-6, unitSI: 'F', displayValue: 0.8, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'rd1', symbol: 'RD1', label: 'Eardrum loss 1', subsystem: 'eardrum', valueSI: 200, unitSI: 'Ω', displayValue: 200, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cd2', symbol: 'CD2', label: 'Eardrum compliance 2', subsystem: 'eardrum', valueSI: 0.4e-6, unitSI: 'F', displayValue: 0.4, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rd2', symbol: 'RD2', label: 'Eardrum loss 2', subsystem: 'eardrum', valueSI: 12, unitSI: 'Ω', displayValue: 12, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ld', symbol: 'LD', label: 'Eardrum inertance', subsystem: 'eardrum', valueSI: 15e-3, unitSI: 'H', displayValue: 15, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cd3', symbol: 'CD3', label: 'Eardrum compliance 3', subsystem: 'eardrum', valueSI: 0.2e-6, unitSI: 'F', displayValue: 0.2, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rd3', symbol: 'RD3', label: 'Eardrum loss 3', subsystem: 'eardrum', valueSI: 5900, unitSI: 'Ω', displayValue: 5900, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'co', symbol: 'CO', label: 'Ossicular compliance', subsystem: 'ossicles', valueSI: 1.4e-6, unitSI: 'F', displayValue: 1.4, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'lo', symbol: 'LO', label: 'Ossicular inertance', subsystem: 'ossicles', valueSI: 40e-3, unitSI: 'H', displayValue: 40, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'ro', symbol: 'RO', label: 'Ossicular loss', subsystem: 'ossicles', valueSI: 70, unitSI: 'Ω', displayValue: 70, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'cs', symbol: 'Cs', label: 'Incudo-stapedial compliance', subsystem: 'joint', valueSI: 0.25e-6, unitSI: 'F', displayValue: 0.25, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rs', symbol: 'Rs', label: 'Incudo-stapedial loss', subsystem: 'joint', valueSI: 3000, unitSI: 'Ω', displayValue: 3000, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cst', symbol: 'CST', label: 'Stapedius-muscle compliance', subsystem: 'cochlea', valueSI: Number.POSITIVE_INFINITY, unitSI: 'F', displayValue: '∞', displayUnit: 'μF', classification: 'fitted', source: `${source} The no-reflex operating point is an infinite compliance (electrical short).`, adjustable: false, experimentControl: false },
  { id: 'cc', symbol: 'CC', label: 'Cochlear-load compliance', subsystem: 'cochlea', valueSI: 0.65e-6, unitSI: 'F', displayValue: 0.65, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'lc', symbol: 'LC', label: 'Cochlear-load inertance', subsystem: 'cochlea', valueSI: 45e-3, unitSI: 'H', displayValue: 45, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rc', symbol: 'RC', label: 'Cochlear-load resistance', subsystem: 'cochlea', valueSI: 550, unitSI: 'Ω', displayValue: 550, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
]

export const defaultMiddleEarParameters: Readonly<MiddleEarParameters> = Object.freeze(
  Object.fromEntries(lutmanMartinFinalParameters.map((parameter) => [parameter.id, parameter.valueSI])) as MiddleEarParameters,
)

export function createMiddleEarParameters(overrides: Partial<MiddleEarParameters> = {}): MiddleEarParameters {
  return { ...defaultMiddleEarParameters, ...overrides }
}
