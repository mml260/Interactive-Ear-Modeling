import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import './App.css'
import { downloadStereoWav } from './audio/exportWav'
import { downloadCsv, downloadSvg } from './audio/exportFiles'
import { renderBinaural } from './audio/renderBinaural'
import { applyFrequencyResponse, pinkNoise, whiteNoise } from './audio/processAudio'
import { Spectrogram } from './audio/Spectrogram'
import { Complex } from './physics/core/complex'
import { calculateMiddleEarAtFrequency, calculateMiddleEarResponse } from './physics/middleEar/calculateMiddleEar'
import { formalExperiments, formalExperimentResults } from './physics/middleEar/experiments'
import { createOmeScenario, omeScenarioEvidence } from './physics/middleEar/omeScenario'
import { createMiddleEarParameters, lutmanMartinFinalParameters } from './physics/middleEar/parameters'
import { calculateHrirPair, estimateItdFromHrir } from './physics/hrtf/calculateHrir'
import { calculateHrtfResponse } from './physics/hrtf/calculateHrtf'
import { controlValuesForHrtfCase, hw3TestCases, type HrtfTestCase } from './physics/hrtf/cases'
import { createHrtfParameters } from './physics/hrtf/parameters'
import { calculateOuterEarAtFrequency, calculateOuterEarResponse } from './physics/outerEar/calculateOuterEar'
import { createOuterEarParameters } from './physics/outerEar/parameters'

type ModuleKey = 'outer' | 'middle' | 'hrtf'
type ResponseKey = 'outer' | 'middle' | 'combined' | 'binaural'
type PlotMode = 'magnitude' | 'phase' | 'impedance'
type Control = { id: string; label: string; min: number; max: number; step: number; unit: string }
type PlotSeries = { label: string; color: string; values: number[] }
type AudioInput = { samples: Float32Array; sampleRate: number; label: string }
type ActivePlayback = { source: AudioBufferSourceNode; gain: GainNode; startedAt: number; offsetSeconds: number }

const outerControls: Control[] = [
  { id: 'canalLength', label: 'Canal length', min: 15, max: 35, step: 0.5, unit: 'mm' },
  { id: 'canalDiameter', label: 'Canal diameter', min: 4, max: 12, step: 0.5, unit: 'mm' },
  { id: 'conchaDepth', label: 'Concha depth', min: 4, max: 25, step: 0.5, unit: 'mm' },
  { id: 'conchaVolume', label: 'Concha volume', min: 3, max: 30, step: 0.5, unit: 'cm³' },
  { id: 'azimuth', label: 'Source azimuth', min: -180, max: 180, step: 1, unit: '°' },
  { id: 'elevation', label: 'Source elevation', min: -90, max: 90, step: 1, unit: '°' },
]
const middleControls: Control[] = [
  { id: 'ossicularInertance', label: 'Ossicular inertance', min: 20, max: 80, step: 1, unit: 'mH' },
  { id: 'eardrumCompliance', label: 'Eardrum compliance', min: 0.1, max: 2, step: 0.05, unit: 'μF' },
  { id: 'ossicularLoss', label: 'Ossicular loss', min: 20, max: 300, step: 5, unit: 'Ω' },
  { id: 'omeSeverity', label: 'OME severity', min: 0, max: 1, step: 0.05, unit: ' / 1' },
]
const hrtfControls: Control[] = [
  { id: 'azimuth', label: 'Source azimuth', min: -180, max: 180, step: 1, unit: '°' },
  { id: 'elevation', label: 'Source elevation', min: -90, max: 90, step: 1, unit: '°' },
  { id: 'headDiameter', label: 'Head diameter', min: 140, max: 220, step: 1, unit: 'mm' },
]
const initialValues: Record<string, number> = {
  canalLength: 25, canalDiameter: 7.5, conchaDepth: 12, conchaVolume: 10, azimuth: 0, elevation: 0,
  ossicularInertance: 40, eardrumCompliance: 0.8, ossicularLoss: 70, omeSeverity: 0, headDiameter: 175,
}
const responseLabels: Record<ResponseKey, string> = {
  outer: 'Outer-ear response', middle: 'Middle-ear response', combined: 'Connected response', binaural: 'Bilateral HRTF',
}
const palette = ['#255290', '#d27445', '#23786d', '#7b5da6', '#b54f7a', '#698d36']

function logarithmicFrequencies(count = 320): number[] {
  const low = Math.log10(20); const high = Math.log10(20000)
  return Array.from({ length: count }, (_, index) => 10 ** (low + (high - low) * index / (count - 1)))
}
function decibels(value: number): number { return 20 * Math.log10(Math.max(value, Number.MIN_VALUE)) }

