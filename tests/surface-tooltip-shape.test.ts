// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import SurfaceGuide from '../src/components/SurfaceGuide.vue'
import * as publicApi from '../src'
import type { OdontogramFinding } from '../src/types/findings'
import { getLayoutViewBox, getToothAnchors } from '../src/utils/anchors'
import { buildSurfaceDiagram, getSurfaceAxes, getSurfaceDiagrams, surfaceCenter } from '../src/utils/surfaces'
import { getPathBox } from '../src/utils/svg-geometry'
import { getToothFrames } from '../src/utils/tooth-frames'

const surface = (toothId: string, name: string) => `[data-surface-tooth="${toothId}"][data-surface="${name}"]`

describe('surface tooltip', () => {
  const findings: OdontogramFinding[] = [
    { code: 'caries', teeth: ['16'], surfaces: ['occlusal'] },
    { code: 'restoration', teeth: ['16'], surfaces: ['occlusal'], status: 'planned' },
    { code: 'caries', teeth: ['16'], surfaces: ['distal'] },
    { code: 'pulp-treatment', teeth: ['16'] },
  ]

  it('describes the hovered surface: name, definition, its findings and selection', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, findings, surfaces: { 16: ['occlusal'] } },
    })

    await wrapper.get(surface('16', 'occlusal')).trigger('mouseenter')
    const text = wrapper.get('[role="tooltip"]').text()

    expect(text).toContain('Tooth: 16')
    expect(text).toContain('Surface: Occlusal')
    expect(text).toContain('Chewing surface of molars and premolars.')
    expect(text).toContain('Findings: Lesión de caries dental, Restauración definitiva (Planned)')
    expect(text).toContain('Selected: Yes')
    // Tooth-level details are left out.
    expect(text).not.toContain('Tratamiento pulpar')
    expect(text).not.toContain('Type:')

    await wrapper.get(surface('16', 'occlusal')).trigger('mouseleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('uses clinical names and the chart notation', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, notation: 'Universal', labels: { surface: 'Superficie' } },
    })

    await wrapper.get(surface('11', 'lingual')).trigger('mouseenter')
    const text = wrapper.get('[role="tooltip"]').text()

    expect(text).toContain('Tooth: 8')
    expect(text).toContain('Superficie: Palatal')
    expect(text).toContain('Selected: No')
  })

  it('opens on keyboard focus and returns to the tooth tooltip on a tooth', async () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true }, attachTo: document.body })

    await wrapper.get(surface('26', 'mesial')).trigger('focus')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Surface: Mesial')

    await wrapper.get(surface('26', 'mesial')).trigger('blur')
    await wrapper.get('[data-tooth-id="26"]').trigger('mouseenter')
    const text = wrapper.get('[role="tooltip"]').text()
    expect(text).toContain('Type:')
    expect(text).not.toContain('Surface:')
    wrapper.unmount()
  })

  it('follows the same showTooltip switch as the teeth', async () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true, showTooltip: false } })

    await wrapper.get(surface('16', 'occlusal')).trigger('mouseenter')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('passes the surface to the tooltip slot', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true },
      slots: {
        tooltip: `<template #tooltip="{ tooth, surface, surfaceName }">{{ tooth.id }}|{{ surface ?? '-' }}|{{ surfaceName ?? '-' }}</template>`,
      },
    })

    await wrapper.get(surface('36', 'lingual')).trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toBe('36|lingual|Lingual')

    await wrapper.get(surface('36', 'lingual')).trigger('mouseleave')
    await wrapper.get('[data-tooth-id="36"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).toBe('36|-|-')
  })
})

