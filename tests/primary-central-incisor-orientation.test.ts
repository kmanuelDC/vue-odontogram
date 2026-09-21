// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

const separatedCentralIncisorTransform = 'translate(366 0) scale(-1 1)'

describe('primary central incisor orientation', () => {
  it('mirrors the central incisor and separates the pair from the midline', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    for (const toothId of ['51', '61', '81', '71']) {
      expect(wrapper.get('[aria-label="Tooth ' + toothId + '"]').attributes('transform')).toBe(
        separatedCentralIncisorTransform,
      )
    }

    expect(wrapper.get('[aria-label="Tooth 61"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, 1) translate(-409, 0)',
    )
    expect(wrapper.get('[aria-label="Tooth 71"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, -1) translate(-409, -461)',
    )
  })
})



