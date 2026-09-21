// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('primary arch spacing', () => {
  it('uses the intended placement adjustments in all four quadrants', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    for (const toothId of ['52', '62', '72', '82']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        'translate(-6 0) rotate(20 141.6 39.4)',
      )
    }

    for (const toothId of ['53', '63', '73', '83']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        'translate(209 20) scale(-1 1)',
      )
    }

    for (const toothId of ['54', '64', '74', '84']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        'translate(-20 -4)',
      )
    }

    for (const toothId of ['55', '65', '75', '85']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        'translate(0 6)',
      )
    }
  })
})
