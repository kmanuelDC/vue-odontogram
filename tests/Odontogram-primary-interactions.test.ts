// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('primary odontogram interactions', () => {
  it('preserves controlled multiple selection and v-model identifiers', async () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', modelValue: ['51'] },
    })

    await wrapper.find('[aria-label="Tooth 52"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['51', '52']])

    await wrapper.setProps({ modelValue: ['51', '52'] })
    await wrapper.find('[aria-label="Tooth 51"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['52']])
  })

  it('uses primary identifiers for single selection and tooth-click events', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
        modelValue: ['51'],
        singleSelect: true,
      },
    })

    await wrapper.find('[aria-label="Tooth 65"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['65']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['65']])
    expect(wrapper.emitted('tooth-click')?.[0]?.[0]).toMatchObject({
      id: '65',
      dentition: 'primary',
      type: 'Primary Second Molar',
    })
  })

  it('shows primary condition, legend and tooltip data', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
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

    const tooth65 = wrapper.find('[aria-label="Tooth 65"]')
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



