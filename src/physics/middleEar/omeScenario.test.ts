import { describe, expect, it } from 'vitest'
import { calculateMiddleEarAtFrequency } from './calculateMiddleEar'
import { createOmeScenario } from './omeScenario'
import { defaultMiddleEarParameters } from './parameters'

describe('OME educational sensitivity scenario', () => {
  it('keeps the baseline unchanged at zero severity', () => {
    expect(createOmeScenario(defaultMiddleEarParameters, 0).parameters).toEqual(defaultMiddleEarParameters)
  })

  it('applies the documented stiffness, inertance, and loss shifts at full severity', () => {
    const scenario = createOmeScenario(defaultMiddleEarParameters, 1)
    expect(scenario.parameters.cd1).toBeCloseTo(defaultMiddleEarParameters.cd1 * 0.58)
    expect(scenario.parameters.lo).toBeCloseTo(defaultMiddleEarParameters.lo * 1.45)
    expect(scenario.parameters.ro).toBeCloseTo(defaultMiddleEarParameters.ro * 2.1)
  })

  it('changes the modeled transfer without presenting it as a clinical calibration', () => {
    const baseline = calculateMiddleEarAtFrequency(1000, defaultMiddleEarParameters)
    const affected = calculateMiddleEarAtFrequency(1000, createOmeScenario(defaultMiddleEarParameters, 1).parameters)
    expect(affected.magnitudeDb).not.toBeCloseTo(baseline.magnitudeDb, 5)
  })
})
