// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import { getLayoutViewBox, getToothAnchors } from '../src/utils/anchors'
import { layoutFindings } from '../src/utils/findings'
import { ntsPeruFindingCatalog } from '../src/catalogs/nts-peru'
import { getSurfaceDiagrams, getSurfaceName, toggleSurface } from '../src/utils/surfaces'
import { getToothFrames } from '../src/utils/tooth-frames'
import { toothSurfaces } from '../src/types/surfaces'
import type { OdontogramLayout } from '../src/utils/layout'
import type { RenderableDentition } from '../src/utils/dentition-layout'
import type { Box } from '../src/utils/svg-geometry'

const combinations: [RenderableDentition, OdontogramLayout][] = [
  ['permanent', 'arch'],
  ['permanent', 'horizontal'],
  ['primary', 'arch'],
  ['primary', 'horizontal'],
]

function framesOf(dentition: RenderableDentition, layout: OdontogramLayout) {
  return getToothFrames(getToothAnchors(dentition, layout), getLayoutViewBox(dentition, layout), layout)
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/** Centroid of a closed polygon path made of M/L commands. */
function centroid(d: string) {
  const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const xs = numbers.filter((_, index) => index % 2 === 0)
  const ys = numbers.filter((_, index) => index % 2 === 1)
  return { x: xs.reduce((a, b) => a + b) / xs.length, y: ys.reduce((a, b) => a + b) / ys.length }
}

describe('getSurfaceName', () => {
  it('uses incisal on incisors and canines and palatal on upper teeth', () => {
    expect(getSurfaceName('occlusal', '11')).toBe('incisal')
    expect(getSurfaceName('occlusal', '53')).toBe('incisal')
    expect(getSurfaceName('occlusal', '14')).toBe('occlusal')
    expect(getSurfaceName('lingual', '26')).toBe('palatal')
    expect(getSurfaceName('lingual', '64')).toBe('palatal')
    expect(getSurfaceName('lingual', '36')).toBe('lingual')
    expect(getSurfaceName('mesial', '11')).toBe('mesial')
  })
})

describe('toggleSurface', () => {
  it('adds surfaces in canonical order without mutating the model', () => {
    const model = { 11: ['occlusal' as const] }
    const next = toggleSurface(model, '11', 'vestibular')

    expect(next).toEqual({ 11: ['vestibular', 'occlusal'] })
    expect(model).toEqual({ 11: ['occlusal'] })
  })

  it('removes a tooth when its last surface is cleared', () => {
    expect(toggleSurface({ 11: ['mesial'], 21: ['distal'] }, '11', 'mesial')).toEqual({ 21: ['distal'] })
    expect(toggleSurface(undefined, '46', 'lingual')).toEqual({ 46: ['lingual'] })
  })
})

describe.each(combinations)('getSurfaceDiagrams (%s, %s)', (dentition, layout) => {
  const frames = framesOf(dentition, layout)
  const { diagrams, reserved } = getSurfaceDiagrams(frames)

  it('draws five surfaces per tooth, all the same size', () => {
    expect(diagrams).toHaveLength(frames.frames.size)
    expect(new Set(diagrams.map(({ size }) => size)).size).toBe(1)
    expect(reserved).toBeGreaterThan(diagrams[0].size)
    for (const diagram of diagrams) {
      expect(diagram.surfaces.map(({ surface }) => surface)).toEqual(toothSurfaces)
    }
  })

  it('places each diagram outside its tooth and every other diagram', () => {
    const anchors = getToothAnchors(dentition, layout)

    for (const diagram of diagrams) {
      const own = anchors.find(({ toothId }) => toothId === diagram.toothId)!
      const inside =
        diagram.center.x > own.box.x &&
        diagram.center.x < own.box.x + own.box.width &&
        diagram.center.y > own.box.y &&
        diagram.center.y < own.box.y + own.box.height
      expect(inside, diagram.toothId).toBe(false)
    }

    // Diagram boxes are axis-aligned bounds of rotated squares, so compare
    // centers against the side of the square instead of the boxes.
    for (const [index, a] of diagrams.entries()) {
      for (const b of diagrams.slice(index + 1)) {
        const distance = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y)
        expect(distance, `${a.toothId}/${b.toothId}`).toBeGreaterThan(a.size)
      }
    }
  })

  it('points the vestibular side out and the mesial side to the midline', () => {
    for (const diagram of diagrams) {
      const frame = frames.frames.get(diagram.toothId)!
      const surface = (name: string) => centroid(diagram.surfaces.find((s) => s.surface === name)!.d)
      const along = (p: { x: number; y: number }, direction: { x: number; y: number }) =>
        (p.x - diagram.center.x) * direction.x + (p.y - diagram.center.y) * direction.y

      expect(along(surface('vestibular'), frame.outer)).toBeGreaterThan(0)
      expect(along(surface('lingual'), frame.outer)).toBeLessThan(0)
      expect(along(surface('mesial'), frame.mesial)).toBeGreaterThan(0)
      expect(along(surface('distal'), frame.mesial)).toBeLessThan(0)
    }
  })
})

