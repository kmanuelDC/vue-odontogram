// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('Odontogram layouts', () => {
  it('uses the arch layout by default', () => {
    const wrapper = mount(Odontogram)

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 409 694')
  })

  it('renders 32 FDI teeth with the original horizontal transforms', () => {
    const wrapper = mount(Odontogram, { props: { layout: 'horizontal' } })
    const tooth11 = wrapper.find('[aria-label="Tooth 11"]')
    const tooth21 = wrapper.find('[aria-label="Tooth 21"]')
    const tooth41 = wrapper.find('[aria-label="Tooth 41"]')
    const tooth31 = wrapper.find('[aria-label="Tooth 31"]')

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 900 150')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(32)
    expect(tooth11.element.closest('g[transform]')?.getAttribute('transform')).toBe('')
    expect(tooth21.element.closest('g[transform]')?.getAttribute('transform')).toBe(
      'translate(840, 0) scale(-1, 1) translate(-55,0)',
    )
    expect(tooth41.element.closest('g[transform]')?.getAttribute('transform')).toBe(
      'scale(1, -1) translate(0, -150)',
    )
    expect(tooth31.element.closest('g[transform]')?.getAttribute('transform')).toBe(
      'translate(840, 0) scale(-1, -1) translate(-55,-150)',
    )
  })

  it('preserves the controlled selection when switching layouts', async () => {
    const wrapper = mount(Odontogram, { props: { modelValue: ['11'] } })

    expect(wrapper.find('[aria-label="Tooth 11"]').attributes('aria-selected')).toBe('true')

    await wrapper.setProps({ layout: 'horizontal' })

    expect(wrapper.find('[aria-label="Tooth 11"]').attributes('aria-selected')).toBe('true')
  })
})



