import { calculateMiddleEarAtFrequency, calculateMiddleEarResponse } from './calculateMiddleEar'
import { createMiddleEarParameters, defaultMiddleEarParameters, type MiddleEarParameters } from './parameters'

export type ExperimentId = 'inertance' | 'compliance' | 'loss'

export type FormalExperiment = {
  id: ExperimentId
  number: string
  title: string
  parameter: string
  baselineDisplay: string
  changedDisplay: string
  overrides: Partial<MiddleEarParameters>
  prediction: string
  observationPrompt: string
}

export type ExperimentResult = {
  id: ExperimentId
  baselinePeakHz: number
  changedPeakHz: number
  baselinePeakDb: number
  changedPeakDb: number
  changesAtHz: ReadonlyArray<{ frequencyHz: number; deltaDb: number }>
}

export const formalExperiments: readonly FormalExperiment[] = [
  {
    id: 'inertance', number: '01', title: 'Ossicular inertance', parameter: 'LO',
    baselineDisplay: '40 mH', changedDisplay: '60 mH (+50%)', overrides: { lo: 60e-3 },
    prediction: 'More ossicular inertance should shift the mass-related behavior and reduce transmission most strongly above the broad middle-frequency peak.',
    observationPrompt: 'Compare the peak location and the 2–8 kHz portion of the transfer.',
  },
  {
    id: 'compliance', number: '02', title: 'Eardrum compliance', parameter: 'CD1',
    baselineDisplay: '0.80 μF', changedDisplay: '0.10 μF (−87.5%)', overrides: { cd1: 0.1e-6 },
    prediction: 'Less eardrum compliance should stiffen the eardrum branch and alter the middle-frequency transfer around the broad peak.',
    observationPrompt: 'Compare the 500–2,000 Hz transfer and the broad peak location.',
  },
  {
    id: 'loss', number: '03', title: 'Ossicular loss', parameter: 'RO',
    baselineDisplay: '70 Ω', changedDisplay: '300 Ω (+329%)', overrides: { ro: 300 },
    prediction: 'More ossicular loss should dissipate more energy and reduce transmission around the broad resonance.',
    observationPrompt: 'Compare the broad peak height and the 500–2,000 Hz region.',
  },
] as const

const responseFrequencies = Array.from({ length: 801 }, (_, index) => 20 * (1000 ** (index / 800)))
const evidenceFrequencies = [250, 500, 1000, 2000, 4000] as const

export function evaluateFormalExperiment(experiment: FormalExperiment): ExperimentResult {
  const baseline = calculateMiddleEarResponse(responseFrequencies, defaultMiddleEarParameters)
  const changedParameters = createMiddleEarParameters(experiment.overrides)
  const changed = calculateMiddleEarResponse(responseFrequencies, changedParameters)
  return {
    id: experiment.id,
    baselinePeakHz: baseline.peak.frequencyHz,
    changedPeakHz: changed.peak.frequencyHz,
    baselinePeakDb: baseline.peak.magnitudeDb,
    changedPeakDb: changed.peak.magnitudeDb,
    changesAtHz: evidenceFrequencies.map((frequencyHz) => ({
      frequencyHz,
      deltaDb: calculateMiddleEarAtFrequency(frequencyHz, changedParameters).magnitudeDb
        - calculateMiddleEarAtFrequency(frequencyHz, defaultMiddleEarParameters).magnitudeDb,
    })),
  }
}

export const formalExperimentResults = formalExperiments.map(evaluateFormalExperiment)
