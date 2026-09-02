# HW2 middle-ear model specification

Status: **implemented final fitted analogue**. This specification transcribes the final circuit and component values in Lutman & Martin (1979), Figure 12 and Table 1, supplied in `Context/Class Notes/middle ear model 2 w values.pdf`. It is a fitted group model, not an individual anatomical measurement.

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
Z_eardrum  = Z_RD1 + Z_CD1 + (Z_LD || (Z_CD2 + Z_RD2)) + (Z_CD3 || Z_RD3)
Z_ossicles = Z_CO + Z_LO + Z_RO
Z_joint    = Z_Cs + Z_Rs
Z_cochlea  = Z_CST + Z_CC + Z_LC + Z_RC

Z_load     = Z_joint || Z_cochlea
Z_after_A  = Z_eardrum || (Z_ossicles + Z_load)
Z_middle   = Z_cavity + Z_after_A
H_middle   = (Z_after_A / Z_middle) × (Z_load / (Z_ossicles + Z_load))
```

`||` means complex parallel combination. The implementation will expose each subsystem’s complex impedance plus `Z_middle` and `H_middle`; the UI will keep impedance plots distinct from transfer-response plots.

## Final fitted parameter set

These are the published final-model values, fitted by Lutman and Martin to real-ear admittance-change data from 16 subjects. `CST = ∞` is the model's no-acoustic-reflex operating point, so it has zero electrical impedance.

| Subsystem | Element | Value | Unit | Classification |
| --- | --- | ---: | --- | --- |
| Middle-ear cavities | `La` | 14 | mH | fitted final model |
|  | `Ra` | 10 | Ω | fitted final model |
|  | `Cp` | 5.1 | μF | fitted final model |
|  | `Rm` | 390 | Ω | fitted final model |
|  | `Ct` | 0.35 | μF | fitted final model |
| Eardrum loss network | `RD1` | 200 | Ω | fitted final model |
|  | `CD1` | 0.8 | μF | fitted final model |
|  | `LD` | 15 | mH | fitted final model |
|  | `RD2` | 12 | Ω | fitted final model |
|  | `CD2` | 0.4 | μF | fitted final model |
|  | `RD3` | 5900 | Ω | fitted final model |
|  | `CD3` | 0.2 | μF | fitted final model |
| Eardrum, malleus, incus | `LO` | 40 | mH | fitted final model |
|  | `CO` | 1.4 | μF | fitted final model |
|  | `RO` | 70 | Ω | fitted final model |
| Incudo-stapedial joint | `Cs` | 0.25 | μF | fitted final model |
|  | `Rs` | 3000 | Ω | fitted final model |
| Stapes + cochlea | `CST` | ∞ | μF | no-reflex operating point |
|  | `LC` | 45 | mH | fitted final model |
|  | `CC` | 0.65 | μF | fitted final model |
|  | `RC` | 550 | Ω | fitted final model |

The verified no-reflex response peaks at approximately **745 Hz** for this node-pressure transfer and is about 7.4 dB below that peak at 20 kHz. Its raw magnitude is not presented as a human gain measurement.

## Parameter replacement policy

Every runtime parameter is represented with a value, SI unit, display unit, physical role, classification, source citation, and adjustable flag. Any later course-specific set should be a separately named profile.

## Graduate extension: small-child OME transfer sensitivity

The app includes a separate **otitis media with effusion (OME)** sensitivity control for the required graduate extension. It starts from the selected middle-ear baseline, exposes a continuous severity from 0 to 1, and overlays the unaffected baseline transfer with the OME-like transfer. The same selected profile is used for the live audio path.

This is intentionally a mechanism-based educational scenario, rather than a fitted child-specific model. Published middle-ear work reports that effusion increases middle-ear input impedance and that its volume/extent affects stiffness, damping, and mass; a pediatric finite-element study likewise models OME as an altered middle-ear mechanical condition. To reflect those directions in the present lumped circuit, severity continuously applies these transparent endpoint multipliers:

| Circuit quantity | Full-severity multiplier | Interpretation |
| --- | ---: | --- |
| `CD1`, `CD2`, `CD3` eardrum compliance | 0.58× | less compliant tympanic path |
| `Cs` joint compliance | 0.66× | stiffer joint/load path |
| `LO` ossicular inertance | 1.45× | increased effective moving/fluid load |
| `RO`, `RD1`, `RD2`, `RD3` loss | 2.10× / 1.70× | increased dissipation |

The multipliers are deliberately inspectable. They are **not** calibrated to an individual child, intended for diagnosis, or presented as a normative pediatric transfer curve. This extension should be described as an OME-like transfer sensitivity simulation for a small child, not a clinical simulation.

## Scope and limitations to preserve

- The model is a lumped, small-signal equivalent circuit; it does not represent full anatomy or individual variation.
- The classic analogue has limited high-frequency fidelity. A review describes this family as reasonably describing normal-human input impedance only to roughly 2 kHz.
- This network omits an explicit acoustic/mechanical transformer because the selected historical values are already expressed in the analogue’s impedance domain.
- The outer-ear and middle-ear transfer functions will initially be cascaded. Loading between the independently modeled stages is therefore an explicit approximation.

## Sources

- Course source: `Context/Class Notes/middle ear model.pdf` and `Context/Class Notes/middle ear model 2 w values.pdf`.
- M. E. Lutman and A. M. Martin, “Development of an electroacoustic analogue model of the middle ear and acoustic reflex,” *Journal of Sound and Vibration* 64, 133–157 (1979), Figure 12 and Table 1, DOI [10.1016/0022-460X(79)90562-4](https://doi.org/10.1016/0022-460X(79)90562-4).
- R. Aibara et al., “Human middle-ear sound transfer function and cochlear input impedance,” *Hearing Research* 152, 100–109 (2001), DOI [10.1016/S0378-5955(00)00240-9](https://doi.org/10.1016/S0378-5955(00)00240-9). It defines measured pressure-gain and stapes-velocity transfer quantities that frame, but do not validate, the simplified model.
- E. Merchant and S. T. Neely, “Effects of middle ear pathology on middle ear impedance in chinchillas,” *JASA* 150, 969 (2021), DOI [10.1121/10.0005822](https://doi.org/10.1121/10.0005822). Supports the direction of increased impedance with middle-ear effusion.
- G. R. Merchant and S. T. Neely, “Conductive Hearing Loss Estimated From Wideband Acoustic Immittance Measurements in Ears With Otitis Media With Effusion,” *Ear and Hearing* 44(4), 721–731 (2023), DOI [10.1097/AUD.0000000000001317](https://doi.org/10.1097/AUD.0000000000001317). Supports the pediatric OME stiffness/damping/mass sensitivity framing.
- R. Gan et al., “Finite element modeling of otitis media with effusion in a 4-year-old child,” *JASA* 139, 1825 (2016), DOI [10.1121/1.4944949](https://doi.org/10.1121/1.4944949). Supports use of an altered mechanical middle-ear condition for a young-child OME scenario.
