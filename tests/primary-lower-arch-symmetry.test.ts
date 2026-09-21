// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

const upperToLowerPairs = [
  ['51', '81'],
  ['52', '82'],
  ['53', '83'],
  ['54', '84'],
  ['55', '85'],
  ['61', '71'],
  ['62', '72'],
  ['63', '73'],
  ['64', '74'],
  ['65', '75'],
] as const

describe('primary lower arch symmetry', () => {
  it('keeps every paired path and local spacing identical to the upper arch', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    for (const [upperId, lowerId] of upperToLowerPairs) {
      const upper = wrapper.get('[aria-label="Tooth ' + upperId + '"]')
      const lower = wrapper.get('[aria-label="Tooth ' + lowerId + '"]')

      expect(lower.get('path').attributes('d')).toBe(upper.get('path').attributes('d'))
      expect(lower.attributes('transform')).toBe(upper.attributes('transform'))
    }

    expect(wrapper.get('[aria-label="Tooth 81"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(1, -1) translate(0, -461)',
    )
    expect(wrapper.get('[aria-label="Tooth 71"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, -1) translate(-409, -461)',
    )
  })
})