describe('per-surface summary in the tooth tooltip', () => {
  const findings: OdontogramFinding[] = [
    { code: 'caries', teeth: ['16'], surfaces: ['mesial', 'occlusal'] },
    { code: 'restoration', teeth: ['16'], surfaces: ['occlusal'], status: 'planned' },
    { code: 'pulp-treatment', teeth: ['16'] },
  ]

  it('lists whole-tooth findings apart from a line per surface', async () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true, findings } })

    await wrapper.get('[data-tooth-id="16"]').trigger('mouseenter')
    const tooltip = wrapper.get('[role="tooltip"]')
    const lines = tooltip.findAll('[data-summary-surface]').map((line) => line.text())

    expect(tooltip.text()).toContain('Findings: Tratamiento pulpar')
    expect(tooltip.text()).not.toContain('Findings: Tratamiento pulpar, Lesión')
    expect(tooltip.text()).toContain('Surfaces:')
    expect(lines).toEqual([
      'M Mesial: Lesión de caries dental',
      'O Occlusal: Lesión de caries dental, Restauración definitiva (Planned)',
    ])
  })

  it('translates the heading and passes the summary to the tooltip slot', async () => {
    const translated = mount(Odontogram, {
      props: { showSurfaces: true, findings, labels: { surfaceSummary: 'Superficies' } },
    })
    await translated.get('[data-tooth-id="16"]').trigger('mouseenter')
    expect(translated.get('[role="tooltip"]').text()).toContain('Superficies:')

    const slotted = mount(Odontogram, {
      props: { showSurfaces: true, findings },
      slots: {
        tooltip: `<template #tooltip="{ surfaceSummary, findings }">{{ surfaceSummary.map((line) => line.letter).join('') }}|{{ findings.join(',') }}</template>`,
      },
    })
    await slotted.get('[data-tooth-id="16"]').trigger('mouseenter')
    expect(slotted.get('[role="tooltip"]').text()).toBe('MO|Tratamiento pulpar')
  })

  it('shows no summary for teeth without surface findings', async () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true, findings } })

    await wrapper.get('[data-tooth-id="26"]').trigger('mouseenter')
    expect(wrapper.get('[role="tooltip"]').text()).not.toContain('Surfaces:')
  })
})

describe.each(['square', 'circle'] as const)('surface letters of %s diagrams', (shape) => {
  it.each(['16', '21', '36', '44', '55', '73'])('line up on %s: V, O and L in one column, M, O and D in one row', (toothId) => {
    const diagram = buildSurfaceDiagram(toothId, { x: 50, y: 50 }, getSurfaceAxes(toothId), 84, 1.2, shape)
    const at = (name: string) => surfaceCenter(diagram.surfaces.find(({ surface }) => surface === name)!)
    const [vestibular, lingual, mesial, distal, occlusal] = ['vestibular', 'lingual', 'mesial', 'distal', 'occlusal'].map(at)

    expect(occlusal.x).toBeCloseTo(50, 9)
    expect(occlusal.y).toBeCloseTo(50, 9)
    expect(vestibular.x).toBeCloseTo(50, 9)
    expect(lingual.x).toBeCloseTo(50, 9)
    expect(mesial.y).toBeCloseTo(50, 9)
    expect(distal.y).toBeCloseTo(50, 9)
    // Opposite letters sit at the same distance from the center.
    expect(Math.abs(vestibular.y - 50)).toBeCloseTo(Math.abs(lingual.y - 50), 9)
    expect(Math.abs(mesial.x - 50)).toBeCloseTo(Math.abs(distal.x - 50), 9)
  })
})

describe('square surface diagrams', () => {
  const square = buildSurfaceDiagram('16', { x: 50, y: 50 }, getSurfaceAxes('16'), 40, 1, 'square')
  const points = square.surfaces.flatMap((shape) => shape.points)

  it('keeps the full square size', () => {
    expect(square.box).toEqual({ x: 29.5, y: 29.5, width: 41, height: 41 })
  })

  it('rounds the outer corners', () => {
    // No point reaches a sharp corner of the 40 × 40 square.
    for (const { x, y } of points) {
      expect(Math.abs(x - 50) + Math.abs(y - 50)).toBeLessThan(40 - 1)
    }
  })

  it('rounds the occlusal square and keeps it inside the diagram', () => {
    const occlusal = square.surfaces.find(({ surface }) => surface === 'occlusal')!.points
    const half = Math.max(...occlusal.map(({ x }) => Math.abs(x - 50)))

    expect(half).toBeCloseTo(20 * 0.4, 5)
    expect(occlusal.some(({ x, y }) => Math.abs(x - 50) === half && Math.abs(y - 50) === half)).toBe(false)
  })
})

