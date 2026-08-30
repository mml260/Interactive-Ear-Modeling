# HW2 middle-ear model specification

Status: **provisional baseline, ready to replace**. This specification records the circuit visible in the supplied `middleEar.pptx` slides 16–20. It does not represent individual anatomy and must not be described as a “typical ear” model.

## Model domain and output

The circuit uses the acoustic/electrical impedance analogy from the course slides:

- pressure maps to effort/voltage;
- volume velocity maps to flow/current;
- `R` is resistance, `L` is acoustic inertance/mass, and `C` is acoustic compliance;
- `Z_R = R`, `Z_L = jωL`, and `Z_C = 1/(jωC)`.

`Z_middle(f)` is the input impedance seen at the circuit input. The planned dimensionless transmission is:

```text
H_middle(f) = P_cochlear_node(f) / P_input(f)
```

This is a transparent circuit-node definition, suitable for magnitude and phase plots. It is a simplified proxy for the measured ear-canal pressure to cochlear-vestibule-pressure gain reported by Aibara et al.; it is not a claim that this lumped network reproduces that measurement exactly.

## Topology transcription

```text
input
  └─ Z_cavity ─ node A
                   ├─ Z_eardrum  ─ ground
                   └─ Z_ossicles ─ node B
                                      ├─ Z_joint    ─ ground
                                      └─ Z_cochlea  ─ ground  (output node)
```

The subsystem expressions to implement and test are:

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

`||` means complex parallel combination. The implementation will expose each subsystem’s complex impedance plus `Z_middle` and `H_middle`; the UI will keep impedance plots distinct from transfer-response plots.

## Provisional baseline parameter set

The first pass will use the classic Zwislocki-style analogue values summarized in a later academic comparison. These values were fitted and/or inferred for a historical aggregate analogue, not measured for this project or its user.

| Subsystem | Element | Value | Unit | Classification |
| --- | --- | ---: | --- | --- |
| Middle-ear cavities | `La` | 14 | mH | fitted to input-reactance behavior |
|  | `Ra` | 1000 | Ω | fitted historical analogue |
|  | `Cp` | 5.1 | μF | derived from estimated cavity volume |
|  | `Rm` | 60 | Ω | fitted historical analogue |
|  | `Ct` | 0.35 | μF | derived from estimated tympanic-cavity volume |
| Eardrum loss network | `CD1` | 0.23 | μF | fitted historical analogue |
|  | `RD1` | 40 | Ω | fitted historical analogue |
|  | `CD2` | 0.40 | μF | fitted historical analogue |
|  | `RD2` | 220 | Ω | fitted historical analogue |
|  | `LD` | 15 | mH | fitted historical analogue |
| Eardrum, malleus, incus | `CO` | 1.4 | μF | fitted historical analogue |
|  | `LO` | 40 | mH | fitted historical analogue |
|  | `RO` | 70 | Ω | fitted historical analogue |
| Incudo-stapedial joint | `Cs` | 0.25 | μF | fitted historical analogue |
|  | `Rs` | 3000 | Ω | fitted historical analogue |
| Stapes + cochlea | `CC` | 0.60 | μF | fitted historical analogue |
|  | `LC` | 0 | mH | historical baseline simplification |
|  | `RC` | 600 | Ω | fitted historical analogue |

The expected initial shape is a smooth broadband mid-frequency enhancement centered roughly around 1 kHz, then high-frequency roll-off—not a clinical calibration curve. The first verified implementation peaks at approximately **863 Hz** for this node-pressure transfer and rolls off by more than 10 dB by 20 kHz. Its raw magnitude is not presented as a human gain measurement; the response view will explicitly distinguish raw transfer from a low-frequency-referenced relative plot. If later tuning is needed to match the course figure more closely, it will be documented as a separate `course-fit` parameter set rather than silently replacing this baseline.

## Parameter replacement policy

Every runtime parameter will be represented with a value, SI unit, display unit, physical role, classification, source citation, source note, version identifier, and adjustable flag. A professor-supplied set will be added as a new named profile; it will not overwrite this baseline or invalidate validation fixtures.

