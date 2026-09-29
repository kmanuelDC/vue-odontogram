// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ToothInspector from '../src/components/ToothInspector.vue'
import * as publicApi from '../src'
import type { OdontogramFinding } from '../src/types/findings'
import { addFinding, removeSurfaceFinding } from '../src/utils/finding-records'
import { getToothType } from '../src/utils/notation'

const findings: OdontogramFinding[] = [
  { code: 'caries', teeth: ['36'], surfaces: ['mesial'] },
  { code: 'restoration', teeth: ['36'], surfaces: ['occlusal'], status: 'planned' },
  { code: 'pulp-treatment', teeth: ['36'] },
  { code: 'fixed-prosthesis', teeth: ['35', '37'] },
]

function inspector(props: Record<string, unknown> = {}) {
  return mount(ToothInspector, { props: { toothId: '36', findings, ...props } })
}

describe('getToothType', () => {
  it.each([
    ['11', 'Central Incisor'],
    ['23', 'Canine'],
    ['36', 'First Molar'],
    ['48', 'Third Molar'],
    ['53', 'Primary Canine'],
    ['85', 'Primary Second Molar'],
  ])('%s is a %s', (toothId, type) => {
    expect(getToothType(toothId)).toBe(type)
  })
})

describe('addFinding', () => {
  it('merges surface findings and appends whole-tooth ones', () => {
    const withCaries = addFinding(findings, { code: 'caries', toothId: '36', surfaces: ['distal'] })
    expect(withCaries[0]).toEqual({ code: 'caries', teeth: ['36'], surfaces: ['mesial', 'distal'] })

    const withCrown = addFinding(findings, { code: 'crown', toothId: '36', status: 'planned', surfaces: ['mesial'] })
    expect(withCrown.at(-1)).toEqual({ code: 'crown', teeth: ['36'], status: 'planned' })
  })
})

