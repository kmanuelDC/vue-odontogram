// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('Odontogram', () => {
  it('renders the 32 permanent teeth with FDI identifiers', () => {
    const wrapper = mount(Odontogram)

    const teeth = wrapper.findAll('[role="option"]')
    expect(teeth).toHaveLength(32)
    expect(teeth.map((tooth) => tooth.attributes('aria-label'))).toContain('Tooth 11')
    expect(teeth.map((tooth) => tooth.attributes('aria-label'))).toContain('Tooth 48')
  })

  it('updates v-model and emits selection events in multiple mode', async () => {
    const wrapper = mount(Odontogram)
    const teeth = wrapper.findAll('[role="option"]')

    await teeth[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['11']])
    expect(wrapper.emitted('change')?.[0]).toEqual([['11']])
    expect(wrapper.emitted('tooth-click')?.[0]?.[0]).toMatchObject({ id: '11' })

    await wrapper.setProps({ modelValue: ['11'] })
    await teeth[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['11', '12']])
  })

  it('keeps only the most recently selected tooth in single-select mode', async () => {
    const wrapper = mount(Odontogram, { props: { singleSelect: true, modelValue: ['11'] } })
    const teeth = wrapper.findAll('[role="option"]')

    await teeth[1].trigger('click')

    expect(wrapper.attributes('aria-multiselectable')).toBe('false')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['12']])
  })
})



