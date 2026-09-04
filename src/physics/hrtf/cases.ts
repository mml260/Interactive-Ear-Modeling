import type { SourceDirection } from './calculateHrtf'

export type HrtfTestCase = {
  id: 'median-plane' | 'lateral-left' | 'elevated-front'
  label: string
  direction: SourceDirection
  expectation: string
}

/** Fixed HW3 comparison directions, all evaluated with the baseline geometry. */
export const hw3TestCases: readonly HrtfTestCase[] = [
  {
    id: 'median-plane',
    label: 'Median plane · front',
    direction: { azimuthDegrees: 0, elevationDegrees: 0 },
    expectation: 'No geometric ITD or head-shadow ILD; localization is carried by the shared spectral response.',
  },
  {
    id: 'lateral-left',
    label: 'Strongly lateral · left',
    direction: { azimuthDegrees: 75, elevationDegrees: 0 },
    expectation: 'The left ear leads and the right ear becomes increasingly attenuated at high frequencies.',
  },
  {
    id: 'elevated-front',
    label: 'Elevated · front',
    direction: { azimuthDegrees: 0, elevationDegrees: 45 },
    expectation: 'Elevation alters spectral peaks and notches without adding a geometric interaural delay.',
  },
]

/** Maps a physical source direction to the UI's persisted control names. */
export function controlValuesForHrtfCase(testCase: HrtfTestCase): { azimuth: number; elevation: number } {
  return {
    azimuth: testCase.direction.azimuthDegrees,
    elevation: testCase.direction.elevationDegrees,
  }
}
