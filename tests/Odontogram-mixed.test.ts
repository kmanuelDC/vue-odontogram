// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import { ntsPeruFindingCatalog } from '../src/catalogs/nts-peru'
import { getLayoutViewBox, getToothAnchors, type ToothAnchor } from '../src/utils/anchors'
import { layoutFindings } from '../src/utils/findings'
import type { OdontogramLayout } from '../src/utils/layout'
import { findNavigationTarget } from '../src/utils/navigation'
import { getToothNumberLabels } from '../src/utils/numbers'
import { getSurfaceDiagrams } from '../src/utils/surfaces'
import type { Box } from '../src/utils/svg-geometry'
import { getToothFrames } from '../src/utils/tooth-frames'

afterEach(() => {
  vi.restoreAllMocks()
})

const layouts: OdontogramLayout[] = ['arch', 'horizontal']

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

function anchorMap(layout: OdontogramLayout): Map<string, ToothAnchor> {
  return new Map(getToothAnchors('mixed', layout).map((anchor) => [anchor.toothId, anchor]))
}

describe.each(layouts)('mixed composition (%s)', (layout) => {
  const anchors = getToothAnchors('mixed', layout)
  const chart = getLayoutViewBox('mixed', layout)

  it('draws the 32 permanent and 20 primary teeth with their FDI IDs', () => {
    const ids = anchors.map(({ toothId }) => toothId)

    expect(ids).toHaveLength(52)
    expect(new Set(ids).size).toBe(52)
    expect(anchors.filter(({ dentition }) => dentition === 'primary').map(({ toothId }) => toothId)).toEqual(
      expect.arrayContaining(['51', '55', '65', '75', '85']),
    )
    expect(new Set(anchors.map(({ row }) => row))).toEqual(
      new Set(['upper-permanent', 'lower-permanent', 'upper-primary', 'lower-primary']),
    )
  })

  it('keeps every tooth inside the viewBox and apart from the others', () => {
    for (const { toothId, box } of anchors) {
      expect(box.x, toothId).toBeGreaterThanOrEqual(chart.x)
      expect(box.y, toothId).toBeGreaterThanOrEqual(chart.y)
      expect(box.x + box.width, toothId).toBeLessThanOrEqual(chart.x + chart.width)
      expect(box.y + box.height, toothId).toBeLessThanOrEqual(chart.y + chart.height)
    }

    const permanent = anchors.filter(({ dentition }) => dentition === 'permanent')
    for (const primary of anchors.filter(({ dentition }) => dentition === 'primary')) {
      for (const other of permanent) {
        expect(overlaps(primary.box, other.box), `${primary.toothId}/${other.toothId}`).toBe(false)
      }
    }
  })

  it('draws the primary teeth between the permanent arches', () => {
    const byId = anchorMap(layout)
    const y = (id: string) => byId.get(id)!.center.y

    expect(y('11')).toBeLessThan(y('51'))
    expect(y('51')).toBeLessThan(y('81'))
    expect(y('81')).toBeLessThan(y('41'))
  })

  it('places numbers without overlapping each other or any tooth', () => {
    const labels = getToothNumberLabels(anchors, chart, layout)

    for (const [index, label] of labels.entries()) {
      for (const other of labels.slice(index + 1)) {
        expect(overlaps(label.box, other.box), `${label.toothId}/${other.toothId}`).toBe(false)
      }
      for (const anchor of anchors) {
        expect(overlaps(label.box, anchor.box), `${label.toothId}/${anchor.toothId}`).toBe(false)
      }
    }
  })

  it('moves up and down through the four rows', () => {
    const byId = anchorMap(layout)
    const down = (id: string) => findNavigationTarget(anchors, id, 'ArrowDown')
    const row = (id: string | undefined) => byId.get(id!)!.row

    expect(row(down('11'))).toBe('upper-primary')
    expect(row(down('51'))).toBe('lower-primary')
    expect(row(down('81'))).toBe('lower-permanent')
    expect(down('41')).toBeUndefined()
    expect(row(findNavigationTarget(anchors, '51', 'ArrowUp'))).toBe('upper-permanent')
    expect(findNavigationTarget(anchors, '51', 'ArrowRight')).toBe('61')
  })
})

