import { describe, expect, it } from 'vitest'
import { evaluateFormalExperiment, formalExperiments } from './experiments'

describe('required formal middle-ear experiments', () => {
  it('defines exactly one inertance, compliance, and loss experiment', () => {
    expect(formalExperiments.map((experiment) => experiment.id)).toEqual(['inertance', 'compliance', 'loss'])
  })

  it('produces finite, repeatable modeled evidence for each formal case', () => {
    for (const experiment of formalExperiments) {
      const result = evaluateFormalExperiment(experiment)
      expect(result.baselinePeakHz).toBeGreaterThan(20)
      expect(result.changedPeakHz).toBeGreaterThan(20)
      expect(Number.isFinite(result.baselinePeakDb)).toBe(true)
      expect(Number.isFinite(result.changedPeakDb)).toBe(true)
      expect(result.changesAtHz).toHaveLength(5)
      expect(result.changesAtHz.every((point) => Number.isFinite(point.deltaDb))).toBe(true)
      expect(result.changesAtHz.some((point) => Math.abs(point.deltaDb) > 0.01)).toBe(true)
    }
  })

  it('shows the expected modeled direction for each selected formal case', () => {
    const [inertance, compliance, loss] = formalExperiments.map(evaluateFormalExperiment)
    expect(inertance.changedPeakHz).toBeLessThan(inertance.baselinePeakHz)
    expect(inertance.changesAtHz.find((point) => point.frequencyHz === 4000)?.deltaDb).toBeLessThan(-2)
    expect(compliance.changedPeakHz).toBeLessThan(compliance.baselinePeakHz)
    expect(compliance.changesAtHz.find((point) => point.frequencyHz === 1000)?.deltaDb).toBeLessThan(-0.5)
    expect(loss.changedPeakDb).toBeLessThan(loss.baselinePeakDb - 2)
    expect(loss.changesAtHz.find((point) => point.frequencyHz === 1000)?.deltaDb).toBeLessThan(-2)
  })
})
