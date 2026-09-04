# HW3 synthetic HRTF / HRIR model specification

## Purpose and scope

This module produces a transparent, synthetic left/right HRTF pair and its corresponding HRIR pair. It is an educational model for the coursework requirement, not a measured individual HRTF and not a clinical spatial-audio renderer.

The signal path is deliberately separated into independently testable stages:

```text
source direction → bilateral outer-ear / head HRTF → inverse FFT → left/right HRIR
                                                          ↓
                                             stereo convolution + shared middle-ear transfer
```

The middle-ear transfer is intentionally a downstream, equal transfer applied to both channels during rendering. It is multiplied into both complex spectra before HRIR synthesis, then the source is linearly convolved with each resulting impulse response. It changes the binaural audio spectrum but does not create or change the model's ITD or ILD.

## Coordinate convention

- Azimuth: `0°` is directly in front of the listener; positive is the listener's left.
- Elevation: positive is up.
- A positive ITD means the left ear leads the right ear.

## HRTF components

At each positive frequency, each ear receives the product of:

1. the existing, complex HW1 outer-ear transfer, mirrored across the median plane for the right ear;
2. a transparent elevation-dependent delayed reflection that moves spectral peaks/notches without claiming anatomical precision;
3. a frequency-dependent contralateral head-shadow gain; and
4. a phase delay.

The geometric ITD follows the supplied class-note relationship:

```text
ITD = (head diameter / speed of sound) × sin(azimuth)
```

For positive azimuth, the left-ear delay is reduced by half the ITD and the right-ear delay is increased by half. A common 1 ms reference delay makes both synthetic HRIRs causal; it does not change their interaural timing.

The contralateral attenuation is an explicitly labeled assumption:

```text
attenuation(f) = max attenuation × |sin(azimuth)| × f / (f + corner frequency)
```

It produces the qualitative course requirement that ILD increases at higher frequencies. The head-diameter control is user-adjustable; the remaining shaping parameters are fixed educational defaults unless a later validation step justifies exposing them.

## HRIR synthesis

The standard model rate is 48 kHz. A 2048-point, Hermitian complex HRTF spectrum is inverted to a real-valued left/right HRIR pair. This gives approximately 42.7 ms of impulse-response duration and avoids circular wraparound for the current causal reference delay. Offline audio rendering uses FFT-based **linear** convolution and one linked stereo gain scale; it retains the impulse tail and does not independently normalize the two ears.

## Fixed HW3 comparison cases

The UI contains three buttons that reset geometry and middle-ear controls to their baseline values before applying the following source directions:

| Case | Direction | Expected qualitative behavior |
| --- | --- | --- |
| Median plane | `0°` azimuth, `0°` elevation | No geometric ITD or head-shadow ILD. |
| Strongly lateral left | `75°` azimuth, `0°` elevation | Left ear leads; right-ear attenuation grows with frequency. |
| Elevated front | `0°` azimuth, `45°` elevation | Spectral structure changes without geometric ITD. |

These cases can be loaded directly before capturing the HRTF magnitude, HRIR, ITD, and ILD outputs required for HW3.

## WAV exports

- **Export rendered WAV** downloads the current processed result. It is stereo for a binaural render and dual-mono for a single-path render.
- **Export HRIR WAV** downloads the raw left/right HRTF-derived impulse-response pair at the model sample rate, before the common middle-ear cascade.

Both exports are 16-bit PCM WAV files. When a gain reduction is necessary to avoid clipping, it is applied once to both channels, preserving the interaural level difference.

## Limits to preserve in the report

- The current HW1 outer-ear model is a simplified, assumed/fitted prototype rather than measured pinna geometry.
- Head shadow is a smooth analytical approximation, not diffraction around an individually measured head and torso.
- The elevation cue is a deliberately small delayed-reflection proxy; measured HRTFs contain much richer spectral structure.
- The model has no room response, torso, dynamic head tracking, or individual HRTF measurements.
- The shared middle-ear stage is a cascade approximation and does not model outer/middle-ear loading.