describe('mixed horizontal alignment', () => {
  it('puts each primary molar under the premolar that replaces it', () => {
    const byId = anchorMap('horizontal')
    const x = (id: string) => byId.get(id)!.center.x

    for (const [primary, permanent] of [['55', '15'], ['65', '25'], ['85', '45'], ['75', '35'], ['51', '11']]) {
      expect(Math.abs(x(primary) - x(permanent)), primary).toBeLessThan(6)
    }
  })
})

describe('mixed horizontal with surfaces', () => {
  it('keeps abbreviations of the primary rows clear of the permanent numbers', () => {
    const anchors = getToothAnchors('mixed', 'horizontal')
    const chart = getLayoutViewBox('mixed', 'horizontal')
    const frames = getToothFrames(anchors, chart, 'horizontal')
    const numbers = getToothNumberLabels(anchors, chart, 'horizontal')
    const { findings } = layoutFindings(
      ['51', '55', '61', '65', '71', '75', '81', '85'].map((toothId) => ({ code: 'root-remnant', teeth: [toothId] })),
      ntsPeruFindingCatalog,
      frames,
      getSurfaceDiagrams(frames),
    )

    for (const finding of findings) {
      for (const label of numbers) {
        expect(overlaps(finding.box, label.box), `${finding.teeth[0]}/${label.toothId}`).toBe(false)
      }
    }
  })
})

describe('mixed findings', () => {
  it('keeps spans within one row', () => {
    const anchors = getToothAnchors('mixed', 'horizontal')
    const frames = getToothFrames(anchors, getLayoutViewBox('mixed', 'horizontal'), 'horizontal')
    const { findings, issues } = layoutFindings(
      [
        { code: 'fixed-prosthesis', teeth: ['55', '16'] },
        { code: 'fixed-orthodontic-appliance', teeth: ['53', '63'] },
      ],
      ntsPeruFindingCatalog,
      frames,
    )

    expect(issues).toEqual(['Finding "fixed-prosthesis" needs at least two teeth of the same arch and dentition.'])
    expect(findings[0].teeth).toEqual(['53', '52', '51', '61', '62', '63'])
  })
})

describe('mixed dentition in the component', () => {
  it('renders both sets by default and keeps FDI selection', async () => {
    const wrapper = mount(Odontogram, { props: { dentition: 'mixed' } })

    expect(wrapper.findAll('[data-tooth-id]')).toHaveLength(52)
    expect(wrapper.get('svg').attributes('aria-label')).toBe('mixed odontogram')

    await wrapper.get('[data-tooth-id="54"]').trigger('click')
    await wrapper.setProps({ modelValue: ['54'] })
    await wrapper.get('[data-tooth-id="14"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['54']], [['54', '14']]])
  })

  it('draws only the teeth listed in `teeth`', () => {
    const teeth = ['16', '11', '21', '26', '55', '54', '53', '63', '64', '65']
    const wrapper = mount(Odontogram, { props: { dentition: 'mixed', layout: 'horizontal', teeth } })

    expect(wrapper.findAll('[data-tooth-id]').map((tooth) => tooth.attributes('data-tooth-id')).sort()).toEqual(
      [...teeth].sort(),
    )
  })

  it('also filters permanent and primary charts, and warns about unknown teeth', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mount(Odontogram, { props: { dentition: 'permanent', teeth: ['11', '21', '51'] } })

    expect(wrapper.findAll('[data-tooth-id]')).toHaveLength(2)
    expect(warning).toHaveBeenCalledWith('[vue-odontogram] Teeth 51 are not part of the permanent dentition.')
  })

  it('works with states, findings, surfaces, notation and half charts', () => {
    const wrapper = mount(Odontogram, {
      props: {
        dentition: 'mixed',
        layout: 'horizontal',
        showHalf: 'upper',
        showSurfaces: true,
        showNumbers: true,
        notation: 'Universal',
        toothStates: { 55: 'extracted' },
        findings: [{ code: 'caries', teeth: ['54', '16'], surfaces: ['occlusal'] }],
      },
    })

    expect(wrapper.findAll('[data-tooth-id]')).toHaveLength(26)
    expect(wrapper.get('[data-tooth-id="55"]').attributes('aria-label')).toBe('Tooth A, Extracted')
    expect(wrapper.get('[data-tooth-id="16"]').attributes('aria-label')).toContain('Tooth 3')
    expect(wrapper.findAll('.odontogram__findings .odontogram-finding__area')).toHaveLength(2)
  })
})
