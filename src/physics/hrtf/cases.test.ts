import { describe, expect, it } from 'vitest'
import { calculateHrtfResponse } from './calculateHrtf'
import { controlValuesForHrtfCase, hw3TestCases } from './cases'

describe('HW3 fixed comparison cases', () => {
  it('provides the required median-plane, lateral, and elevated directions', () => {
    expect(hw3TestCases.map((testCase) => testCase.id)).toEqual(['median-plane', 'lateral-left', 'elevated-front'])
    expect(calculateHrtfResponse([1000], hw3TestCases[0].direction).itdSeconds).toBeCloseTo(0, 12)
    expect(calculateHrtfResponse([1000], hw3TestCases[1].direction).itdSeconds).toBeGreaterThan(0)
    expect(calculateHrtfResponse([1000], hw3TestCases[2].direction).itdSeconds).toBeCloseTo(0, 12)
  })

  it('maps a selected physical direction to the UI control names', () => {
    expect(controlValuesForHrtfCase(hw3TestCases[1])).toEqual({ azimuth: 75, elevation: 0 })
  })
})
