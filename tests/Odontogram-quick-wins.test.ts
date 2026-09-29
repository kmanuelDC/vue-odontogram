// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'

const mounted: { unmount(): void }[] = []

function mountAttached(props: Record<string, unknown> = {}) {
  const wrapper = mount(Odontogram, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

function toothIds(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('[data-tooth-id]').map((tooth) => tooth.attributes('data-tooth-id')!)
}

describe('showNumbers', () => {
  it('does not render numbers by default', () => {
    const wrapper = mount(Odontogram)

    expect(wrapper.find('.odontogram__numbers').exists()).toBe(false)
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 409 694')
  })

  it('renders one hidden-from-assistive-tech number per tooth', () => {
    const wrapper = mount(Odontogram, {
      props: { showNumbers: true, dentition: 'primary', modelValue: ['51'] },
    })
    const numbers = wrapper.findAll('.odontogram__number')

    expect(wrapper.get('.odontogram__numbers').attributes('aria-hidden')).toBe('true')
    expect(numbers.map((number) => number.text()).sort()).toEqual(toothIds(wrapper).sort())
    expect(numbers.find((number) => number.text() === '51')!.classes()).toContain(
      'odontogram__number--selected',
    )
    expect(numbers.find((number) => number.text() === '52')!.classes()).not.toContain(
      'odontogram__number--selected',
    )
  })

  it('does not change selection or tooth count', async () => {
    const wrapper = mount(Odontogram, { props: { showNumbers: true } })

    expect(wrapper.findAll('[role="option"]')).toHaveLength(32)
    await wrapper.get('[aria-label="Tooth 11"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['11']])
  })
})

describe('showHalf', () => {
  it.each([
    ['upper', /^[12]/, 16],
    ['lower', /^[34]/, 16],
  ] as const)('shows only the %s permanent arch', (showHalf, pattern, count) => {
    const wrapper = mount(Odontogram, { props: { showHalf } })
    const ids = toothIds(wrapper)

    expect(ids).toHaveLength(count)
    expect(ids.every((id) => pattern.test(id))).toBe(true)
  })

  it('shows only the upper primary arch in the horizontal layout', () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal', showHalf: 'upper' },
    })
    const ids = toothIds(wrapper)

    expect(ids).toHaveLength(10)
    expect(ids.every((id) => /^[56]/.test(id))).toBe(true)
  })

  it('crops the viewBox height to the visible arch and keeps its width', () => {
    const wrapper = mount(Odontogram, { props: { showHalf: 'upper' } })
    const [, , width, height] = wrapper.get('svg').attributes('viewBox')!.split(' ').map(Number)

    expect(width).toBe(409)
    expect(height).toBeLessThan(694 / 2)
  })

  it('keeps hidden teeth in the selection', async () => {
    const wrapper = mount(Odontogram, {
      props: { showHalf: 'upper', modelValue: ['11', '41'] },
    })

    await wrapper.get('[aria-label="Tooth 12"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['11', '41', '12']])
  })

  it('gives the overlay slot only the visible anchors', () => {
    const wrapper = mount(Odontogram, {
      props: { showHalf: 'lower' },
      slots: {
        overlay: `<template #overlay="{ anchors }">
          <text class="anchor-id" v-for="anchor in anchors" :key="anchor.toothId">{{ anchor.toothId }}</text>
        </template>`,
      },
    })
    const ids = wrapper.findAll('.anchor-id').map((text) => text.text())

    expect(ids).toHaveLength(16)
    expect(ids.every((id) => /^[34]/.test(id))).toBe(true)
  })
})

describe('keyboard navigation', () => {
  it('keeps a single tab stop on the first tooth by default', () => {
    const wrapper = mount(Odontogram)
    const tabStops = wrapper.findAll('[tabindex="0"]')

    expect(tabStops).toHaveLength(1)
    expect(tabStops[0].attributes('data-tooth-id')).toBe('11')
  })

  it('puts the tab stop on the first selected visible tooth', () => {
    const wrapper = mount(Odontogram, { props: { modelValue: ['41', '26'], showHalf: 'upper' } })

    expect(wrapper.get('[tabindex="0"]').attributes('data-tooth-id')).toBe('26')
  })

  it('moves focus with arrow keys and keeps the tab stop on the focused tooth', async () => {
    const wrapper = mountAttached()

    await wrapper.get('[data-tooth-id="11"]').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('data-tooth-id')).toBe('21')
    expect(wrapper.get('[tabindex="0"]').attributes('data-tooth-id')).toBe('21')

    await wrapper.get('[data-tooth-id="21"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.getAttribute('data-tooth-id')).toBe('31')

    await wrapper.get('[data-tooth-id="31"]').trigger('keydown', { key: 'End' })
    expect(document.activeElement?.getAttribute('data-tooth-id')).toBe('38')
  })

  it('shows the tooltip of the tooth reached with the keyboard', async () => {
    const wrapper = mountAttached()

    await wrapper.get('[data-tooth-id="11"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: 12')
  })

  it('does not select teeth while navigating', async () => {
    const wrapper = mountAttached()

    await wrapper.get('[data-tooth-id="11"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('stays inside the visible arch', async () => {
    const wrapper = mountAttached({ showHalf: 'upper' })

    await wrapper.get('[data-tooth-id="11"]').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.get('[tabindex="0"]').attributes('data-tooth-id')).toBe('11')
  })

  it('removes every tab stop when disabled', () => {
    const wrapper = mount(Odontogram, { props: { disabled: true } })

    expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(0)
  })
})
