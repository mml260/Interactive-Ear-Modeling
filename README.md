# Ear Acoustics Simulator

A standalone, browser-based educational simulator for the outer ear, middle ear, and later HRTF/HRIR coursework modules.

## Current scope

HW2 only: a complex-valued middle-ear circuit model, validated outer-ear port, response comparison, experiments, audio rendering, spectrograms, and an educational 3D view. HW3 is architecture-only until explicitly authorized.

## Development commands

```bash
pnpm dev
pnpm build
pnpm lint
```

## Documentation

The HW2 circuit topology, transfer definition, source policy, and provisional baseline values are documented in [`docs/hw2-model-spec.md`](docs/hw2-model-spec.md).

## Architecture direction

- `src/physics/` — framework-independent complex arithmetic, units, component models, and validated calculations.
- `src/audio/` — Web Audio API and AudioWorklet processing.
- `src/visualization/` — response plots, spectrograms, and future 3D scene.
- `src/features/` — React composition and module-specific workflow.
- `src/validation/` — MATLAB/TypeScript fixtures and numerical comparisons.
- `src/data/` — parameter sources and versioned baseline sets.

The source tree will be populated one independently tested component at a time.
