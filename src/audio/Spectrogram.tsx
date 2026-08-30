import { useEffect, useRef } from 'react'

type SpectrogramProps = { samples: Float32Array | null; sampleRate: number }

function colorForLevel(level: number): string {
  const clipped = Math.max(0, Math.min(1, level))
  const red = Math.round(12 + 240 * clipped ** 1.8)
  const green = Math.round(43 + 185 * clipped)
  const blue = Math.round(92 + 92 * (1 - clipped))
  return `rgb(${red} ${green} ${blue})`
}

export function Spectrogram({ samples, sampleRate }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return
    const width = canvas.width
    const height = canvas.height
    context.fillStyle = '#0a2c5d'
    context.fillRect(0, 0, width, height)
    if (samples === null) return

    const frameSize = 256
    const hop = 128
    const bins = 72
    const frames = Math.min(width, Math.max(1, Math.floor((samples.length - frameSize) / hop)))
    const frameStep = Math.max(1, Math.floor(frames / width))
    for (let column = 0; column < width; column += 1) {
      const frame = Math.min(frames - 1, column * frameStep)
      const start = frame * hop
      for (let bin = 0; bin < bins; bin += 1) {
        let real = 0
        let imaginary = 0
        const frequencyBin = bin + 1
        for (let index = 0; index < frameSize; index += 1) {
          const sample = samples[Math.min(start + index, samples.length - 1)] * (0.5 - 0.5 * Math.cos(2 * Math.PI * index / (frameSize - 1)))
          const angle = 2 * Math.PI * frequencyBin * index / frameSize
          real += sample * Math.cos(angle)
          imaginary -= sample * Math.sin(angle)
        }
        const level = Math.log10(1 + Math.hypot(real, imaginary) * 4) / 1.7
        context.fillStyle = colorForLevel(level)
        context.fillRect(column, height - (bin + 1) * height / bins, 1, Math.ceil(height / bins))
      }
    }
  }, [samples, sampleRate])

  return <div className="spectrogram-canvas-wrap"><canvas aria-label="Processed-audio spectrogram" height="136" ref={canvasRef} width="360" />{samples === null && <span>Generate noise or upload audio to view the processed output.</span>}</div>
}
