export type MiddleEarParameterId =
  | 'la' | 'ra' | 'cp' | 'rm' | 'ct'
  | 'cd1' | 'rd1' | 'cd2' | 'rd2' | 'ld'
  | 'co' | 'lo' | 'ro' | 'cs' | 'rs' | 'cc' | 'lc' | 'rc'

export type ParameterClassification = 'derived' | 'fitted' | 'simplified'
export type MiddleEarSubsystem = 'cavities' | 'eardrum' | 'ossicles' | 'joint' | 'cochlea'

export type MiddleEarParameter = {
  id: MiddleEarParameterId
  symbol: string
  label: string
  subsystem: MiddleEarSubsystem
  valueSI: number
  unitSI: 'Ω' | 'H' | 'F'
  displayValue: number
  displayUnit: 'Ω' | 'mH' | 'μF'
  classification: ParameterClassification
  source: string
  adjustable: boolean
  experimentControl: boolean
}

export type MiddleEarParameters = Record<MiddleEarParameterId, number>

export const zwislockiBaselineSource = {
  id: 'zwislocki-1962-baseline-v1',
  label: 'Zwislocki-style historical analogue baseline',
  citation: 'J. Zwislocki, Analysis of the Middle-Ear Function. Part I: Input Impedance (1962).',
  url: 'https://doi.org/10.1121/1.1918382',
} as const

const source = zwislockiBaselineSource.citation

export const zwislockiBaselineParameters: readonly MiddleEarParameter[] = [
  { id: 'la', symbol: 'La', label: 'Aditus inertance', subsystem: 'cavities', valueSI: 14e-3, unitSI: 'H', displayValue: 14, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ra', symbol: 'Ra', label: 'Aditus resistance', subsystem: 'cavities', valueSI: 1000, unitSI: 'Ω', displayValue: 1000, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cp', symbol: 'Cp', label: 'Pneumatic-cavity compliance', subsystem: 'cavities', valueSI: 5.1e-6, unitSI: 'F', displayValue: 5.1, displayUnit: 'μF', classification: 'derived', source, adjustable: true, experimentControl: false },
  { id: 'rm', symbol: 'Rm', label: 'Cavity-wall resistance', subsystem: 'cavities', valueSI: 60, unitSI: 'Ω', displayValue: 60, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ct', symbol: 'Ct', label: 'Tympanic-cavity compliance', subsystem: 'cavities', valueSI: 0.35e-6, unitSI: 'F', displayValue: 0.35, displayUnit: 'μF', classification: 'derived', source, adjustable: true, experimentControl: false },
  { id: 'cd1', symbol: 'CD1', label: 'Eardrum compliance 1', subsystem: 'eardrum', valueSI: 0.23e-6, unitSI: 'F', displayValue: 0.23, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'rd1', symbol: 'RD1', label: 'Eardrum loss 1', subsystem: 'eardrum', valueSI: 40, unitSI: 'Ω', displayValue: 40, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cd2', symbol: 'CD2', label: 'Eardrum compliance 2', subsystem: 'eardrum', valueSI: 0.4e-6, unitSI: 'F', displayValue: 0.4, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rd2', symbol: 'RD2', label: 'Eardrum loss 2', subsystem: 'eardrum', valueSI: 220, unitSI: 'Ω', displayValue: 220, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'ld', symbol: 'LD', label: 'Eardrum inertance', subsystem: 'eardrum', valueSI: 15e-3, unitSI: 'H', displayValue: 15, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'co', symbol: 'CO', label: 'Ossicular compliance', subsystem: 'ossicles', valueSI: 1.4e-6, unitSI: 'F', displayValue: 1.4, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'lo', symbol: 'LO', label: 'Ossicular inertance', subsystem: 'ossicles', valueSI: 40e-3, unitSI: 'H', displayValue: 40, displayUnit: 'mH', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'ro', symbol: 'RO', label: 'Ossicular loss', subsystem: 'ossicles', valueSI: 70, unitSI: 'Ω', displayValue: 70, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: true },
  { id: 'cs', symbol: 'Cs', label: 'Incudo-stapedial compliance', subsystem: 'joint', valueSI: 0.25e-6, unitSI: 'F', displayValue: 0.25, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'rs', symbol: 'Rs', label: 'Incudo-stapedial loss', subsystem: 'joint', valueSI: 3000, unitSI: 'Ω', displayValue: 3000, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'cc', symbol: 'CC', label: 'Cochlear-load compliance', subsystem: 'cochlea', valueSI: 0.6e-6, unitSI: 'F', displayValue: 0.6, displayUnit: 'μF', classification: 'fitted', source, adjustable: true, experimentControl: false },
  { id: 'lc', symbol: 'LC', label: 'Cochlear-load inertance', subsystem: 'cochlea', valueSI: 0, unitSI: 'H', displayValue: 0, displayUnit: 'mH', classification: 'simplified', source, adjustable: true, experimentControl: false },
  { id: 'rc', symbol: 'RC', label: 'Cochlear-load resistance', subsystem: 'cochlea', valueSI: 600, unitSI: 'Ω', displayValue: 600, displayUnit: 'Ω', classification: 'fitted', source, adjustable: true, experimentControl: false },
]

export const defaultMiddleEarParameters: Readonly<MiddleEarParameters> = Object.freeze(
  Object.fromEntries(zwislockiBaselineParameters.map((parameter) => [parameter.id, parameter.valueSI])) as MiddleEarParameters,
)

export function createMiddleEarParameters(overrides: Partial<MiddleEarParameters> = {}): MiddleEarParameters {
  return { ...defaultMiddleEarParameters, ...overrides }
}
