// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/data/permanent', () => ({ permanentTeethPaths: [] }))
vi.mock('../src/data/permanent-horizontal', () => ({ permanentHorizontalTeethPaths: [] }))
vi.mock('../src/data/primary', () => ({ primaryTeethPaths: [] }))

import Odontogram from '../src/components/Odontogram.vue'

describe('primary horizontal dataset isolation', () => {
  it('renders 20 teeth when permanent and primary-arch datasets are unavailable', () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal' },
    })

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 520 180')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(20)
    expect(wrapper.find('[aria-label="Tooth 51"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Tooth 85"]').exists()).toBe(true)
  })
})



