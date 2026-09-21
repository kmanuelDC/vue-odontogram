// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

describe('primary horizontal odontogram', () => {
  it('preserves controlled FDI selection when switching from arch to horizontal', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
        modelValue: ['51'],
      },
    })

    await wrapper.setProps({ layout: 'horizontal' })
    await wrapper.find('[aria-label="Tooth 52"]').trigger('click')

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 520 180')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['51', '52']])
    expect(wrapper.emitted('tooth-click')?.[0]?.[0]).toMatchObject({
      id: '52',
      dentition: 'primary',
      type: 'Primary Lateral Incisor',
    })
  })

  it('applies only each horizontal shape local scale, not arch-only adjustments', () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal' },
    })

    expect(wrapper.get('[aria-label="Tooth 51"]').attributes('transform')).toBe(
      'translate(360.75 13.3) scale(-0.75 0.75)',
    )
    expect(wrapper.get('[aria-label="Tooth 52"]').attributes('transform')).toBe(
      'translate(36.75 10.5) scale(0.75)',
    )
    expect(wrapper.get('[aria-label="Tooth 53"]').attributes('transform')).toBe(
      'translate(24.75 10.25) scale(0.75)',
    )
  })
})