describe('ToothInspector', () => {
  it('is exported with its helpers', () => {
    expect(publicApi.ToothInspector).toBe(ToothInspector)
    expect(publicApi.addFinding).toBe(addFinding)
    expect(publicApi.getToothType).toBe(getToothType)
  })

  it('shows the tooth, its type, its state and the diagram without the text list', () => {
    const wrapper = inspector({ toothStates: { 36: 'implant' }, notation: 'Universal' })

    expect(wrapper.get('.odontogram-inspector__title').text()).toBe('Tooth 19')
    expect(wrapper.get('.odontogram-inspector__type').text()).toBe('First Molar')
    expect(wrapper.get('.odontogram-inspector__state').text()).toBe('Implant')
    expect(wrapper.get('section').attributes('aria-label')).toBe('Tooth details, Tooth 19')
    expect(wrapper.findAll('[data-guide-surface]')).toHaveLength(5)
    expect(wrapper.find('.odontogram-surface-guide__list').exists()).toBe(false)
    expect(wrapper.findAll('.odontogram-surface-guide .odontogram-finding__area')).toHaveLength(2)
  })

  it('lists findings by surface and on the whole tooth', () => {
    const wrapper = inspector()
    const surfaces = wrapper.findAll('[data-inspector-surface]')

    expect(surfaces.map((row) => row.attributes('data-inspector-surface'))).toEqual(['mesial', 'occlusal'])
    expect(surfaces[0].text()).toContain('Lesión de caries dental')
    expect(surfaces[1].text()).toContain('Restauración definitiva (Planned)')

    const tooth = wrapper.findAll('[data-inspector-tooth-finding]').map((row) => row.text())
    expect(tooth).toEqual([expect.stringContaining('Tratamiento pulpar'), expect.stringContaining('Prótesis fija')])
  })

  it('emits removals ready for removeSurfaceFinding, and only for its own findings', async () => {
    const wrapper = inspector()

    await wrapper.get('[data-inspector-surface="mesial"] .odontogram-inspector__remove').trigger('click')
    await wrapper.findAll('[data-inspector-tooth-finding] .odontogram-inspector__remove')[0].trigger('click')

    const removals = wrapper.emitted('remove-finding')!.map(([removal]) => removal)
    expect(removals).toEqual([
      { index: 0, toothId: '36', surface: 'mesial' },
      { index: 2, toothId: '36' },
    ])
    expect(removeSurfaceFinding(findings, removals[0] as never)).toHaveLength(3)

    // The prosthesis spans 35–37: it is shown but removed from its own teeth.
    const prosthesis = wrapper.findAll('[data-inspector-tooth-finding]')[1]
    expect(prosthesis.find('.odontogram-inspector__remove').exists()).toBe(false)
  })

  it('adds a surface finding on the surfaces chosen on the diagram', async () => {
    const wrapper = inspector({ labels: { surfaceNames: { distal: 'Distal' } } })
    const add = wrapper.get('.odontogram-inspector__add')

    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Choose the surfaces on the diagram.')
    expect(add.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-guide-surface="distal"]').trigger('click')
    await wrapper.get('[data-guide-surface="vestibular"]').trigger('click')
    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Vestibular, Distal')
    expect(wrapper.get('[data-guide-surface="distal"]').classes()).toContain('odontogram-surface--selected')

    await wrapper.get('input[value="planned"]').setValue()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add-finding')).toEqual([
      [{ code: 'caries', toothId: '36', surfaces: ['vestibular', 'distal'], status: 'planned' }],
    ])
    // The choice is cleared after adding.
    expect(wrapper.get('.odontogram-inspector__add').attributes('disabled')).toBeDefined()
  })

  it('adds a whole-tooth finding without surfaces', async () => {
    const wrapper = inspector()

    await wrapper.get('select').setValue('crown')
    expect(wrapper.find('[data-inspector-chosen]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add-finding')).toEqual([[{ code: 'crown', toothId: '36' }]])
  })

  it('offers surface and whole-tooth codes, not spans', () => {
    const wrapper = inspector()
    const groups = wrapper.findAll('optgroup')

    expect(groups.map((group) => group.attributes('label'))).toEqual(['On surfaces', 'On the whole tooth'])
    expect(groups[0].findAll('option').map((option) => option.attributes('value'))).toEqual([
      'caries',
      'restoration',
      'temporary-restoration',
    ])
    expect(wrapper.find('option[value="fixed-prosthesis"]').exists()).toBe(false)
  })

  it('does not record surfaces on missing or extracted teeth', async () => {
    const wrapper = inspector({ toothStates: { 36: 'extracted' } })

    await wrapper.get('[data-guide-surface="distal"]').trigger('click')
    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Choose the surfaces on the diagram.')
    expect(wrapper.get('.odontogram-inspector__add').attributes('disabled')).toBeDefined()
  })

  it('lets the app control the chosen surfaces (v-model:selected-surfaces)', async () => {
    const wrapper = inspector({ selectedSurfaces: ['occlusal'] })

    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Occlusal')
    expect(wrapper.get('[data-guide-surface="occlusal"]').classes()).toContain('odontogram-surface--selected')

    await wrapper.get('[data-guide-surface="mesial"]').trigger('click')
    expect(wrapper.emitted('update:selectedSurfaces')).toEqual([[['mesial', 'occlusal']]])
    // Controlled: it shows what the app passes, not its own choice.
    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Occlusal')

    // A new tooth keeps the app's choice (e.g. a surface just clicked on the chart).
    await wrapper.setProps({ toothId: '26', selectedSurfaces: ['distal'] })
    expect(wrapper.emitted('update:selectedSurfaces')).toHaveLength(1)
    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Distal')

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('add-finding')).toEqual([[{ code: 'caries', toothId: '26', surfaces: ['distal'] }]])
    expect(wrapper.emitted('update:selectedSurfaces')!.at(-1)).toEqual([[]])
  })

  it('is read-only when disabled and resets the choice when the tooth changes', async () => {
    const disabled = inspector({ disabled: true })
    expect(disabled.find('form').exists()).toBe(false)
    expect(disabled.find('.odontogram-inspector__remove').exists()).toBe(false)

    const wrapper = inspector()
    await wrapper.get('[data-guide-surface="distal"]').trigger('click')
    await wrapper.setProps({ toothId: '26' })
    expect(wrapper.get('[data-inspector-chosen]').text()).toBe('Choose the surfaces on the diagram.')
  })
})
