import FFT from 'fft.js'

export type Spectrum = { real: Float64Array; imaginary: Float64Array }

function assertPowerOfTwo(length: number): void {
  if (length < 2 || (length & (length - 1)) !== 0) throw new RangeError('FFT length must be a power of two greater than one.')
}

export function nextPowerOfTwo(value: number): number {
  let result = 1
  while (result < value) result *= 2
  return result
}

/** In-place wrapper around fft.js, with separate real and imaginary arrays. */
export function fft(real: Float64Array, imaginary: Float64Array, inverse = false): void {
  const length = real.length
  assertPowerOfTwo(length)
  if (imaginary.length !== length) throw new RangeError('FFT arrays must have equal length.')
  const transform = new FFT(length)
  const input = transform.createComplexArray()
  const output = transform.createComplexArray()
  for (let index = 0; index < length; index += 1) {
    input[index * 2] = real[index]
    input[index * 2 + 1] = imaginary[index]
  }
  if (inverse) transform.inverseTransform(output, input)
  else transform.transform(output, input)
  for (let index = 0; index < length; index += 1) {
    real[index] = output[index * 2]
    imaginary[index] = output[index * 2 + 1]
  }
}

export function forwardFft(samples: Float32Array): Spectrum {
  const real = new Float64Array(nextPowerOfTwo(samples.length))
  real.set(samples)
  const imaginary = new Float64Array(real.length)
  fft(real, imaginary)
  return { real, imaginary }
}
