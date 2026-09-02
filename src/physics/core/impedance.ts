import { Complex } from './complex'

const TWO_PI = 2 * Math.PI

function assertPositiveFrequency(frequencyHz: number): void {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError('Frequency must be a finite value greater than 0 Hz.')
  }
}

function assertNonNegativeValue(value: number, quantity: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${quantity} must be a finite non-negative value.`)
  }
}

export function resistance(valueOhms: number): Complex {
  assertNonNegativeValue(valueOhms, 'Resistance')
  return new Complex(valueOhms, 0)
}

export function inertance(frequencyHz: number, valueHenries: number): Complex {
  assertPositiveFrequency(frequencyHz)
  assertNonNegativeValue(valueHenries, 'Inertance')
  return new Complex(0, TWO_PI * frequencyHz * valueHenries)
}

export function compliance(frequencyHz: number, valueFarads: number): Complex {
  assertPositiveFrequency(frequencyHz)
  if (Number.isNaN(valueFarads) || valueFarads <= 0) {
    throw new RangeError('Compliance must be greater than 0 F.')
  }
  return new Complex(0, -1 / (TWO_PI * frequencyHz * valueFarads))
}

export function series(...impedances: Complex[]): Complex {
  return impedances.reduce((total, impedance) => total.add(impedance), Complex.ZERO)
}

export function parallel(...impedances: Complex[]): Complex {
  if (impedances.length === 0) {
    throw new RangeError('At least one impedance is required for a parallel combination.')
  }
  const totalAdmittance = impedances.reduce(
    (total, impedance) => total.add(impedance.reciprocal()),
    Complex.ZERO,
  )
  return totalAdmittance.reciprocal()
}
