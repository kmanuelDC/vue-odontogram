// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

const lateralIncisorTransform = 'translate(-6 0)'

describe('primary lateral incisor spacing', () => {
  it('keeps each lateral incisor straight while moving it away from the midline', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    for (const toothId of ['52', '62', '82', '72']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        lateralIncisorTransform,
      )
    }

    expect(wrapper.get('[aria-label="Tooth 62"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, 1) translate(-409, 0)',
    )
  })
})







