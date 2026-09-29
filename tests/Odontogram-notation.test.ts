// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import * as publicApi from '../src'

function numberOf(wrapper: ReturnType<typeof mount>, toothId: string): string {
  return wrapper
    .findAll('.odontogram__number')
    .find((number) => number.attributes('data-number-for') === toothId)!
    .text()
}

describe('notation prop', () => {
  it('exports the notation helpers', () => {
    expect(publicApi.formatToothNumber('11', 'Universal')).toBe('8')
    expect(publicApi.getPalmerQuadrant('61')).toBe('upper-left')
  })

  it('shows Universal numbers and keeps FDI IDs and events', async () => {
    const wrapper = mount(Odontogram, { props: { notation: 'Universal', showNumbers: true } })
    const tooth = wrapper.get('[data-tooth-id="11"]')

    expect(tooth.attributes('aria-label')).toBe('Tooth 8')
    expect(tooth.get('title').text()).toBe('8')
    expect(numberOf(wrapper, '11')).toBe('8')
    expect(numberOf(wrapper, '48')).toBe('32')

    await tooth.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['11']]])
  })

  it('shows primary teeth with Universal letters', async () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', notation: 'Universal', showNumbers: true },
    })

    expect(wrapper.get('[data-tooth-id="55"]').attributes('aria-label')).toBe('Tooth A')
    expect(numberOf(wrapper, '85')).toBe('T')

    await wrapper.get('[data-tooth-id="61"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: F')
  })

  it('draws Palmer corners and reads the quadrant aloud', async () => {
    const wrapper = mount(Odontogram, {
      props: { notation: 'Palmer', showNumbers: true, showSurfaces: true },
    })
    const tooth = wrapper.get('[data-tooth-id="16"]')

    // Numbers draw the corner as lines: horizontal toward the other arch,
    // vertical toward the midline.
    const corner = (toothId: string) => wrapper.get(`[data-corner-for="${toothId}"]`).attributes('d')!
    const points = (d: string) => d.match(/-?[\d.]+/g)!.map(Number)
    expect(numberOf(wrapper, '16')).toBe('6')
    expect(numberOf(wrapper, '21')).toBe('1')
    const [x1, y1, x2, y2, x3, y3] = points(corner('16'))
    expect(y1).toBe(y2)
    expect(x2).toBeGreaterThan(x1)
    expect(x3).toBe(x2)
    expect(y3).toBeLessThan(y2)
    expect(wrapper.findAll('.odontogram__number-corner')).toHaveLength(32)
    expect(tooth.get('title').text()).toBe('6┘')
    expect(tooth.attributes('aria-label')).toBe('Tooth UR6')
    expect(
      wrapper.get('[data-surface-tooth="36"][data-surface="occlusal"]').attributes('aria-label'),
    ).toBe('Tooth LL6, Occlusal')

    await tooth.trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: 6┘')
  })

  it('passes the displayed number to the tooltip slot', async () => {
    const wrapper = mount(Odontogram, {
      props: { notation: 'Universal' },
      slots: { tooltip: `<template #tooltip="{ tooth, number }">{{ tooth.id }}={{ number }}</template>` },
    })

    await wrapper.get('[data-tooth-id="26"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toBe('26=14')
  })
})
