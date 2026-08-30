import { fft, nextPowerOfTwo } from './fft'

export type ComplexGain = { real: number; imaginary: number }
export type TransferAtFrequency = (frequencyHz: number) => ComplexGain

export function applyFrequencyResponse(samples: Float32Array, sampleRate: number, transferAt: TransferAtFrequency): Float32Array {
  if (samples.length === 0 || sampleRate <= 0) throw new RangeError('Audio samples and sample rate are required.')
  const length = nextPowerOfTwo(samples.length)
  const real = new Float64Array(length)
  const imaginary = new Float64Array(length)
  real.set(samples)
  fft(real, imaginary)

  for (let bin = 0; bin <= length / 2; bin += 1) {
    const gain = transferAt(bin * sampleRate / length)
    const inputReal = real[bin]
    const inputImaginary = imaginary[bin]
    real[bin] = inputReal * gain.real - inputImaginary * gain.imaginary
    imaginary[bin] = inputReal * gain.imaginary + inputImaginary * gain.real
    if (bin > 0 && bin < length / 2) {
      real[length - bin] = real[bin]
      imaginary[length - bin] = -imaginary[bin]
    }
  }
  fft(real, imaginary, true)
  const output = new Float32Array(samples.length)
  let peak = 0
  for (let index = 0; index < samples.length; index += 1) peak = Math.max(peak, Math.abs(real[index]))
  const scale = peak > 0.98 ? 0.98 / peak : 1
  for (let index = 0; index < samples.length; index += 1) output[index] = real[index] * scale
  return output
}

export function whiteNoise(length: number): Float32Array {
  return Float32Array.from({ length }, () => (Math.random() * 2 - 1) * 0.18)
}

/** Paul Kellett's compact filtered white-noise approximation. */
export function pinkNoise(length: number): Float32Array {
  const output = new Float32Array(length)
  let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    output[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025
    b6 = white * 0.115926
  }
  return output
}
