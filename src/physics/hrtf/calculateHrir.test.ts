import { describe, expect, it } from 'vitest'
import { calculateHrirPair, estimateItdFromHrir } from './calculateHrir'

describe('synthetic HRIR generation', () => {
  it('uses the standardized 48 kHz, 2048-sample transform by default', () => {
    const hrir = calculateHrirPair({ azimuthDegrees: 45, elevationDegrees: 20 })

    expect(hrir.sampleRate).toBe(48000)
    expect(hrir.left).toHaveLength(2048)
    expect(hrir.right).toHaveLength(2048)
    expect(Array.from(hrir.left).every(Number.isFinite)).toBe(true)
    expect(Array.from(hrir.right).every(Number.isFinite)).toBe(true)
  })

  it('preserves the HRTF timing prediction alongside the impulse responses', () => {
    const hrir = calculateHrirPair({ azimuthDegrees: -75, elevationDegrees: 0 })

    expect(hrir.hrtf.itdSeconds).toBeLessThan(0)
    expect(hrir.hrtf.points[0].right.timeDelaySeconds).toBeLessThan(hrir.hrtf.points[0].left.timeDelaySeconds)
  })

  it('recovers a positive delay when the left HRIR leads', () => {
    const left = new Float64Array([0, 1, 0, 0, 0, 0])
    const right = new Float64Array([0, 0, 0, 1, 0, 0])

    expect(estimateItdFromHrir(left, right, 1000, 0.005)).toBeCloseTo(0.002, 12)
  })
})