function Slider({ control, value, onChange }: { control: Control; value: number; onChange: (value: number) => void }) {
  return (
    <label className="slider-control">
      <span className="slider-heading"><span>{control.label}</span><output>{value}{control.unit}</output></span>
      <input aria-label={control.label} max={control.max} min={control.min} onChange={(event) => onChange(Number(event.target.value))} step={control.step} type="range" value={value} />
      <span className="slider-limits"><span>{control.min}</span><span>{control.max}</span></span>
    </label>
  )
}

function responsePath(frequencies: number[], values: number[], min: number, max: number): string {
  const x = (frequency: number) => 50 + (Math.log10(frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 930
  const y = (value: number) => 16 + (max - value) / (max - min) * 268
  return values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(frequencies[index]).toFixed(2)},${y(value).toFixed(2)}`).join(' ')
}

function ResponsePlot({ frequencies, series, mode, compact = false, exportId }: { frequencies: number[]; series: PlotSeries[]; mode: PlotMode; compact?: boolean; exportId?: string }) {
  const allValues = series.flatMap((item) => item.values).filter(Number.isFinite)
  const rawMin = Math.min(...allValues); const rawMax = Math.max(...allValues)
  const padding = Math.max(2, (rawMax - rawMin) * 0.14)
  const minimum = mode === 'phase' ? Math.floor((rawMin - padding) / 45) * 45 : Math.floor((rawMin - padding) / 5) * 5
  const maximum = mode === 'phase' ? Math.ceil((rawMax + padding) / 45) * 45 : Math.ceil((rawMax + padding) / 5) * 5
  const yTicks = Array.from({ length: 5 }, (_, index) => minimum + (maximum - minimum) * index / 4)
  const xTicks = [20, 100, 1000, 10000, 20000]
  const unit = mode === 'phase' ? '°' : mode === 'impedance' ? 'dBΩ' : 'dB'
  const xFor = (tick: number) => 50 + (Math.log10(tick) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 930
  const yFor = (tick: number) => 16 + (maximum - tick) / (maximum - minimum) * 268
  return (
    <div className={`response-plot${compact ? ' compact-response-plot' : ''}`} role="img" aria-label={`${mode} response plot`}>
      <svg id={exportId} viewBox="0 0 1000 330" preserveAspectRatio="none">
        <g className="plot-grid-lines">
          {yTicks.map((tick) => <line key={tick} x1="50" x2="980" y1={yFor(tick)} y2={yFor(tick)} />)}
          {xTicks.map((tick) => <line key={tick} x1={xFor(tick)} x2={xFor(tick)} y1="16" y2="284" />)}
        </g>
        <line className="plot-axis-line" x1="50" x2="980" y1="284" y2="284" />
        <line className="plot-axis-line" x1="50" x2="50" y1="16" y2="284" />
        {series.map((item) => <path className="response-line" d={responsePath(frequencies, item.values, minimum, maximum)} key={item.label} stroke={item.color} />)}
        {yTicks.map((tick) => <text className="axis-text" key={tick} textAnchor="end" x="42" y={yFor(tick) + 3}>{tick.toFixed(0)}</text>)}
        {xTicks.map((tick) => <text className="axis-text" key={tick} textAnchor="middle" x={xFor(tick)} y="310">{tick >= 1000 ? `${tick / 1000}k` : tick}</text>)}
      </svg>
      <span className="plot-unit">{unit}</span><span className="plot-frequency-label">Frequency (Hz, log scale)</span>
      <div className="plot-legend">{series.map((item) => <span key={item.label}><i style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
    </div>
  )
}

function HrirPlot({ left, right, sampleRate, exportId }: { left: Float64Array; right: Float64Array; sampleRate: number; exportId?: string }) {
  const visibleSamples = Math.min(left.length, Math.round(sampleRate * 0.012))
  const samples = Math.max(2, visibleSamples)
  const peak = Math.max(1e-8, ...left.slice(0, samples).map(Math.abs), ...right.slice(0, samples).map(Math.abs))
  const path = (values: Float64Array) => Array.from({ length: samples }, (_, index) => {
    const x = 42 + index / (samples - 1) * 938
    const y = 142 - values[index] / peak * 105
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
  return (
    <div className="hrir-plot" role="img" aria-label="Left and right head-related impulse responses">
      <svg id={exportId} viewBox="0 0 1000 190" preserveAspectRatio="none">
        <line className="plot-axis-line" x1="42" x2="980" y1="142" y2="142" />
        <line className="plot-axis-line" x1="42" x2="42" y1="18" y2="166" />
        <line className="plot-zero-line" x1="42" x2="980" y1="142" y2="142" />
        <path className="response-line" d={path(left)} stroke={palette[0]} />
        <path className="response-line" d={path(right)} stroke={palette[1]} />
        <text className="axis-text" textAnchor="start" x="44" y="179">0 ms</text>
        <text className="axis-text" textAnchor="end" x="978" y="179">12 ms</text>
      </svg>
      <div className="plot-legend"><span><i style={{ backgroundColor: palette[0] }} />Left HRIR</span><span><i style={{ backgroundColor: palette[1] }} />Right HRIR</span></div>
    </div>
  )
}

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('outer')
  const [activeResponse, setActiveResponse] = useState<ResponseKey>('combined')
  const [plotMode, setPlotMode] = useState<PlotMode>('magnitude')
  const [values, setValues] = useState(initialValues)
  const [processedAudio, setProcessedAudio] = useState<Float32Array | null>(null)
  const [processedRightAudio, setProcessedRightAudio] = useState<Float32Array | null>(null)
  const [processedSampleRate, setProcessedSampleRate] = useState(48000)
  const [audioInput, setAudioInput] = useState<AudioInput | null>(null)
  const [audioStatus, setAudioStatus] = useState('Choose a source to hear the currently selected response.')
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioPlaybackRef = useRef<ActivePlayback | null>(null)
  const isPlayingRef = useRef(false)
  const skipAutomaticReprocessRef = useRef(false)
  const frequencies = useMemo(() => logarithmicFrequencies(), [])
  const controls = activeModule === 'outer' ? outerControls : activeModule === 'middle' ? middleControls : hrtfControls

  const model = useMemo(() => {
    const outerParameters = createOuterEarParameters({
      canalLengthMm: values.canalLength, canalDiameterMm: values.canalDiameter, conchaDepthMm: values.conchaDepth,
      conchaVolumeCm3: values.conchaVolume, azimuthDegrees: values.azimuth, elevationDegrees: values.elevation,
    })
    const outer = calculateOuterEarResponse(frequencies, outerParameters)
    const normalMiddleParameters = createMiddleEarParameters({
      lo: values.ossicularInertance * 1e-3, cd1: values.eardrumCompliance * 1e-6, ro: values.ossicularLoss,
    })
    const omeScenario = createOmeScenario(normalMiddleParameters, values.omeSeverity)
    const baselineMiddle = calculateMiddleEarResponse(frequencies, normalMiddleParameters)
    const middle = calculateMiddleEarResponse(frequencies, omeScenario.parameters)
    const direction = { azimuthDegrees: values.azimuth, elevationDegrees: values.elevation }
    const hrtfParameters = createHrtfParameters({ headDiameterMm: values.headDiameter })
    const hrtf = calculateHrtfResponse(frequencies, direction, outerParameters, hrtfParameters)
    const hrir = calculateHrirPair(direction, outerParameters, hrtfParameters)
    return { outer, outerParameters, middle, baselineMiddle, middleParameters: omeScenario.parameters, omeScenario, hrtfParameters, hrtf, hrir }
  }, [frequencies, values])
  const estimatedItdSeconds = useMemo(
    () => estimateItdFromHrir(model.hrir.left, model.hrir.right, model.hrir.sampleRate, model.hrtf.maximumItdSeconds * 1.25),
    [model],
  )

  const isImpedanceUnavailable = activeResponse === 'outer' || activeResponse === 'binaural'
  const activeMode = isImpedanceUnavailable && plotMode === 'impedance' ? 'magnitude' : plotMode
  const series = useMemo((): PlotSeries[] => {
    const phase = (complex: Complex) => complex.phaseRadians() * 180 / Math.PI
    const transferValues = (response: { points: { magnitudeDb: number; phaseRadians: number }[] }) => activeMode === 'phase' ? response.points.map((point) => point.phaseRadians * 180 / Math.PI) : response.points.map((point) => point.magnitudeDb)
    if (activeResponse === 'binaural') {
      return [
        { label: 'Left HRTF', color: palette[0], values: activeMode === 'phase' ? model.hrtf.points.map((point) => phase(point.left.transfer)) : model.hrtf.points.map((point) => decibels(point.left.transfer.magnitude())) },
        { label: 'Right HRTF', color: palette[1], values: activeMode === 'phase' ? model.hrtf.points.map((point) => phase(point.right.transfer)) : model.hrtf.points.map((point) => decibels(point.right.transfer.magnitude())) },
      ]
    }
    if (activeResponse === 'outer') {
      const part = (name: 'reflector' | 'cavity' | 'canal' | 'pinna') => model.outer.points.map((point) => activeMode === 'phase' ? phase(point.components[name]) : decibels(point.components[name].magnitude()))
      return [{ label: 'Combined', color: palette[0], values: transferValues(model.outer) }, { label: 'Reflector', color: palette[1], values: part('reflector') }, { label: 'Concha cavity', color: palette[2], values: part('cavity') }, { label: 'Ear canal', color: palette[3], values: part('canal') }, { label: 'Pinna reflection', color: palette[4], values: part('pinna') }]
    }
    if (activeResponse === 'middle' && activeMode === 'impedance') {
      const components: Array<[string, 'cavity' | 'eardrum' | 'ossicles' | 'joint' | 'cochlea' | 'input']> = [['Z cavity', 'cavity'], ['Z eardrum', 'eardrum'], ['Z ossicles', 'ossicles'], ['Z joint', 'joint'], ['Z cochlea', 'cochlea'], ['Z input', 'input']]
      return components.map(([label, key], index) => ({ label, color: palette[index], values: model.middle.points.map((point) => decibels(point.impedances[key].magnitude())) }))
    }
    if (activeResponse === 'middle') {
      if (model.omeScenario.severity > 0) return [
        { label: 'Baseline middle ear', color: palette[3], values: transferValues(model.baselineMiddle) },
        { label: 'OME-like transfer', color: palette[2], values: transferValues(model.middle) },
      ]
      return [{ label: 'Eardrum → cochlear load', color: palette[2], values: transferValues(model.middle) }]
    }
    if (activeMode === 'impedance') return [{ label: 'Middle-ear input impedance', color: palette[2], values: model.middle.points.map((point) => decibels(point.impedances.input.magnitude())) }]
    if (model.omeScenario.severity > 0) return [
      { label: 'Outer ear', color: palette[1], values: transferValues(model.outer) },
      { label: 'Baseline outer × middle', color: palette[3], values: model.outer.points.map((point, index) => { const transfer = point.transfer.multiply(model.baselineMiddle.points[index].transfer); return activeMode === 'phase' ? phase(transfer) : decibels(transfer.magnitude()) }) },
      { label: 'OME-like outer × middle', color: palette[0], values: model.outer.points.map((point, index) => { const transfer = point.transfer.multiply(model.middle.points[index].transfer); return activeMode === 'phase' ? phase(transfer) : decibels(transfer.magnitude()) }) },
    ]
    return [{ label: 'Outer ear', color: palette[1], values: transferValues(model.outer) }, { label: 'Middle ear', color: palette[2], values: transferValues(model.middle) }, { label: 'Outer × middle', color: palette[0], values: model.outer.points.map((point, index) => { const transfer = point.transfer.multiply(model.middle.points[index].transfer); return activeMode === 'phase' ? phase(transfer) : decibels(transfer.magnitude()) }) }]
  }, [activeMode, activeResponse, model])

  const updateValue = (id: string, value: number) => setValues((current) => ({ ...current, [id]: value }))
  const stopAudio = useCallback(() => {
    audioPlaybackRef.current?.source.stop()
    audioPlaybackRef.current = null
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])
  const playSamples = useCallback((samples: Float32Array, sampleRate: number, preservePosition = false, rightSamples: Float32Array | null = null) => {
    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context
    void context.resume()
    const previous = audioPlaybackRef.current
    const now = context.currentTime
    const durationSeconds = samples.length / sampleRate
    const offsetSeconds = preservePosition && previous !== null
      ? (previous.offsetSeconds + now - previous.startedAt) % durationSeconds
      : 0
    const buffer = context.createBuffer(rightSamples === null ? 1 : 2, samples.length, sampleRate)
    buffer.getChannelData(0).set(samples)
    if (rightSamples !== null) buffer.getChannelData(1).set(rightSamples)
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = true
    source.connect(gain).connect(context.destination)
    if (previous !== null && preservePosition) {
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(1, now + 0.045)
      previous.gain.gain.cancelScheduledValues(now)
      previous.gain.gain.setValueAtTime(previous.gain.gain.value, now)
      previous.gain.gain.linearRampToValueAtTime(0, now + 0.045)
      window.setTimeout(() => previous.source.stop(), 55)
    } else {
      previous?.source.stop()
    }
    source.onended = () => {
      if (audioPlaybackRef.current?.source === source) {
        audioPlaybackRef.current = null
        isPlayingRef.current = false
        setIsPlaying(false)
      }
    }
    source.start(now, offsetSeconds)
    audioPlaybackRef.current = { source, gain, startedAt: now, offsetSeconds }
    isPlayingRef.current = true
    setIsPlaying(true)
  }, [])
  const processInput = useCallback((input: AudioInput, shouldPlay: boolean, preservePosition = false) => {
    const outerParameters = createOuterEarParameters({ canalLengthMm: values.canalLength, canalDiameterMm: values.canalDiameter, conchaDepthMm: values.conchaDepth, conchaVolumeCm3: values.conchaVolume, azimuthDegrees: values.azimuth, elevationDegrees: values.elevation })
    const middleParameters = createOmeScenario(createMiddleEarParameters({ lo: values.ossicularInertance * 1e-3, cd1: values.eardrumCompliance * 1e-6, ro: values.ossicularLoss }), values.omeSeverity).parameters
    if (activeResponse === 'binaural') {
      const rendered = renderBinaural(input.samples, input.sampleRate, {
        direction: { azimuthDegrees: values.azimuth, elevationDegrees: values.elevation },
        outerEarParameters: outerParameters,
        middleEarParameters: middleParameters,
        hrtfParameters: createHrtfParameters({ headDiameterMm: values.headDiameter }),
      })
      setProcessedAudio(rendered.left)
      setProcessedRightAudio(rendered.right)
      setProcessedSampleRate(rendered.sampleRate)
      setAudioStatus(`${input.label} rendered binaurally through HRTF + shared middle-ear transfer.`)
      if (shouldPlay) playSamples(rendered.left, rendered.sampleRate, preservePosition, rendered.right)
      return
    }
    const processed = applyFrequencyResponse(input.samples, input.sampleRate, (frequencyHz) => {
      const frequency = Math.max(20, frequencyHz)
      const outer = calculateOuterEarAtFrequency(frequency, outerParameters).transfer
      const middle = calculateMiddleEarAtFrequency(frequency, middleParameters).transfer
      if (activeResponse === 'outer') return outer
      if (activeResponse === 'middle') return middle
      return outer.multiply(middle)
    })
    setProcessedAudio(processed)
    setProcessedRightAudio(null)
    setProcessedSampleRate(input.sampleRate)
    setAudioStatus(`${input.label} processed through ${responseLabels[activeResponse].toLowerCase()}.`)
    if (shouldPlay) playSamples(processed, input.sampleRate, preservePosition)
  }, [activeResponse, playSamples, values])
  const renderSource = (samples: Float32Array, sampleRate: number, label: string) => {
    const input = { samples, sampleRate, label }
    skipAutomaticReprocessRef.current = true
    setAudioInput(input)
    processInput(input, true)
  }
  const loadAudioFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file === undefined) return
    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context
    const decoded = await context.decodeAudioData(await file.arrayBuffer())
    const mono = new Float32Array(decoded.length)
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel)
      for (let index = 0; index < decoded.length; index += 1) mono[index] += data[index] / decoded.numberOfChannels
    }
    renderSource(mono, decoded.sampleRate, file.name)
    event.target.value = ''
  }
  useEffect(() => {
    if (audioInput === null) return
    if (skipAutomaticReprocessRef.current) {
      skipAutomaticReprocessRef.current = false
      return
    }
    const timeout = window.setTimeout(() => processInput(audioInput, isPlayingRef.current, isPlayingRef.current), 220)
    return () => window.clearTimeout(timeout)
  }, [audioInput, processInput])
  const middlePeak = model.middle.peak
  const chooseListeningPath = (response: ResponseKey) => {
    setActiveResponse(response)
    if (response !== 'combined') setActiveModule(response === 'binaural' ? 'hrtf' : response)
  }
  const loadFormalExperiment = (experiment: (typeof formalExperiments)[number]) => {
    setActiveResponse('middle')
    setActiveModule('middle')
    setValues((current) => ({
      ...current,
      ossicularInertance: (experiment.overrides.lo ?? 40e-3) * 1e3,
      eardrumCompliance: (experiment.overrides.cd1 ?? 0.8e-6) * 1e6,
      ossicularLoss: experiment.overrides.ro ?? 70,
      omeSeverity: 0,
    }))
  }
  const loadHrtfTestCase = (testCase: HrtfTestCase) => {
    setActiveResponse('binaural')
    setActiveModule('hrtf')
    setPlotMode('magnitude')
    setValues({ ...initialValues, ...controlValuesForHrtfCase(testCase) })
  }
  const exportRenderedAudio = () => {
    if (processedAudio === null) return
    const direction = `${values.azimuth >= 0 ? 'left' : 'right'}${Math.abs(values.azimuth)}deg_el${values.elevation}deg`
    downloadStereoWav(
      { left: processedAudio, right: processedRightAudio ?? processedAudio },
      processedSampleRate,
      `ear-model-${activeResponse}-${direction}.wav`,
    )
  }
  const exportHrir = () => {
    const direction = `${values.azimuth >= 0 ? 'left' : 'right'}${Math.abs(values.azimuth)}deg_el${values.elevation}deg`
    downloadStereoWav(model.hrir, model.hrir.sampleRate, `ear-model-hrir-${direction}.wav`)
  }
  const exportHrtfData = () => {
    const direction = `${values.azimuth >= 0 ? 'left' : 'right'}${Math.abs(values.azimuth)}deg_el${values.elevation}deg`
    downloadCsv(
      `ear-model-hrtf-${direction}.csv`,
      ['frequency_hz', 'left_magnitude_db', 'right_magnitude_db', 'left_phase_deg', 'right_phase_deg', 'ild_db', 'predicted_itd_ms', 'hrir_estimated_itd_ms'],
      model.hrtf.points.map((point) => [
        point.frequencyHz, decibels(point.left.transfer.magnitude()), decibels(point.right.transfer.magnitude()),
        point.left.transfer.phaseRadians() * 180 / Math.PI, point.right.transfer.phaseRadians() * 180 / Math.PI, point.ildDb,
        model.hrtf.itdSeconds * 1000, estimatedItdSeconds * 1000,
      ]),
    )
  }
  const isOuterLocked = activeResponse === 'middle' || activeResponse === 'binaural'
  const isMiddleLocked = activeResponse === 'outer' || activeResponse === 'binaural'
  const isHrtfLocked = activeResponse === 'outer' || activeResponse === 'middle'

  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="#workspace"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M19.4 4.2c-6.2 0-10.6 4.3-10.6 10.4 0 4.5 2.5 6.4 2.5 10.1 0 1.8 1.2 3.1 3 3.1 2.3 0 2.7-2.5 3.7-4.9.8-2.1 3.9-3.1 3.9-7.4 0-3.1-1.8-5.2-4.5-5.2-2.5 0-4.3 1.9-4.3 4.6" /><path d="M15.5 17.9c.2-1.6 1.1-2.5 2.3-2.5 1 0 1.7.8 1.7 2.1 0 2.1-1.7 2.6-2.2 4.6" /></svg></span><span>Ear Acoustics<br />Simulator</span></a><div className="site-tag">Interactive auditory model</div></header>
      <section className="listening-path" aria-label="Listening path selection"><div><p className="eyebrow">Listening path</p><strong>Choose what you hear and analyze.</strong></div><div className="path-options">{(['outer', 'middle', 'combined', 'binaural'] as ResponseKey[]).map((response) => <button className={activeResponse === response ? 'active' : ''} key={response} onClick={() => chooseListeningPath(response)} type="button"><small>{response === 'outer' ? '01' : response === 'middle' ? '02' : response === 'combined' ? '01 + 02' : '03 + 02'}</small>{response === 'outer' ? 'Outer ear' : response === 'middle' ? 'Middle ear' : response === 'combined' ? 'Both modules' : 'Binaural HRTF'}</button>)}</div></section>
      <section className="intro-block"><h1>Interactive Ear Modeling</h1></section>
      <nav className="module-switcher" aria-label="Ear module controls"><button className={activeModule === 'outer' ? 'active' : ''} disabled={isOuterLocked} onClick={() => setActiveModule('outer')} type="button"><span>01</span> Outer Ear</button><button className={activeModule === 'middle' ? 'active' : ''} disabled={isMiddleLocked} onClick={() => setActiveModule('middle')} type="button"><span>02</span> Middle Ear</button><button className={activeModule === 'hrtf' ? 'active' : ''} disabled={isHrtfLocked} onClick={() => setActiveModule('hrtf')} type="button"><span>03</span> HRTF + Binaural</button><p>Inner Ear is reserved for a future module.</p></nav>
      <section className="workspace" id="workspace">
        <aside className="control-panel">
          <div className="section-title"><div><p className="eyebrow">Biological parameters</p><h2>{activeModule === 'outer' ? 'Outer-ear controls' : activeModule === 'middle' ? 'Middle-ear controls' : 'Binaural controls'}</h2></div><span className="live-dot">Live</span></div>
          <p className="panel-intro">{activeModule === 'outer' ? 'Geometry and direction controls carried forward from the outer-ear model.' : activeModule === 'middle' ? 'Adjust one inertance, compliance, or loss term; the OME control adds the graduate infection sensitivity scenario.' : 'Source direction creates complex left/right HRTFs. Head diameter controls the geometric ITD and the contralateral head-shadow relation.'}</p>
          <div className="slider-list">{controls.map((control) => <Slider control={control} key={control.id} onChange={(value) => updateValue(control.id, value)} value={values[control.id]} />)}</div>
          {activeModule === 'hrtf' && <section className="hrtf-test-cases"><h3>Comparison cases</h3><p>Each case resets the model to baseline geometry and loads a fixed source direction, so the results are reproducible.</p><div className="experiment-list">{hw3TestCases.map((testCase) => <article className="experiment-case" key={testCase.id}><div><span>{testCase.direction.azimuthDegrees}° azimuth · {testCase.direction.elevationDegrees}° elevation</span><strong>{testCase.label}</strong></div><button onClick={() => loadHrtfTestCase(testCase)} type="button">Load case</button><p><b>Expected:</b> {testCase.expectation}</p></article>)}</div></section>}
          {activeModule === 'middle' && <section className="formal-experiments"><h3>Explore parameter changes</h3><p>Each case resets the other two controls to baseline and turns off OME, so only one parameter changes.</p><div className="experiment-list">{formalExperiments.map((experiment, index) => { const result = formalExperimentResults[index]; const atOneKilohertz = result.changesAtHz.find((point) => point.frequencyHz === 1000)?.deltaDb ?? 0; return <article className="experiment-case" key={experiment.id}><div><span>{experiment.number} · {experiment.parameter}</span><strong>{experiment.title}</strong><small>{experiment.baselineDisplay} → {experiment.changedDisplay}</small></div><button onClick={() => loadFormalExperiment(experiment)} type="button">Load case</button><p><b>Prediction:</b> {experiment.prediction}</p><p><b>Verified result:</b> peak {result.baselinePeakHz.toFixed(0)} → {result.changedPeakHz.toFixed(0)} Hz; Δ at 1 kHz {atOneKilohertz >= 0 ? '+' : ''}{atOneKilohertz.toFixed(2)} dB.</p></article> })}</div></section>}
          {activeModule === 'middle' && <section className="ome-scenario"><h3>Small-child OME transfer scenario</h3><p>{model.omeScenario.description} At full severity, the profile reduces eardrum and joint compliance while increasing ossicular inertance and loss.</p><p className="ome-disclaimer">Educational sensitivity model only. It is not a pediatric normative fit, diagnosis, or patient simulation.</p><p className="ome-sources">Evidence basis: {omeScenarioEvidence.sources.map((source) => source.replace(/, DOI:.+/, '')).join(' · ')}</p></section>}
          <details className="advanced-options"><summary><span>Advanced model options</span><small>Source-tagged values</small></summary><div className="advanced-content"><p>Lutman &amp; Martin final fitted-model values (Figure 12 and Table 1). Values are retained in SI units inside the model.</p><dl>{lutmanMartinFinalParameters.map((parameter) => <div key={parameter.id}><dt>{parameter.symbol}</dt><dd>{parameter.displayValue} {parameter.displayUnit} · {parameter.subsystem}</dd></div>)}</dl></div></details>
        </aside>
        <section className="analysis-column">
          <article className="response-card">
            <div className="section-title response-heading"><div><p className="eyebrow">Frequency response</p><h2>{responseLabels[activeResponse]}</h2></div><div className="response-tabs metric-tabs" aria-label="Response metric">{(['magnitude', 'phase', 'impedance'] as PlotMode[]).map((mode) => <button className={activeMode === mode ? 'active' : ''} disabled={mode === 'impedance' && isImpedanceUnavailable} key={mode} onClick={() => setPlotMode(mode)} type="button">{mode === 'magnitude' ? 'Magnitude' : mode === 'phase' ? 'Phase' : 'Impedance'}</button>)}</div></div>
            <ResponsePlot exportId={activeResponse === 'binaural' ? 'hrtf-plot-svg' : undefined} frequencies={frequencies} mode={activeMode} series={series} />
            <div className="plot-caption"><span>{activeResponse === 'binaural' ? 'Complex left/right HRTFs include mirrored outer-ear filtering, ITD phase, and head shadow.' : activeMode === 'impedance' ? 'Component impedances shown as 20 log₁₀|Z|.' : 'Complex pressure transfer shown from 20 Hz to 20 kHz.'}</span><span>{activeResponse === 'binaural' ? `ITD: ${(model.hrtf.itdSeconds * 1000).toFixed(3)} ms · ${model.hrtf.itdSeconds >= 0 ? 'left leads' : 'right leads'}` : activeResponse === 'middle' ? `${model.omeScenario.severity > 0 ? 'OME-like' : 'Baseline'} peak: ${middlePeak.frequencyHz.toFixed(0)} Hz` : model.omeScenario.severity > 0 ? 'OME-like profile is compared with the baseline cascade.' : 'Outer × middle is an explicit cascade approximation.'}</span></div>
            {activeResponse === 'binaural' && <div className="plot-export-actions"><button onClick={() => downloadSvg('hrtf-plot-svg', `ear-model-hrtf-${values.azimuth}az-${values.elevation}el.svg`)} type="button">Export HRTF plot</button><button onClick={exportHrtfData} type="button">Export HRTF data</button></div>}
          </article>
          {activeResponse === 'binaural' ? <div className="binaural-panels">
            <article className="binaural-card"><p className="eyebrow">Time domain</p><h2>Left and right HRIR</h2><HrirPlot exportId="hrir-plot-svg" left={model.hrir.left} right={model.hrir.right} sampleRate={model.hrir.sampleRate} /><div className="plot-export-actions"><button onClick={() => downloadSvg('hrir-plot-svg', `ear-model-hrir-${values.azimuth}az-${values.elevation}el.svg`)} type="button">Export HRIR plot</button></div></article>
            <article className="binaural-card"><p className="eyebrow">Interaural level difference</p><h2>ILD by frequency</h2><ResponsePlot compact exportId="ild-plot-svg" frequencies={frequencies} mode="magnitude" series={[{ label: 'Left − right', color: palette[2], values: model.hrtf.points.map((point) => point.ildDb) }]} /><div className="plot-export-actions"><button onClick={() => downloadSvg('ild-plot-svg', `ear-model-ild-${values.azimuth}az-${values.elevation}el.svg`)} type="button">Export ILD plot</button></div></article>
            <article className="binaural-card cue-summary"><p className="eyebrow">Localization cues</p><h2>Direction summary</h2><dl><div><dt>Azimuth</dt><dd>{values.azimuth}°</dd></div><div><dt>Elevation</dt><dd>{values.elevation}°</dd></div><div><dt>Predicted ITD</dt><dd>{(model.hrtf.itdSeconds * 1000).toFixed(3)} ms</dd></div><div><dt>HRIR-estimated ITD</dt><dd>{(estimatedItdSeconds * 1000).toFixed(3)} ms</dd></div><div><dt>Head diameter</dt><dd>{values.headDiameter} mm</dd></div><div><dt>Maximum ITD</dt><dd>{(model.hrtf.maximumItdSeconds * 1000).toFixed(3)} ms</dd></div></dl><p>The HRIR estimate uses normalized cross-correlation; a positive value means the left ear leads. The audio renderer cascades this HRTF pair with the same middle-ear transfer in both channels.</p></article>
          </div> : <div className="lower-panels">
            <article className="spectrogram-card"><p className="eyebrow">Spectrogram</p><h2>Processed output</h2><Spectrogram samples={processedAudio} sampleRate={processedSampleRate} /></article>
            <article className="model-card"><p className="eyebrow">Model view</p><h2>Two modules, one path</h2><div className="model-path" aria-label="Outer and middle ear model path"><div className="model-node outer-node"><small>Module 01</small><strong>Outer ear</strong><span>Pinna · concha · canal</span></div><i aria-hidden="true">→</i><div className="model-node middle-node"><small>Module 02</small><strong>Middle ear</strong><span>Eardrum · ossicles · load</span></div></div></article>
          </div>}
        </section>
      </section>
      <footer className="audio-dock">
        <div><p className="eyebrow">Audio controls</p><strong>{audioStatus}</strong></div>
        <div className="audio-buttons">
          <button onClick={() => renderSource(whiteNoise(48000 * 3), 48000, 'White noise')} type="button">White noise</button>
          <button onClick={() => renderSource(pinkNoise(48000 * 3), 48000, 'Pink noise')} type="button">Pink noise</button>
          <label className="upload-button">Upload audio<input accept="audio/*" aria-label="Upload audio" onChange={loadAudioFile} type="file" /></label>
          <button className="play-button" disabled={processedAudio === null} onClick={() => processedAudio !== null && playSamples(processedAudio, processedSampleRate, false, processedRightAudio)} type="button">{isPlaying ? 'Restart model' : activeResponse === 'binaural' ? 'Play binaural' : 'Play model'}</button>
          <button disabled={processedAudio === null} onClick={exportRenderedAudio} type="button">Export rendered WAV</button>
          <button onClick={exportHrir} type="button">Export HRIR WAV</button>
          <button className="stop-button" disabled={!isPlaying} onClick={stopAudio} type="button">Stop</button>
        </div>
      </footer>
    </main>
  )
}

export default App
