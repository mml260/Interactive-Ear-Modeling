export type StereoSamples = {
  left: Float32Array | Float64Array
  right: Float32Array | Float64Array
}

function assertStereoSamples({ left, right }: StereoSamples, sampleRate: number): void {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    throw new RangeError('WAV export requires non-empty left and right channels with the same length.')
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isInteger(sampleRate)) {
    throw new RangeError('WAV export requires a positive integer sample rate.')
  }
}

/**
 * Creates a stereo 16-bit PCM WAV file. Both channels receive one shared gain
 * reduction only if necessary, preserving their relative level difference.
 */
export function encodeStereoWav(samples: StereoSamples, sampleRate: number): ArrayBuffer {
  assertStereoSamples(samples, sampleRate)
  const { left, right } = samples
  let peak = 0
  for (const sample of left) peak = Math.max(peak, Math.abs(sample))
  for (const sample of right) peak = Math.max(peak, Math.abs(sample))
  const scale = peak > 1 ? 1 / peak : 1
  const bytesPerSample = 2
  const channelCount = 2
  const dataSize = left.length * channelCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index))
  }

  writeText(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true)
  view.setUint16(32, channelCount * bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let index = 0; index < left.length; index += 1) {
    for (const sample of [left[index], right[index]]) {
      const normalized = Math.max(-1, Math.min(1, sample * scale))
      view.setInt16(offset, Math.round(normalized * (normalized < 0 ? 32768 : 32767)), true)
      offset += bytesPerSample
    }
  }
  return buffer
}

export function downloadStereoWav(samples: StereoSamples, sampleRate: number, filename: string): void {
  const blob = new Blob([encodeStereoWav(samples, sampleRate)], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