## Graduate extension: small-child OME transfer sensitivity

The app includes a separate **otitis media with effusion (OME)** sensitivity control for the required graduate extension. It starts from the selected middle-ear baseline, exposes a continuous severity from 0 to 1, and overlays the unaffected baseline transfer with the OME-like transfer. The same selected profile is used for the live audio path.

This is intentionally a mechanism-based educational scenario, rather than a fitted child-specific model. Published middle-ear work reports that effusion increases middle-ear input impedance and that its volume/extent affects stiffness, damping, and mass; a pediatric finite-element study likewise models OME as an altered middle-ear mechanical condition. To reflect those directions in the present lumped circuit, severity continuously applies these transparent endpoint multipliers:

| Circuit quantity | Full-severity multiplier | Interpretation |
| --- | ---: | --- |
| `CD1`, `CD2` eardrum compliance | 0.58× | less compliant tympanic path |
| `Cs` joint compliance | 0.66× | stiffer joint/load path |
| `LO` ossicular inertance | 1.45× | increased effective moving/fluid load |
| `RO`, `RD1`, `RD2` loss | 2.10× / 1.70× | increased dissipation |

The numbers are deliberately inspectable and easy to replace. They are **not** calibrated to an individual child, intended for diagnosis, or presented as a normative pediatric transfer curve. The baseline itself is a historical aggregate Zwislocki-style analogue, so this extension should be described in the report as an OME-like transfer sensitivity simulation for a small child, not a clinical simulation.

## Scope and limitations to preserve

- The model is a lumped, small-signal equivalent circuit; it does not represent full anatomy or individual variation.
- The classic analogue has limited high-frequency fidelity. A review describes this family as reasonably describing normal-human input impedance only to roughly 2 kHz.
- This network omits an explicit acoustic/mechanical transformer because the selected historical values are already expressed in the analogue’s impedance domain.
- The outer-ear and middle-ear transfer functions will initially be cascaded. Loading between the independently modeled stages is therefore an explicit approximation.

## Sources

- Course source: `Context/Class Notes/middleEar.pptx`, slides 16–20.
- J. Zwislocki, “Analysis of the Middle-Ear Function. Part I: Input Impedance,” *JASA* 34, 1514–1523 (1962), DOI [10.1121/1.1918382](https://doi.org/10.1121/1.1918382). The paper explains the cavity-volume basis for `Cp`/`Ct` and the fitted analogue approach.
- K. N. O’Connor and S. Puria, “Middle-ear circuit model parameters based on a population of human ears,” *JASA* 123, 197–211 (2008), DOI [10.1121/1.2817358](https://doi.org/10.1121/1.2817358). This is a more detailed later model, useful for comparison but not silently mixed into the baseline.
- R. Aibara et al., “Human middle-ear sound transfer function and cochlear input impedance,” *Hearing Research* 152, 100–109 (2001), DOI [10.1016/S0378-5955(00)00240-9](https://doi.org/10.1016/S0378-5955(00)00240-9). It defines measured pressure-gain and stapes-velocity transfer quantities that frame, but do not validate, the simplified model.
- E. Merchant and S. T. Neely, “Effects of middle ear pathology on middle ear impedance in chinchillas,” *JASA* 150, 969 (2021), DOI [10.1121/10.0005822](https://doi.org/10.1121/10.0005822). Supports the direction of increased impedance with middle-ear effusion.
- E. Merchant and S. T. Neely, “A model of middle-ear impedance in children with otitis media with effusion,” *Ear and Hearing* (2022), DOI [10.1097/AUD.0000000000001317](https://doi.org/10.1097/AUD.0000000000001317). Supports the pediatric OME stiffness/damping/mass sensitivity framing.
- R. Gan et al., “Finite element modeling of otitis media with effusion in a 4-year-old child,” *JASA* 139, 1825 (2016), DOI [10.1121/1.4944949](https://doi.org/10.1121/1.4944949). Supports use of an altered mechanical middle-ear condition for a young-child OME scenario.
