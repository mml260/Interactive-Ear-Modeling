import { createMiddleEarParameters, type MiddleEarParameters } from './parameters'

export type OmeScenario = {
  severity: number
  parameters: MiddleEarParameters
  description: string
}

export const omeScenarioEvidence = {
  label: 'Educational otitis-media-with-effusion sensitivity profile',
  sources: [
    'Merchant & Neely (2021), JASA 150, 969, DOI: 10.1121/10.0005822.',
    'Merchant & Neely (2023), Ear and Hearing, DOI: 10.1097/AUD.0000000000001317.',
    'Gan et al. (2016), JASA 139, 1825, DOI: 10.1121/1.4944949.',
  ],
  limitation: 'The multipliers below are a transparent educational sensitivity scenario, not a fit to a child or a diagnostic tool.',
} as const

function clampSeverity(severity: number): number {
  if (!Number.isFinite(severity)) throw new RangeError('OME severity must be finite.')
  return Math.min(1, Math.max(0, severity))
}

/**
 * Maps OME-like loading to the existing lumped circuit without claiming a patient-specific fit.
 * Higher severity: less compliant tympanic/joint path, higher effective inertance, and more loss.
 */
export function createOmeScenario(base: MiddleEarParameters, severity: number): OmeScenario {
  const amount = clampSeverity(severity)
  const blend = (normal: number, affected: number) => normal + (affected - normal) * amount
  const parameters = createMiddleEarParameters({
    ...base,
    cd1: blend(base.cd1, base.cd1 * 0.58),
    cd2: blend(base.cd2, base.cd2 * 0.58),
    cd3: blend(base.cd3, base.cd3 * 0.58),
    cs: blend(base.cs, base.cs * 0.66),
    lo: blend(base.lo, base.lo * 1.45),
    ro: blend(base.ro, base.ro * 2.1),
    rd1: blend(base.rd1, base.rd1 * 1.7),
    rd2: blend(base.rd2, base.rd2 * 1.7),
    rd3: blend(base.rd3, base.rd3 * 1.7),
  })
  return {
    severity: amount,
    parameters,
    description: amount === 0
      ? 'Baseline lumped-circuit profile.'
      : 'OME-like loading: reduced compliance with increased inertance and loss.',
  }
}
