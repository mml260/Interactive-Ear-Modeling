import { describe, expect, it } from 'vitest'
import { Complex } from '../core/complex'
import { compliance, inertance, parallel, resistance, series } from '../core/impedance'
import { calculateMiddleEarAtFrequency, calculateMiddleEarResponse } from './calculateMiddleEar'
import { createMiddleEarParameters, defaultMiddleEarParameters, zwislockiBaselineParameters } from './parameters'

const closeTo = (value: number, expected: number, precision = 10) => {
  expect(value).toBeCloseTo(expected, precision)
}

describe('acoustic impedance primitives', () => {
  it('implements ZR = R, ZL = jωL, and ZC = 1/(jωC)', () => {
    const frequencyHz = 1000
    const resistor = resistance(75)
    const inductor = inertance(frequencyHz, 10e-3)
    const capacitor = compliance(frequencyHz, 1e-6)

    closeTo(resistor.real, 75)
    closeTo(resistor.imaginary, 0)
    closeTo(inductor.real, 0)
    closeTo(inductor.imaginary, 2 * Math.PI * 1000 * 10e-3)
    closeTo(capacitor.real, 0)
    closeTo(capacitor.imaginary, -1 / (2 * Math.PI * 1000e-6))
  })

  it('combines series and parallel complex impedances correctly', () => {
    const left = new Complex(20, 10)
    const right = new Complex(20, -10)
    const sum = series(left, right)
    const parallelPair = parallel(left, right)

    closeTo(sum.real, 40)
    closeTo(sum.imaginary, 0)
    closeTo(parallelPair.real, 12.5)
    closeTo(parallelPair.imaginary, 0)
  })
})

describe('middle-ear circuit', () => {
  it('keeps the published baseline source-tagged and complete', () => {
    expect(zwislockiBaselineParameters).toHaveLength(18)
    expect(zwislockiBaselineParameters.every((parameter) => parameter.source.length > 0)).toBe(true)
    expect(zwislockiBaselineParameters.filter((parameter) => parameter.experimentControl).map((parameter) => parameter.id))
      .toEqual(['cd1', 'lo', 'ro'])
  })

  it('returns finite subsystem impedances and a complex transfer at 1 kHz', () => {
    const point = calculateMiddleEarAtFrequency(1000)
    const impedances = Object.values(point.impedances)

    expect(impedances.every((impedance) => Number.isFinite(impedance.real) && Number.isFinite(impedance.imaginary))).toBe(true)
    expect(Number.isFinite(point.transfer.real)).toBe(true)
    expect(Number.isFinite(point.transfer.imaginary)).toBe(true)
    expect(Number.isFinite(point.magnitudeDb)).toBe(true)
    expect(Number.isFinite(point.phaseRadians)).toBe(true)
  })

  it('matches the documented cavity → eardrum/ossicle → joint/cochlea topology at 1 kHz', () => {
    const frequencyHz = 1000
    const parameters = defaultMiddleEarParameters
    const point = calculateMiddleEarAtFrequency(frequencyHz, parameters)
    const cavity = parallel(series(compliance(frequencyHz, parameters.cp), inertance(frequencyHz, parameters.la), resistance(parameters.ra)), resistance(parameters.rm), compliance(frequencyHz, parameters.ct))
    const eardrum = series(compliance(frequencyHz, parameters.cd1), parallel(inertance(frequencyHz, parameters.ld), series(compliance(frequencyHz, parameters.cd2), resistance(parameters.rd2))), resistance(parameters.rd1))
    const ossicles = series(compliance(frequencyHz, parameters.co), inertance(frequencyHz, parameters.lo), resistance(parameters.ro))
    const joint = series(compliance(frequencyHz, parameters.cs), resistance(parameters.rs))
    const cochlea = series(compliance(frequencyHz, parameters.cc), inertance(frequencyHz, parameters.lc), resistance(parameters.rc))
    const load = parallel(joint, cochlea)
    const afterCavity = parallel(eardrum, series(ossicles, load))
    const input = series(cavity, afterCavity)
    const transfer = afterCavity.divide(input).multiply(load.divide(series(ossicles, load)))

    for (const [actual, expected] of [[point.impedances.cavity, cavity], [point.impedances.eardrum, eardrum], [point.impedances.ossicles, ossicles], [point.impedances.joint, joint], [point.impedances.cochlea, cochlea], [point.impedances.load, load], [point.impedances.afterCavity, afterCavity], [point.impedances.input, input], [point.transfer, transfer]] as const) {
      closeTo(actual.real, expected.real)
      closeTo(actual.imaginary, expected.imaginary)
    }
  })

  it('produces a bounded broadband response and responds to the required experiment controls', () => {
    const frequencies = Array.from({ length: 401 }, (_, index) => 20 * (1000 ** (index / 400)))
    const baseline = calculateMiddleEarResponse(frequencies)
    const increasedInertance = calculateMiddleEarResponse(
      frequencies,
      createMiddleEarParameters({ lo: defaultMiddleEarParameters.lo * 1.2 }),
    )
    const increasedCompliance = calculateMiddleEarResponse(
      frequencies,
      createMiddleEarParameters({ cs: defaultMiddleEarParameters.cs * 1.2 }),
    )
    const increasedLoss = calculateMiddleEarResponse(
      frequencies,
      createMiddleEarParameters({ rs: defaultMiddleEarParameters.rs * 1.2 }),
    )

    expect(baseline.peak.frequencyHz).toBeGreaterThan(650)
    expect(baseline.peak.frequencyHz).toBeLessThan(1200)
    expect(baseline.peak.magnitudeDb).toBeGreaterThan(-30)
    expect(baseline.peak.magnitudeDb).toBeLessThan(30)
    expect(baseline.points.at(-1)?.magnitudeDb).toBeLessThan(baseline.peak.magnitudeDb - 10)
    expect(increasedInertance.points[200].magnitudeDb).not.toBeCloseTo(baseline.points[200].magnitudeDb, 8)
    expect(increasedCompliance.points[200].magnitudeDb).not.toBeCloseTo(baseline.points[200].magnitudeDb, 8)
    expect(increasedLoss.points[200].magnitudeDb).not.toBeCloseTo(baseline.points[200].magnitudeDb, 8)
  })
})
