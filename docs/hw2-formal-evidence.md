# HW2 formal experiments and verification evidence

This file is the submission-ready record for the three required middle-ear parameter experiments. It records the controlled cases, the prediction made before running each model, the actual calculated result, and the checks used to verify the circuit transcription. It should be submitted with screenshots from the interactive app and the source code.

## How to reproduce the cases in the app

1. Choose **Middle ear** under *Listening path*.
2. Open **02 Middle Ear**.
3. In *Required experiments*, click **Load case** for a case.
4. Keep OME severity at `0 / 1`, choose **Magnitude**, and capture the frequency-response plot. The load action sets the other two required controls back to baseline, so the experiment changes only its named parameter.

The calculation samples 801 logarithmically spaced frequencies from 20 Hz to 20 kHz. “Peak” is the maximum of that sampled response. The transfer is the model's dimensionless cochlear-node pressure ratio, plotted as `20 log10|H_middle|`; it is not a calibrated hearing gain or clinical measurement.

## Formal experiment results

| Case | Controlled change | Pre-run prediction | Verified model result | Comparison / conclusion |
| --- | --- | --- | --- | --- |
| 1. Inertance / mass | Ossicular inertance `LO`: 40 → 60 mH (+50%) | More inertance should alter mass-related behavior and reduce high-frequency transmission relative to the broad mid-frequency peak. | Peak: 871 → 752 Hz. At 2 kHz: −1.68 dB; at 4 kHz: −2.95 dB relative to baseline. Peak magnitude changes from −1.49 to −1.17 dB. | The expected downward frequency shift and high-frequency reduction occur. The small peak-height increase is a network interaction, so it should be reported rather than described as a simple global attenuation. |
| 2. Compliance | Eardrum compliance `CD1`: 0.23 → 0.50 μF (+117%) | More eardrum compliance should change eardrum-branch loading and alter the middle-frequency transfer near the broad peak. | Peak: 871 → 732 Hz; peak magnitude: −1.49 → −1.82 dB. At 1 kHz: −0.73 dB relative to baseline. | The response shifts downward and is reduced around 1 kHz, consistent with the pre-run prediction. |
| 3. Resistance / loss | Ossicular loss `RO`: 70 → 300 Ω (+329%) | More ossicular loss should dissipate more energy and reduce transmission near the broad resonance. | Peak: 871 → 414 Hz; peak magnitude: −1.49 → −3.83 dB. At 1 kHz: −2.69 dB relative to baseline. | The predicted strong reduction occurs. This is the clearest loss-control effect in the selected topology. |

All reported deltas are the changed-model magnitude minus the baseline-model magnitude. The three cases are defined in `src/physics/middleEar/experiments.ts`, and the corresponding test verifies that each result is finite, repeatable, and has the reported direction of change.

## Circuit topology verification

The course topology was transcribed as the following explicit impedance network:

```text
input
  └─ Z_cavity ─ node A
                   ├─ Z_eardrum  ─ ground
                   └─ Z_ossicles ─ node B
                                      ├─ Z_joint    ─ ground
                                      └─ Z_cochlea  ─ ground  (output node)
```

The implementation uses `Z_R = R`, `Z_L = jωL`, and `Z_C = 1/(jωC)`, then evaluates:

```text
Z_cavity   = (Z_Cp + Z_La + Z_Ra) || Z_Rm || Z_Ct
Z_eardrum  = Z_CD1 + (Z_LD || (Z_CD2 + Z_RD2)) + Z_RD1
Z_ossicles = Z_CO + Z_LO + Z_RO
Z_joint    = Z_Cs + Z_Rs
Z_cochlea  = Z_CC + Z_LC + Z_RC

Z_load     = Z_joint || Z_cochlea
Z_after_A  = Z_eardrum || (Z_ossicles + Z_load)
Z_middle   = Z_cavity + Z_after_A
H_middle   = (Z_after_A / Z_middle) × (Z_load / (Z_ossicles + Z_load))
```

Verification is automated in `src/physics/middleEar/calculateMiddleEar.test.ts`:

- primitive impedance tests independently check the resistor, inertance, and compliance equations at 1 kHz;
- an explicit reconstruction of every branch at 1 kHz is compared, real and imaginary parts, with the implementation's `Z_cavity`, `Z_eardrum`, `Z_ossicles`, `Z_joint`, `Z_cochlea`, `Z_load`, `Z_middle`, and `H_middle`;
- a broadband-response test checks the expected bounded, broad mid-frequency peak and high-frequency roll-off;
- the formal-experiment tests assert the three required experiment classes and their repeatable computed effects.

This is a code-level verification that the documented circuit is the circuit actually calculated; it is not a claim of physiological validation against a measured ear.

## Component values and classifications

The values are a provisional, replaceable **Zwislocki-style historical analogue baseline**, not professor-provided or patient-specific values. Every one of the 18 parameters is source-tagged in `src/physics/middleEar/parameters.ts` and shown in the app's *Advanced model options* panel.

| Classification | Values used | Why assigned this way |
| --- | --- | --- |
| Derived | `Cp = 5.1 μF`, `Ct = 0.35 μF` | Compliance values associated with estimated cavity-volume behavior in the historical analogue. |
| Fitted historical analogue | `La = 14 mH`, `Ra = 1000 Ω`, `Rm = 60 Ω`; `CD1 = 0.23 μF`, `RD1 = 40 Ω`, `CD2 = 0.40 μF`, `RD2 = 220 Ω`, `LD = 15 mH`; `CO = 1.4 μF`, `LO = 40 mH`, `RO = 70 Ω`; `Cs = 0.25 μF`, `Rs = 3000 Ω`; `CC = 0.60 μF`, `RC = 600 Ω` | Historical analogue values fitted or inferred to approximate aggregate middle-ear impedance behavior. They create a broad model peak near 0.87 kHz, close to the course's requested approximate 1 kHz feature. |
| Simplified | `LC = 0 mH` | The historical baseline's cochlear-load inertance is omitted rather than invented. |

The complete table, circuit scope, and sources are in [hw2-model-spec.md](hw2-model-spec.md). If the professor supplies exact values, add them as a new named profile; do not silently overwrite this baseline or change the existing evidence.

## Required screenshots and submission package

- One baseline middle-ear magnitude screenshot plus one screenshot for each formal case above (four plots total).
- Optional but useful: phase and impedance screenshots for one case to demonstrate the independent subsystem outputs.
- One OME baseline-versus-affected screenshot for the graduate extension.
- This evidence file, `hw2-model-spec.md`, the app source, and the test output showing all checks pass.
- In the short written report: include the three prediction/result paragraphs above, the topology diagram/equations, the classification table, and the model limitations from `hw2-model-spec.md`.

## Sources

- Course source: `Context/Class Notes/middleEar.pptx`, slides 16–20.
- J. Zwislocki, “Analysis of the Middle-Ear Function. Part I: Input Impedance,” *JASA* 34, 1514–1523 (1962), DOI [10.1121/1.1918382](https://doi.org/10.1121/1.1918382).
- K. N. O’Connor and S. Puria, “Middle-ear circuit model parameters based on a population of human ears,” *JASA* 123, 197–211 (2008), DOI [10.1121/1.2817358](https://doi.org/10.1121/1.2817358).
