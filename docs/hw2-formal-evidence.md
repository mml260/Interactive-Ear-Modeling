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
| 1. Inertance / mass | Ossicular inertance `LO`: 40 → 60 mH (+50%) | More inertance should alter mass-related behavior and reduce high-frequency transmission relative to the broad mid-frequency peak. | Peak: 745 → 660 Hz. At 2 kHz: −1.32 dB; at 4 kHz: −2.00 dB relative to baseline. Peak magnitude changes from −1.11 to −0.96 dB. | The expected downward frequency shift and high-frequency reduction occur. The small peak-height increase is a network interaction, so it should be reported rather than described as a simple global attenuation. |
| 2. Compliance | Eardrum compliance `CD1`: 0.80 → 0.10 μF (−87.5%) | Less eardrum compliance should stiffen the eardrum branch and alter the middle-frequency transfer around the broad peak. | Peak: 745 → 726 Hz; peak magnitude: −1.11 → −1.16 dB. At 1 kHz: −0.21 dB relative to baseline. | The response shifts modestly downward and is reduced at 1 kHz, consistent with the pre-run prediction. |
| 3. Resistance / loss | Ossicular loss `RO`: 70 → 300 Ω (+329%) | More ossicular loss should dissipate more energy and reduce transmission near the broad resonance. | Peak: 745 → 649 Hz; peak magnitude: −1.11 → −4.11 dB. At 1 kHz: −2.69 dB relative to baseline. | The predicted strong reduction occurs. This is the clearest loss-control effect in the selected topology. |

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
Z_eardrum  = Z_RD1 + Z_CD1 + (Z_LD || (Z_CD2 + Z_RD2)) + (Z_CD3 || Z_RD3)
Z_ossicles = Z_CO + Z_LO + Z_RO
Z_joint    = Z_Cs + Z_Rs
Z_cochlea  = Z_CST + Z_CC + Z_LC + Z_RC

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

The values are the **Lutman & Martin final fitted analogue model** from Figure 12 and Table 1, not patient-specific measurements. All 21 parameters are source-tagged in `src/physics/middleEar/parameters.ts` and shown in the app's *Advanced model options* panel.

| Classification | Values used | Why assigned this way |
| --- | --- | --- |
| Final fitted analogue | `La = 14 mH`, `Ra = 10 Ω`, `Cp = 5.1 μF`, `Rm = 390 Ω`, `Ct = 0.35 μF`; `RD1 = 200 Ω`, `CD1 = 0.8 μF`, `LD = 15 mH`, `RD2 = 12 Ω`, `CD2 = 0.4 μF`, `RD3 = 5900 Ω`, `CD3 = 0.2 μF`; `LO = 40 mH`, `CO = 1.4 μF`, `RO = 70 Ω`; `Cs = 0.25 μF`, `Rs = 3000 Ω`; `LC = 45 mH`, `CC = 0.65 μF`, `RC = 550 Ω` | Values fitted by Lutman and Martin to their real-ear data. The resulting no-reflex response peaks near 0.75 kHz. |
| No-reflex operating point | `CST = ∞` | An infinite compliance is a zero-impedance electrical short; the acoustic-reflex control is not active in this baseline. |

The complete table, circuit scope, and sources are in [hw2-model-spec.md](hw2-model-spec.md).

## Required screenshots and submission package

- One baseline middle-ear magnitude screenshot plus one screenshot for each formal case above (four plots total).
- Optional but useful: phase and impedance screenshots for one case to demonstrate the independent subsystem outputs.
- One OME baseline-versus-affected screenshot for the graduate extension.
- This evidence file, `hw2-model-spec.md`, the app source, and the test output showing all checks pass.
- In the short written report: include the three prediction/result paragraphs above, the topology diagram/equations, the classification table, and the model limitations from `hw2-model-spec.md`.

## Sources

- Course source: `Context/Class Notes/middle ear model.pdf` and `Context/Class Notes/middle ear model 2 w values.pdf`.
- M. E. Lutman and A. M. Martin, “Development of an electroacoustic analogue model of the middle ear and acoustic reflex,” *Journal of Sound and Vibration* 64, 133–157 (1979), Figure 12 and Table 1, DOI [10.1016/0022-460X(79)90562-4](https://doi.org/10.1016/0022-460X(79)90562-4).
