// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import { getToothAnchors } from '../src/utils/anchors'
import { getToothStateMarks } from '../src/utils/state-marks'

const states = {
  18: 'extracted',
  28: 'missing',
  36: 'implant',
  48: 'unerupted',
} as const

describe('tooth state marks', () => {
  const anchors = getToothAnchors('permanent', 'arch')

  it('draws a cross for extracted teeth and an implant for implants only', () => {
    const marks = getToothStateMarks(anchors, states)

    expect(marks.map(({ kind, toothId }) => `${kind}:${toothId}`).sort()).toEqual([
      'cross:18',
      'implant:36',
    ])
  })

  it('keeps every mark inside its tooth', () => {
    for (const mark of getToothStateMarks(anchors, states)) {
      const { box } = anchors.find(({ toothId }) => toothId === mark.toothId)!
      const lines = mark.kind === 'cross' ? mark.lines : mark.threads
      const points = lines.flatMap(({ x1, y1, x2, y2 }) => [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ])

      for (const { x, y } of points) {
        expect(x).toBeGreaterThanOrEqual(box.x)
        expect(x).toBeLessThanOrEqual(box.x + box.width)
        expect(y).toBeGreaterThanOrEqual(box.y)
        expect(y).toBeLessThanOrEqual(box.y + box.height)
      }
    }
  })

  it('draws nothing without states', () => {
    expect(getToothStateMarks(anchors, undefined)).toEqual([])
  })
})

describe('toothStates prop', () => {
  it('renders every tooth as present by default', () => {
    const wrapper = mount(Odontogram)

    expect(
      wrapper.findAll('[data-tooth-state]').every((tooth) => tooth.attributes('data-tooth-state') === 'present'),
    ).toBe(true)
    expect(wrapper.find('.odontogram__state-marks').exists()).toBe(false)
  })

  it('draws absent teeth as a dashed outline without crown details', () => {
    const wrapper = mount(Odontogram, { props: { toothStates: states } })
    const extracted = wrapper.get('[data-tooth-id="18"]')
    const present = wrapper.get('[data-tooth-id="17"]')

    expect(extracted.classes()).toEqual(
      expect.arrayContaining(['odontogram-tooth--absent', 'odontogram-tooth--extracted']),
    )
    expect(extracted.findAll('path')[0].attributes('stroke-dasharray')).toBe('4 3')
    expect(extracted.findAll('path')).toHaveLength(2)
    expect(present.findAll('path').length).toBeGreaterThan(2)
    expect(wrapper.get('[data-tooth-id="28"]').classes()).toContain('odontogram-tooth--missing')
    expect(wrapper.get('[data-tooth-id="48"]').classes()).toContain('odontogram-tooth--unerupted')
    expect(wrapper.get('[data-tooth-id="48"]').classes()).not.toContain('odontogram-tooth--absent')
  })

  it('draws the cross and implant marks over their teeth', () => {
    const wrapper = mount(Odontogram, { props: { toothStates: states } })
    const marks = wrapper.get('.odontogram__state-marks')

    expect(marks.attributes('aria-hidden')).toBe('true')
    expect(marks.get('[data-mark-for="18"]').classes()).toContain('odontogram-state-mark--cross')
    expect(marks.get('[data-mark-for="18"]').findAll('line')).toHaveLength(2)
    expect(marks.get('[data-mark-for="36"]').classes()).toContain('odontogram-state-mark--implant')
    expect(marks.find('[data-mark-for="28"]').exists()).toBe(false)
  })

  it('adds the state to the accessible name', () => {
    const wrapper = mount(Odontogram, {
      props: { toothStates: states, labels: { tooth: 'Pieza', states: { extracted: 'Extraída' } } },
    })

    expect(wrapper.get('[data-tooth-id="18"]').attributes('aria-label')).toBe('Pieza 18, Extraída')
    expect(wrapper.get('[data-tooth-id="28"]').attributes('aria-label')).toBe('Pieza 28, Missing')
    expect(wrapper.get('[data-tooth-id="17"]').attributes('aria-label')).toBe('Pieza 17')
  })

  it('does not change selection, events or keyboard access', async () => {
    const wrapper = mount(Odontogram, { props: { toothStates: states, modelValue: ['18'] } })
    const extracted = wrapper.get('[data-tooth-id="18"]')

    expect(extracted.attributes('role')).toBe('option')
    expect(extracted.attributes('aria-selected')).toBe('true')
    expect(extracted.classes()).toContain('odontogram-tooth--selected')
    expect(extracted.attributes('tabindex')).toBe('0')

    await wrapper.get('[data-tooth-id="28"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['18', '28']])
    expect(wrapper.emitted('tooth-click')?.[0]?.[0]).toMatchObject({ id: '28' })
  })

  it('does not fill absent teeth with their condition color', () => {
    const wrapper = mount(Odontogram, {
      props: {
        toothStates: { 18: 'missing' },
        conditions: [{ label: 'x', teeth: ['18', '17'], fillColor: '#f00' }],
      },
    })

    expect(wrapper.get('[data-tooth-id="18"]').find('path[data-colored="true"]').exists()).toBe(false)
    expect(wrapper.get('[data-tooth-id="17"]').find('path[data-colored="true"]').exists()).toBe(true)
  })

  it('shows the state in the tooltip only when the tooth is not present', async () => {
    const wrapper = mount(Odontogram, { props: { toothStates: states } })

    await wrapper.get('[data-tooth-id="36"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('State: Implant')

    await wrapper.get('[data-tooth-id="36"]').trigger('mouseleave')
    await wrapper.get('[data-tooth-id="35"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).not.toContain('State:')
  })

  it('passes the state to the tooltip slot', async () => {
    const wrapper = mount(Odontogram, {
      props: { toothStates: states },
      slots: { tooltip: `<template #tooltip="{ tooth, state }">{{ tooth.id }}={{ state }}</template>` },
    })

    await wrapper.get('[data-tooth-id="28"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toBe('28=missing')
  })

  it('lists the visible states in the legend, in a stable order', () => {
    const wrapper = mount(Odontogram, {
      props: {
        showLabels: true,
        toothStates: { 48: 'unerupted', 18: 'extracted', 11: 'present' },
        labels: { states: { unerupted: 'No erupcionada' } },
      },
    })
    const items = wrapper.findAll('.odontogram-condition-labels__item[data-state]')

    expect(items.map((item) => item.attributes('data-state'))).toEqual(['extracted', 'unerupted'])
    expect(items[1].text()).toBe('No erupcionada')
  })

  it('shows the legend for states even without conditions', () => {
    const wrapper = mount(Odontogram, { props: { showLabels: true, toothStates: { 18: 'missing' } } })

    expect(wrapper.find('.odontogram-condition-labels').exists()).toBe(true)
  })

  it('leaves the marks and legend of the hidden arch out', () => {
    const wrapper = mount(Odontogram, {
      props: { showHalf: 'upper', showLabels: true, toothStates: states },
    })

    expect(wrapper.find('[data-mark-for="36"]').exists()).toBe(false)
    expect(wrapper.find('[data-mark-for="18"]').exists()).toBe(true)
    expect(
      wrapper.findAll('[data-state]').map((item) => item.attributes('data-state')),
    ).toEqual(['missing', 'extracted'])
  })
})
