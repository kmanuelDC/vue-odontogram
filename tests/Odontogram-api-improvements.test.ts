// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import * as publicApi from '../src'
import { primaryHorizontalTeethPaths } from '../src/data/primary-horizontal'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('odontogram API improvements', () => {
  it('exports FDI helpers and default labels from the entry point', () => {
    expect(publicApi.buildToothId('primary', 8, 5, 'FDI')).toBe('85')
    expect(publicApi.getQuadrant('permanent', 'lower', 'left')).toBe(3)
    expect(publicApi.defaultOdontogramLabels.tooth).toBe('Tooth')
  })

  it('shows the tooltip when a tooth receives keyboard focus', async () => {
    const wrapper = mount(Odontogram)
    const tooth = wrapper.find('[aria-label="Tooth 21"]')

    await tooth.trigger('focus')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Tooth: 21')

    await tooth.trigger('blur')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('forwards the tooltip slot with tooth, selection and condition', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        modelValue: ['11'],
        conditions: [{ label: 'caries', teeth: ['11'], fillColor: '#f00' }],
      },
      slots: {
        tooltip: `<template #tooltip="{ tooth, selected, condition }">
          Pieza {{ tooth.id }} / {{ selected }} / {{ condition?.label }}
        </template>`,
      },
    })

    await wrapper.find('[aria-label="Tooth 11"]').trigger('mouseenter')

    const tooltip = wrapper.get('[role="tooltip"]').text()
    expect(tooltip).toContain('Pieza 11 / true / caries')
    expect(tooltip).not.toContain('Type:')
  })

  it('translates visible and accessible text through labels', async () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'primary',
        showLabels: true,
        conditions: [{ label: 'caries', teeth: ['65'], fillColor: '#f00' }],
        labels: {
          odontogram: 'Odontograma',
          chartTitles: { primary: 'odontograma temporal' },
          tooth: 'Pieza',
          type: 'Tipo',
          selected: 'Seleccionada',
          no: 'No',
          condition: 'Condición',
          legend: 'Leyenda de condiciones',
          toothTypes: { 'Primary Second Molar': 'Segundo molar temporal' },
        },
      },
    })

    expect(wrapper.get('[role="listbox"]').attributes('aria-label')).toBe('Odontograma')
    expect(wrapper.get('svg').attributes('aria-label')).toBe('odontograma temporal')
    expect(wrapper.find('[aria-label="Leyenda de condiciones"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Pieza 65"]').trigger('mouseenter')
    const tooltip = wrapper.get('[role="tooltip"]').text()
    expect(tooltip).toContain('Pieza: 65')
    expect(tooltip).toContain('Tipo: Segundo molar temporal')
    expect(tooltip).toContain('Seleccionada: No')
    expect(tooltip).toContain('Condición: caries')
  })

  it('does not warn for any notation', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    for (const notation of ['FDI', 'Universal', 'Palmer'] as const) {
      mount(Odontogram, { props: { notation } })
    }

    expect(warning).not.toHaveBeenCalled()
  })

  it('renders legend entries that share a label and applies the last condition', () => {
    const wrapper = mount(Odontogram, {
      props: {
        showLabels: true,
        conditions: [
          { label: 'observation', teeth: ['11'], fillColor: '#111111' },
          { label: 'observation', teeth: ['11'], fillColor: '#222222' },
        ],
      },
    })

    expect(wrapper.findAll('.odontogram-condition-labels__item')).toHaveLength(2)
    expect(
      wrapper.get('[aria-label="Tooth 11"] path[data-colored="true"]').attributes('fill'),
    ).toBe('#222222')
  })

  it('renders the overlay slot inside the SVG with anchors in viewBox coordinates', async () => {
    const wrapper = mount(Odontogram, {
      props: { dentition: 'primary', layout: 'horizontal' },
      slots: {
        overlay: `<template #overlay="{ anchors, viewBox, dentition, layout }">
          <text
            v-for="anchor in Object.values(anchors)"
            :key="anchor.toothId"
            class="tooth-number"
            :x="anchor.center.x"
            :y="anchor.center.y"
            :data-view-box="viewBox.width + 'x' + viewBox.height"
            :data-mode="dentition + ':' + layout"
          >{{ anchor.toothId }}</text>
        </template>`,
      },
    })

    const overlay = wrapper.get('svg > g.odontogram__overlay')
    const numbers = overlay.findAll('text.tooth-number')
    expect(numbers).toHaveLength(20)

    const number51 = numbers.find((text) => text.text() === '51')!
    const anchor51 = publicApi.getToothAnchors('primary', 'horizontal').find(
      ({ toothId }) => toothId === '51',
    )!
    expect(Number(number51.attributes('x'))).toBeCloseTo(anchor51.center.x, 6)
    expect(number51.attributes('data-view-box')).toBe('520x180')
    expect(number51.attributes('data-mode')).toBe('primary:horizontal')

    await wrapper.setProps({ dentition: 'permanent' })
    expect(wrapper.findAll('text.tooth-number')).toHaveLength(32)
  })

  it('does not render an overlay group without the slot', () => {
    const wrapper = mount(Odontogram)
    expect(wrapper.find('.odontogram__overlay').exists()).toBe(false)
  })

  it('applies primary arch offsets only in the arch layout', async () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'primary' } })

    expect(wrapper.get('[aria-label="Tooth 55"]').attributes('transform')).toBe('translate(0 6)')

    await wrapper.setProps({ layout: 'horizontal' })
    const secondMolar = primaryHorizontalTeethPaths.find(({ position }) => position === 5)
    expect(wrapper.get('[aria-label="Tooth 55"]').attributes('transform')).toBe(
      secondMolar?.transform,
    )
  })
})
