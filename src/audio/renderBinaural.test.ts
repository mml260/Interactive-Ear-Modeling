import { describe, expect, it } from 'vitest'
import { convolveLinear, renderBinaural } from './renderBinaural'
import { calculateHrirPair } from '../physics/hrtf/calculateHrir'

describe('binaural rendering', () => {
  it('performs full linear convolution rather than circular filtering', () => {
    const output = convolveLinear(new Float32Array([1, 2]), new Float64Array([0.5, 0.5]))

    expect(Array.from(output)).toEqual([0.5, 1.5, 1])
  })

  it('renders a finite, stereo impulse response with the shared middle-ear stage included', () => {
    const rendered = renderBinaural(
      new Float32Array([1]),
      48000,
      { direction: { azimuthDegrees: 75, elevationDegrees: 20 } },
    )

    expect(rendered.left).toHaveLength(2048)
    expect(rendered.right).toHaveLength(2048)
    expect(Array.from(rendered.left).every(Number.isFinite)).toBe(true)
    expect(Array.from(rendered.right).every(Number.isFinite)).toBe(true)
    expect(rendered.hrir.hrtf.itdSeconds).toBeGreaterThan(0)
  })

  it('does not silently omit the common middle-ear transfer', () => {
    const direction = { azimuthDegrees: 30, elevationDegrees: 0 }
    const pureHrir = calculateHrirPair(direction)
    const rendered = renderBinaural(new Float32Array([1]), 48000, { direction })

    expect(rendered.hrir.left[10]).not.toBeCloseTo(pureHrir.left[10], 8)
    expect(rendered.hrir.right[10]).not.toBeCloseTo(pureHrir.right[10], 8)
  })
})
