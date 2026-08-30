/**
 * Immutable complex number for the simulator's physics layer.
 * UI code must never depend on this representation directly.
 */
export class Complex {
  static readonly ZERO = new Complex(0, 0)
  static readonly ONE = new Complex(1, 0)

  readonly real: number
  readonly imaginary: number

  constructor(real: number, imaginary: number) {
    this.real = real
    this.imaginary = imaginary
  }

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imaginary + other.imaginary)
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imaginary - other.imaginary)
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imaginary * other.imaginary,
      this.real * other.imaginary + this.imaginary * other.real,
    )
  }

  divide(other: Complex): Complex {
    const denominator = other.real ** 2 + other.imaginary ** 2
    if (denominator === 0) {
      throw new RangeError('Cannot divide by a zero complex quantity.')
    }

    return new Complex(
      (this.real * other.real + this.imaginary * other.imaginary) / denominator,
      (this.imaginary * other.real - this.real * other.imaginary) / denominator,
    )
  }

  reciprocal(): Complex {
    return Complex.ONE.divide(this)
  }

  magnitude(): number {
    return Math.hypot(this.real, this.imaginary)
  }

  phaseRadians(): number {
    return Math.atan2(this.imaginary, this.real)
  }

  scale(factor: number): Complex {
    return new Complex(this.real * factor, this.imaginary * factor)
  }
}
