import { describe, expect, it } from 'vitest'
import { encodeStereoWav } from './exportWav'

describe('stereo WAV export', () => {
  it('writes an interleaved, 16-bit stereo PCM WAV header and samples', () => {
    const wav = new DataView(encodeStereoWav({
      left: new Float32Array([0, 1]),
      right: new Float32Array([-1, 0.5]),
    }, 48000))

    expect(String.fromCharCode(...new Uint8Array(wav.buffer, 0, 4))).toBe('RIFF')
    expect(String.fromCharCode(...new Uint8Array(wav.buffer, 8, 4))).toBe('WAVE')
    expect(wav.getUint16(22, true)).toBe(2)
    expect(wav.getUint32(24, true)).toBe(48000)
    expect(wav.getUint16(34, true)).toBe(16)
    expect(wav.getInt16(44, true)).toBe(0)
    expect(wav.getInt16(46, true)).toBe(-32768)
    expect(wav.getInt16(48, true)).toBe(32767)
    expect(wav.getInt16(50, true)).toBe(16384)
  })

  it('uses one shared scaling factor for both channels', () => {
    const wav = new DataView(encodeStereoWav({
      left: new Float32Array([2]),
      right: new Float32Array([0.5]),
    }, 48000))

    expect(wav.getInt16(44, true)).toBe(32767)
    expect(wav.getInt16(46, true)).toBe(8192)
  })
})
