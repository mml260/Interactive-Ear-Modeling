import { describe, expect, it } from 'vitest'
import { fft } from './fft'
import { applyFrequencyResponse } from './processAudio'

describe('frequency-domain audio renderer', () => {
  it('round-trips the FFT', () => {
    const real = Float64Array.from([0, 1, 2, 3, 4, 5, 6, 7])
    const imaginary = new Float64Array(real.length)
    fft(real, imaginary)
    fft(real, imaginary, true)
    real.forEach((value, index) => expect(value).toBeCloseTo(index, 8))
  })

  it('preserves a signal under a unity complex response', () => {
    const input = Float32Array.from({ length: 64 }, (_, index) => Math.sin(index * 0.31) * 0.25)
    const output = applyFrequencyResponse(input, 48000, () => ({ real: 1, imaginary: 0 }))
    output.forEach((value, index) => expect(value).toBeCloseTo(input[index], 5))
  })

  it('can remove a signal with a zero-valued response', () => {
    const output = applyFrequencyResponse(Float32Array.from([0.2, -0.1, 0.3, -0.2]), 48000, () => ({ real: 0, imaginary: 0 }))
    output.forEach((value) => expect(value).toBeCloseTo(0, 8))
  })
})
