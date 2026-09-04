import { describe, expect, it } from 'vitest'
import { calculateHrtfAtFrequency, calculateHrtfResponse } from './calculateHrtf'
import { createHrtfParameters, hw3HrtfParameters } from './parameters'

describe('synthetic bilateral HRTF', () => {
  it('documents the transparent HW3 controls and makes head size adjustable', () => {
    expect(hw3HrtfParameters).toHaveLength(5)
    expect(hw3HrtfParameters.find((parameter) => parameter.id === 'headDiameterMm')?.adjustable).toBe(true)
    expect(hw3HrtfParameters.every((parameter) => parameter.source.length > 0)).toBe(true)
  })

  it('produces identical timing at the median plane', () => {
    const response = calculateHrtfResponse([250, 1000, 8000], { azimuthDegrees: 0, elevationDegrees: 0 })

    expect(response.itdSeconds).toBeCloseTo(0, 12)
    for (const point of response.points) {
      expect(point.left.timeDelaySeconds).toBeCloseTo(point.right.timeDelaySeconds, 12)
      expect(point.ildDb).toBeCloseTo(0, 10)
    }
  })

  it('makes the ipsilateral ear lead for a lateral source according to the geometric ITD relation', () => {
    const parameters = createHrtfParameters({ headDiameterMm: 175 })
    const response = calculateHrtfResponse([1000], { azimuthDegrees: 90, elevationDegrees: 0 }, undefined, parameters)
    const point = response.points[0]

    expect(response.itdSeconds).toBeCloseTo(0.175 / 343, 12)
    expect(point.left.timeDelaySeconds).toBeLessThan(point.right.timeDelaySeconds)
    expect(point.right.timeDelaySeconds - point.left.timeDelaySeconds).toBeCloseTo(response.itdSeconds, 12)
  })

  it('increases contralateral head-shadow attenuation with frequency', () => {
    const low = calculateHrtfAtFrequency(250, { azimuthDegrees: 75, elevationDegrees: 0 })
    const high = calculateHrtfAtFrequency(8000, { azimuthDegrees: 75, elevationDegrees: 0 })

    expect(low.left.headShadowGain).toBe(1)
    expect(low.right.headShadowGain).toBeLessThan(1)
    expect(high.right.headShadowGain).toBeLessThan(low.right.headShadowGain)
  })

  it('changes spectral structure with elevation without creating median-plane ITD', () => {
    const horizontal = calculateHrtfAtFrequency(5000, { azimuthDegrees: 0, elevationDegrees: 0 })
    const elevated = calculateHrtfAtFrequency(5000, { azimuthDegrees: 0, elevationDegrees: 45 })

    expect(elevated.left.transfer.magnitude()).not.toBeCloseTo(horizontal.left.transfer.magnitude(), 8)
    expect(elevated.left.timeDelaySeconds).toBeCloseTo(elevated.right.timeDelaySeconds, 12)
  })
})