describe('circular surface diagrams', () => {
  const axes = getSurfaceAxes('16')
  const circle = buildSurfaceDiagram('16', { x: 50, y: 50 }, axes, 40, 1, 'circle')
  const square = buildSurfaceDiagram('16', { x: 50, y: 50 }, axes, 40, 1, 'square')
  const shape = (name: string) => circle.surfaces.find(({ surface }) => surface === name)!

  it('exports the shape kinds', () => {
    expect(publicApi.surfaceShapeKinds).toEqual(['square', 'circle'])
  })

  it('keeps every point inside a circle of the diagram size', () => {
    for (const { points } of circle.surfaces) {
      for (const { x, y } of points) {
        expect(Math.hypot(x - 50, y - 50)).toBeLessThanOrEqual(20 + 1e-9)
      }
    }
    expect(circle.box.width).toBeCloseTo(square.box.width, 5)
  })

  it('draws a central occlusal circle and four ring sectors on the same axes', () => {
    const radii = shape('occlusal').points.map(({ x, y }) => Math.hypot(x - 50, y - 50))
    expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(1e-9)
    expect(radii[0]).toBeCloseTo(20 * 0.45, 5)

    // Upper-right tooth: vestibular up, mesial to the right, like the square diagram.
    expect(surfaceCenter(shape('vestibular')).y).toBeLessThan(40)
    expect(surfaceCenter(shape('lingual')).y).toBeGreaterThan(60)
    expect(surfaceCenter(shape('mesial')).x).toBeGreaterThan(60)
    expect(surfaceCenter(shape('distal')).x).toBeLessThan(40)
  })

  it('keeps the chart positions and splits shared surfaces into strips', () => {
    const frames = getToothFrames(getToothAnchors('permanent', 'arch'), getLayoutViewBox('permanent', 'arch'), 'arch')
    const squares = getSurfaceDiagrams(frames, { fairCurve: true })
    const circles = getSurfaceDiagrams(frames, { fairCurve: true, shape: 'circle' })

    expect(circles.diagrams.map(({ center }) => center)).toEqual(squares.diagrams.map(({ center }) => center))
    expect(circles.reserved).toBe(squares.reserved)

    const wrapper = mount(Odontogram, {
      props: {
        showSurfaces: true,
        surfaceShape: 'circle',
        findings: [
          { code: 'caries', teeth: ['16'], surfaces: ['vestibular'] },
          { code: 'restoration', teeth: ['16'], surfaces: ['vestibular'] },
        ],
      },
    })
    const [first, second] = wrapper.findAll('.odontogram__findings .odontogram-finding__area').map((area) => getPathBox(area.attributes('d')!))
    const whole = getPathBox(wrapper.get(surface('16', 'vestibular')).attributes('d')!)

    for (const strip of [first, second]) {
      expect(strip.x).toBeGreaterThanOrEqual(whole.x - 0.02)
      expect(strip.y).toBeGreaterThanOrEqual(whole.y - 0.02)
      expect(strip.x + strip.width).toBeLessThanOrEqual(whole.x + whole.width + 0.02)
      expect(strip.y + strip.height).toBeLessThanOrEqual(whole.y + whole.height + 0.02)
    }
    expect(first).not.toEqual(second)
  })

  it('draws the guide with the same shape', () => {
    const wrapper = mount(SurfaceGuide, { props: { toothId: '16', shape: 'circle' } })
    const occlusal = getPathBox(wrapper.get('[data-guide-surface="occlusal"]').attributes('d')!)

    expect(occlusal.width).toBeCloseTo(occlusal.height, 1)
    expect(wrapper.get('[data-guide-surface="occlusal"]').attributes('d')!.split('L').length).toBe(48)
  })
})
