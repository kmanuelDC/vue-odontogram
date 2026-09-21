// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('primary odontogram', () => {
  it('renders 20 primary teeth with FDI identifiers and primary transforms', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 409 461')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(20)
    expect(wrapper.find('[aria-label="Tooth 51"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Tooth 85"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Tooth 11"]').exists()).toBe(false)
    expect(
      wrapper.find('[aria-label="Tooth 71"]').element.parentElement?.getAttribute('transform'),
    ).toBe('scale(-1, -1) translate(-409, -461)')
  })

  it('keeps v-model selection and emits primary tooth events', async () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    await wrapper.find('[aria-label="Tooth 51"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['51']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['51']])
    expect(wrapper.emitted('tooth-click')?.[0]?.[0]).toMatchObject({
      id: '51',
      dentition: 'primary',
      type: 'Primary Central Incisor',
    })
  })

  it('renders the independent horizontal primary dataset without falling back', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal' },
    })

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 520 180')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(20)
    expect(wrapper.find('[aria-label="Tooth 51"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Tooth 85"]').exists()).toBe(true)
    expect(
      wrapper.find('[aria-label="Tooth 61"]').element.parentElement?.getAttribute('transform'),
    ).toBe('translate(520, 105) scale(-1, 1)')
    expect(warning).not.toHaveBeenCalled()

    warning.mockRestore()
  })
})









