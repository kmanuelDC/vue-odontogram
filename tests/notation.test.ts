import { describe, expect, it } from 'vitest'
import { buildToothId } from '../src/utils/notation'
import { getQuadrant } from '../src/utils/quadrants'

describe('getQuadrant', () => {
  it.each([
    ['permanent', 'upper', 'right', 1],
    ['permanent', 'upper', 'left', 2],
    ['permanent', 'lower', 'left', 3],
    ['permanent', 'lower', 'right', 4],
    ['primary', 'upper', 'right', 5],
    ['primary', 'upper', 'left', 6],
    ['primary', 'lower', 'left', 7],
    ['primary', 'lower', 'right', 8],
  ] as const)('%s %s %s belongs to quadrant %i', (dentition, arch, side, expected) => {
    expect(getQuadrant(dentition, arch, side)).toBe(expected)
  })
})

describe('buildToothId', () => {
  it('builds every permanent FDI identifier', () => {
    const identifiers = [1, 2, 3, 4].flatMap((quadrant) =>
      Array.from({ length: 8 }, (_, index) => buildToothId('permanent', quadrant, index + 1, 'FDI')),
    )

    expect(identifiers).toEqual([
      '11', '12', '13', '14', '15', '16', '17', '18',
      '21', '22', '23', '24', '25', '26', '27', '28',
      '31', '32', '33', '34', '35', '36', '37', '38',
      '41', '42', '43', '44', '45', '46', '47', '48',
    ])
  })

  it('builds every primary FDI identifier', () => {
    const identifiers = [5, 6, 7, 8].flatMap((quadrant) =>
      Array.from({ length: 5 }, (_, index) => buildToothId('primary', quadrant, index + 1, 'FDI')),
    )

    expect(identifiers).toEqual([
      '51', '52', '53', '54', '55',
      '61', '62', '63', '64', '65',
      '71', '72', '73', '74', '75',
      '81', '82', '83', '84', '85',
    ])
  })

  it('rejects invalid quadrant and position combinations', () => {
    expect(() => buildToothId('permanent', 5, 1, 'FDI')).toThrow(RangeError)
    expect(() => buildToothId('primary', 5, 6, 'FDI')).toThrow(RangeError)
  })

  it('keeps unimplemented notations explicit', () => {
    expect(() => buildToothId('permanent', 1, 1, 'Universal')).toThrow(
      'Universal notation is not implemented yet.',
    )
  })
})



