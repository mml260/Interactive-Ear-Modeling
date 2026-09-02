import { Complex } from '../core/complex'
import { compliance, inertance, parallel, resistance, series } from '../core/impedance'
import { defaultMiddleEarParameters, type MiddleEarParameters } from './parameters'

export type MiddleEarImpedances = {
  cavity: Complex
  eardrum: Complex
  ossicles: Complex
  joint: Complex
  cochlea: Complex
  load: Complex
  afterCavity: Complex
  input: Complex
}

export type MiddleEarPoint = {
  frequencyHz: number
  impedances: MiddleEarImpedances
  transfer: Complex
  magnitudeDb: number
  phaseRadians: number
}

export type MiddleEarResponse = {
  points: MiddleEarPoint[]
  peak: MiddleEarPoint
}

function magnitudeToDecibels(value: number): number {
  return 20 * Math.log10(Math.max(value, Number.MIN_VALUE))
}

export function calculateMiddleEarAtFrequency(
  frequencyHz: number,
  parameters: MiddleEarParameters = defaultMiddleEarParameters,
): MiddleEarPoint {
  const cavity = parallel(
    series(
      compliance(frequencyHz, parameters.cp),
      inertance(frequencyHz, parameters.la),
      resistance(parameters.ra),
    ),
    resistance(parameters.rm),
    compliance(frequencyHz, parameters.ct),
  )

  const eardrum = series(
    resistance(parameters.rd1),
    compliance(frequencyHz, parameters.cd1),
    parallel(
      inertance(frequencyHz, parameters.ld),
      series(compliance(frequencyHz, parameters.cd2), resistance(parameters.rd2)),
    ),
    parallel(compliance(frequencyHz, parameters.cd3), resistance(parameters.rd3)),
  )

  const ossicles = series(
    compliance(frequencyHz, parameters.co),
    inertance(frequencyHz, parameters.lo),
    resistance(parameters.ro),
  )
  const joint = series(compliance(frequencyHz, parameters.cs), resistance(parameters.rs))
  const cochlea = series(
    compliance(frequencyHz, parameters.cst),
    compliance(frequencyHz, parameters.cc),
    inertance(frequencyHz, parameters.lc),
    resistance(parameters.rc),
  )

  const load = parallel(joint, cochlea)
  const afterCavity = parallel(eardrum, series(ossicles, load))
  const input = series(cavity, afterCavity)
  const transfer = afterCavity.divide(input).multiply(load.divide(series(ossicles, load)))

  return {
    frequencyHz,
    impedances: { cavity, eardrum, ossicles, joint, cochlea, load, afterCavity, input },
    transfer,
    magnitudeDb: magnitudeToDecibels(transfer.magnitude()),
    phaseRadians: transfer.phaseRadians(),
  }
}

export function calculateMiddleEarResponse(
  frequenciesHz: readonly number[],
  parameters: MiddleEarParameters = defaultMiddleEarParameters,
): MiddleEarResponse {
  if (frequenciesHz.length === 0) {
    throw new RangeError('At least one frequency is required to calculate a response.')
  }

  const points = frequenciesHz.map((frequencyHz) => calculateMiddleEarAtFrequency(frequencyHz, parameters))
  const peak = points.reduce((highest, point) => point.magnitudeDb > highest.magnitudeDb ? point : highest)
  return { points, peak }
}
