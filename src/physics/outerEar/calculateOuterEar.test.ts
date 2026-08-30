import { describe, expect, it } from 'vitest'
import { calculateOuterEarAtFrequency, calculateOuterEarResponse } from './calculateOuterEar'
import { createOuterEarParameters, defaultOuterEarParameters, hw1OuterEarParameters } from './parameters'

describe('outer-ear MATLAB port', () => {
  it('keeps the twelve HW1 parameters documented and adjustable', () => {
    expect(hw1OuterEarParameters).toHaveLength(12)
    expect(hw1OuterEarParameters.every((parameter) => parameter.adjustable)).toBe(true)
    expect(hw1OuterEarParameters.every((parameter) => parameter.source.length > 0)).toBe(true)
  })

  it('normalizes a response to the magnitude of its first frequency bin, matching the MATLAB vector behavior', () => {
    const response = calculateOuterEarResponse([100, 1000, 3200, 8000])

    expect(response.points[0].magnitudeDb).toBeCloseTo(0, 10)
    expect(response.normalizationMagnitude).toBeGreaterThan(0)
    expect(response.points.every((point) => Number.isFinite(point.magnitudeDb) && Number.isFinite(point.phaseRadians))).toBe(true)
  })

  it('reproduces fixed HW1 reference points from earTransfer with the adult defaults', () => {
    const response = calculateOuterEarResponse([100, 1000, 3200, 8000])

    expect(response.points.map((point) => point.transfer.real)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.9998886700, 8),
        expect.closeTo(1.1787728027, 8),
        expect.closeTo(1.5636777605, 8),
        expect.closeTo(-0.6873507927, 8),
      ]),
    )
    expect(response.points.map((point) => point.transfer.imaginary)).toEqual(
      expect.arrayContaining([
        expect.closeTo(-0.0149213778, 8),
        expect.closeTo(-0.0901538064, 8),
        expect.closeTo(-2.5515945808, 8),
        expect.closeTo(0.5886133832, 8),
      ]),
    )
    expect(response.points.map((point) => point.magnitudeDb)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0, 8),
        expect.closeTo(1.4539315542, 8),
        expect.closeTo(9.5210065452, 8),
        expect.closeTo(-0.8676020492, 8),
      ]),
    )
  })

  it('returns a finite component response and physically meaningful summary frequencies', () => {
    const point = calculateOuterEarAtFrequency(1000)

    expect(Object.values(point.components).every((component) => Number.isFinite(component.real) && Number.isFinite(component.imaginary))).toBe(true)
    expect(point.info.canalFundamentalHz).toBeCloseTo(3430, 8)
    expect(point.info.helmholtzHz).toBeGreaterThan(0)
    expect(point.info.firstNotchHz).toBeGreaterThan(0)
    expect(point.info.reflectorPeakHz).toBeCloseTo(343 / (4 * 0.028), 8)
  })

  it('changes the direction-dependent pinna response when the source moves off axis', () => {
    const forward = calculateOuterEarAtFrequency(5000)
    const side = calculateOuterEarAtFrequency(
      5000,
      createOuterEarParameters({ azimuthDegrees: 75 }),
    )

    expect(side.components.pinna.real).not.toBeCloseTo(forward.components.pinna.real, 8)
    expect(side.components.pinna.imaginary).not.toBeCloseTo(forward.components.pinna.imaginary, 8)
  })

  it('preserves the current HW1 defaults', () => {
    expect(defaultOuterEarParameters).toMatchObject({
      canalLengthMm: 25,
      conchaVolumeCm3: 10,
      focalLengthMm: 28,
      reflectionStrength: 0.55,
      canalLoss: 0.12,
    })
  })
})
