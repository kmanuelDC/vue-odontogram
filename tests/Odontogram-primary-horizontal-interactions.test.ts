// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('primary horizontal odontogram interactions', () => {
  it('renders every primary FDI identifier with the four horizontal transforms', () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal' },
    })

    const expectedIds = [
      '51', '52', '53', '54', '55',
      '61', '62', '63', '64', '65',
      '81', '82', '83', '84', '85',
      '71', '72', '73', '74', '75',
    ]

    expect(wrapper.findAll('[role="option"]')).toHaveLength(20)
    for (const id of expectedIds) {
      expect(wrapper.find('[aria-label="Tooth ' + id + '"]').exists()).toBe(true)
    }

    expect(wrapper.get('[aria-label="Tooth 61"]').element.parentElement?.getAttribute('transform')).toBe(
      'translate(520, 105) scale(-1, 1)',
    )
    expect(wrapper.get('[aria-label="Tooth 81"]').element.parentElement?.getAttribute('transform')).toBe(
      'translate(0, 75) scale(1, -1)',
    )
    expect(wrapper.get('[aria-label="Tooth 71"]').element.parentElement?.getAttribute('transform')).toBe(
      'translate(520, 75) scale(-1, -1)',
    )
  })

  it('supports controlled multiple and single selection while disabled blocks interaction', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
        layout: 'horizontal',
        modelValue: ['51'],
      },
    })

    await wrapper.get('[aria-label="Tooth 52"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['51', '52']])

    await wrapper.setProps({ modelValue: ['51', '52'], singleSelect: true })
    await wrapper.get('[aria-label="Tooth 65"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['65']])

    const disabled = mount(Odontogram, {
      props: {
        dentition: 'primary',
        layout: 'horizontal',
        disabled: true,
      },
    })
    await disabled.get('[aria-label="Tooth 51"]').trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
    expect(disabled.get('[aria-label="Tooth 51"]').attributes('aria-disabled')).toBe('true')
  })

  it('shows primary horizontal tooltip, conditions and labels', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
        layout: 'horizontal',
        showLabels: true,
        conditions: [
          {
            label: 'observation',
            teeth: ['65'],
            fillColor: '#fbbf24',
            outlineColor: '#b45309',
          },
        ],
      },
    })

    const tooth65 = wrapper.get('[aria-label="Tooth 65"]')
    await tooth65.trigger('mouseenter')

    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: 65')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Type: Primary Second Molar')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Condition: observation')
    expect(wrapper.get('[aria-label="Tooth condition legend"]').text()).toContain('observation')
    expect(tooth65.find('path[data-colored="true"]').exists()).toBe(true)

    await tooth65.trigger('mouseleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })
})





