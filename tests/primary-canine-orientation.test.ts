// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

const upperCanineTransform = 'translate(209 20) scale(-1 1)'
const lowerCanineTransform = upperCanineTransform

describe('primary canine orientation', () => {
  it('uses the same local correction in every quadrant so the lower curve mirrors the upper one', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    expect(wrapper.get('[aria-label="Tooth 53"]').attributes('transform')).toBe(
      upperCanineTransform,
    )
    expect(wrapper.get('[aria-label="Tooth 63"]').attributes('transform')).toBe(
      upperCanineTransform,
    )
    expect(wrapper.get('[aria-label="Tooth 83"]').attributes('transform')).toBe(
      lowerCanineTransform,
    )
    expect(wrapper.get('[aria-label="Tooth 73"]').attributes('transform')).toBe(
      lowerCanineTransform,
    )

    expect(wrapper.get('[aria-label="Tooth 63"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, 1) translate(-409, 0)',
    )
    expect(wrapper.get('[aria-label="Tooth 73"]').element.parentElement?.getAttribute('transform')).toBe(
      'scale(-1, -1) translate(-409, -461)',
    )
  })
})












