// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('horizontal odontogram interactions', () => {
  it('keeps multiple selection when the layout changes', async () => {
    const wrapper = mount(Odontogram)

    await wrapper.find('[aria-label="Tooth 11"]').trigger('click')
    await wrapper.setProps({ modelValue: ['11'], layout: 'horizontal' })
    await wrapper.find('[aria-label="Tooth 12"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['11']],
      [['11', '12']],
    ])
  })

  it('keeps single-select semantics after switching to horizontal', async () => {
    const wrapper = mount(Odontogram, {
      props: { modelValue: ['11'], singleSelect: true },
    })

    await wrapper.setProps({ layout: 'horizontal' })
    await wrapper.find('[aria-label="Tooth 12"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['12']])
  })

  it('shows conditions, labels and tooltip data in horizontal layout', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        layout: 'horizontal',
        showLabels: true,
        conditions: [
          {
            label: 'observation',
            teeth: ['16'],
            fillColor: '#fbbf24',
            outlineColor: '#b45309',
          },
        ],
      },
    })

    const tooth16 = wrapper.find('[aria-label="Tooth 16"]')
    await tooth16.trigger('mouseenter')

    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: 16')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Condition: observation')
    expect(wrapper.get('[aria-label="Tooth condition legend"]').text()).toContain('observation')
    expect(tooth16.find('path[data-colored="true"]').exists()).toBe(true)

    await tooth16.trigger('mouseleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })
})



