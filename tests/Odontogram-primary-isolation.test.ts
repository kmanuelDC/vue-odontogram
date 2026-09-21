// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/data/permanent', () => ({ permanentTeethPaths: [] }))
vi.mock('../src/data/permanent-horizontal', () => ({ permanentHorizontalTeethPaths: [] }))

import Odontogram from '../src/components/Odontogram.vue'

describe('primary odontogram dataset isolation', () => {
  it('renders its 20 teeth when both permanent datasets are unavailable', () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    expect(wrapper.findAll('[role="option"]')).toHaveLength(20)
    expect(wrapper.find('[aria-label="Tooth 51"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Tooth 85"]').exists()).toBe(true)
  })
})



