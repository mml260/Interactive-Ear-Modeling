# Ear Acoustics Simulator

A standalone, browser-based educational simulator for the outer ear, middle ear, and later HRTF/HRIR coursework modules.

## Current scope

HW1–3: an outer-ear model, a complex-valued middle-ear circuit model, and a synthetic bilateral HRTF/HRIR renderer. The HW3 view provides fixed median-plane, lateral, and elevated comparison cases, HRTF/HRIR/ILD displays, stereo rendering, and WAV exports for both rendered audio and the raw HRIR pair.

## Development commands

```bash
pnpm dev
pnpm build
pnpm lint
```

## Documentation

The HW2 circuit topology, transfer definition, source policy, and provisional baseline values are documented in [`docs/hw2-model-spec.md`](docs/hw2-model-spec.md). The HW3 synthetic HRTF/HRIR model and its assumptions are documented in [`docs/hw3-model-spec.md`](docs/hw3-model-spec.md).

## Architecture direction

- `src/physics/` — framework-independent complex arithmetic, units, component models, and validated calculations.
- `src/audio/` — Web Audio API and AudioWorklet processing.
- `src/visualization/` — response plots, spectrograms, and future 3D scene.
- `src/features/` — React composition and module-specific workflow.
- `src/validation/` — MATLAB/TypeScript fixtures and numerical comparisons.
- `src/data/` — parameter sources and versioned baseline sets.

The source tree will be populated one independently tested component at a time.