describe('findings with surface diagrams', () => {
  it('moves vestibular abbreviations past the diagram', () => {
    const frames = framesOf('permanent', 'horizontal')
    const surfaceLayout = getSurfaceDiagrams(frames)
    const findings = [{ code: 'pulp-treatment', teeth: ['16'] }]
    const [finding] = layoutFindings(findings, ntsPeruFindingCatalog, frames, surfaceLayout).findings
    const diagrams = surfaceLayout.diagrams
    const diagram = diagrams.find(({ toothId }) => toothId === '16')!

    expect(overlaps(finding.box, diagram.box)).toBe(false)
  })
})

const mounted: { unmount(): void }[] = []

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe('Odontogram surfaces', () => {
  it('does not render diagrams by default', () => {
    const wrapper = mount(Odontogram)

    expect(wrapper.find('.odontogram__surfaces').exists()).toBe(false)
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 409 694')
  })

  it('renders one diagram per visible tooth and grows the viewBox', () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true, showHalf: 'upper' } })

    expect(wrapper.findAll('[data-surfaces-for]')).toHaveLength(16)
    expect(wrapper.findAll('[role="checkbox"]')).toHaveLength(80)
    expect(wrapper.get('svg').attributes('viewBox')).not.toBe('0 0 409 694')
  })

  it('names surfaces clinically and reflects the model', () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, surfaces: { 11: ['occlusal'] }, labels: { tooth: 'Pieza' } },
    })
    const incisal = wrapper.get('[aria-label="Pieza 11, Incisal"]')

    expect(incisal.attributes('aria-checked')).toBe('true')
    expect(incisal.classes()).toContain('odontogram-surface--selected')
    expect(wrapper.get('[aria-label="Pieza 11, Palatal"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.find('[aria-label="Pieza 36, Lingual"]').exists()).toBe(true)
  })

  it('emits update:surfaces and surface-click without touching tooth selection', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, surfaces: { 11: ['occlusal'] }, modelValue: ['21'] },
    })

    await wrapper.get('[data-surface-tooth="11"][data-surface="mesial"]').trigger('click')

    expect(wrapper.emitted('update:surfaces')).toEqual([[{ 11: ['mesial', 'occlusal'] }]])
    const [tooth, surface, surfaces] = wrapper.emitted('surface-click')![0] as [{ id: string }, string, unknown]
    expect(tooth.id).toBe('11')
    expect(surface).toBe('mesial')
    expect(surfaces).toEqual({ 11: ['mesial', 'occlusal'] })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('ignores clicks when disabled or on missing and extracted teeth', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, toothStates: { 16: 'extracted', 26: 'implant' } },
    })

    await wrapper.get('[data-surface-tooth="16"][data-surface="occlusal"]').trigger('click')
    expect(wrapper.emitted('update:surfaces')).toBeUndefined()
    expect(wrapper.get('[data-surfaces-for="16"]').classes()).toContain('odontogram-surfaces--inactive')

    await wrapper.get('[data-surface-tooth="26"][data-surface="occlusal"]').trigger('click')
    expect(wrapper.emitted('update:surfaces')).toHaveLength(1)

    await wrapper.setProps({ disabled: true })
    await wrapper.get('[data-surface-tooth="26"][data-surface="mesial"]').trigger('click')
    expect(wrapper.emitted('update:surfaces')).toHaveLength(1)
  })

  it('keeps a single tab stop and navigates with the keyboard', async () => {
    const wrapper = mount(Odontogram, {
      props: { showSurfaces: true, surfaces: { 21: ['distal'] } },
      attachTo: document.body,
    })
    mounted.push(wrapper)
    const tabStops = () => wrapper.findAll('.odontogram-surface[tabindex="0"]')

    expect(tabStops()).toHaveLength(1)
    expect(tabStops()[0].attributes('data-surface-tooth')).toBe('21')
    expect(tabStops()[0].attributes('data-surface')).toBe('distal')

    await tabStops()[0].trigger('keydown', { key: 'ArrowDown' })
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('data-surface')).toBe('lingual'))

    await wrapper.get('[data-surface-tooth="21"][data-surface="lingual"]').trigger('keydown', { key: 'ArrowLeft' })
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('data-surface-tooth')).toBe('11'))
    expect(document.activeElement?.getAttribute('data-surface')).toBe('lingual')

    await wrapper.get('[data-surface-tooth="11"][data-surface="lingual"]').trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:surfaces')).toEqual([[{ 11: ['lingual'], 21: ['distal'] }]])
    expect(tabStops()).toHaveLength(1)
  })
})
