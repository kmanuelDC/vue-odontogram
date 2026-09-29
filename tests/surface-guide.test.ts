// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Odontogram from '../src/components/Odontogram.vue'
import SurfaceGuide from '../src/components/SurfaceGuide.vue'
import * as publicApi from '../src'
import type { OdontogramFinding } from '../src/types/findings'
import { getSurfaceAxes } from '../src/utils/surfaces'
import { getPathBox } from '../src/utils/svg-geometry'

function guide(props: Record<string, unknown>) {
  return mount(SurfaceGuide, { props: { toothId: '16', ...props } })
}

/** Center of a surface polygon of the guide, in its 0 0 100 100 viewBox. */
function surfaceCenterOf(wrapper: ReturnType<typeof guide>, surface: string) {
  const { x, y, width, height } = getPathBox(wrapper.get(`[data-guide-surface="${surface}"]`).attributes('d')!)
  return { x: x + width / 2, y: y + height / 2 }
}

describe('getSurfaceAxes', () => {
  it.each([
    ['16', -1, 1],
    ['21', -1, -1],
    ['36', 1, -1],
    ['44', 1, 1],
    ['55', -1, 1],
    ['74', 1, -1],
  ])('orients %s like the horizontal chart', (toothId, vestibularY, mesialX) => {
    expect(getSurfaceAxes(toothId)).toEqual({
      vestibular: { x: 0, y: vestibularY },
      mesial: { x: mesialX, y: 0 },
    })
  })
})

describe('SurfaceGuide', () => {
  it('is exported from the library entry point', () => {
    expect(publicApi.SurfaceGuide).toBe(SurfaceGuide)
  })

  it('draws the five surfaces with the vestibular side out and mesial toward the midline', () => {
    for (const [toothId, vestibularUp, mesialRight] of [
      ['16', true, true],
      ['26', true, false],
      ['36', false, false],
      ['46', false, true],
    ] as const) {
      const wrapper = guide({ toothId })
      const center = surfaceCenterOf(wrapper, 'occlusal')

      expect(wrapper.findAll('[data-guide-surface]')).toHaveLength(5)
      expect(surfaceCenterOf(wrapper, 'vestibular').y < center.y, toothId).toBe(vestibularUp)
      expect(surfaceCenterOf(wrapper, 'mesial').x > center.x, toothId).toBe(mesialRight)
    }
  })

  it('adapts letters, names and descriptions to the tooth', () => {
    const incisor = guide({ toothId: '11' })
    const letters = incisor.findAll('.odontogram-surface-guide__letter').map((letter) => letter.text())

    expect(letters).toEqual(['V', 'M', 'I', 'D', 'P'])
    expect(incisor.get('[data-guide-item="occlusal"]').text()).toContain('Incisal')
    expect(incisor.get('[data-guide-item="occlusal"]').text()).toContain('Cutting edge of incisors and canines.')
    expect(incisor.get('[data-guide-item="lingual"]').text()).toContain('Palatal')

    const molar = guide({ toothId: '36' })
    expect(molar.findAll('.odontogram-surface-guide__letter').map((letter) => letter.text())).toEqual([
      'V', 'M', 'O', 'D', 'L',
    ])
    expect(molar.get('[data-guide-item="lingual"]').text()).toContain('Faces the tongue')
  })

  it('translates through labels and shows the number in the chosen notation', () => {
    const wrapper = guide({
      toothId: '11',
      notation: 'Palmer',
      labels: {
        tooth: 'Pieza',
        surfaceGuide: 'Guía de superficies',
        surfaceNames: { palatal: 'Palatina' },
        surfaceDescriptions: { palatal: 'Cara que mira hacia el paladar.' },
      },
    })

    expect(wrapper.get('.odontogram-surface-guide__title').text()).toBe('Pieza 1┘')
    expect(wrapper.get('section').attributes('aria-label')).toBe('Guía de superficies, Pieza UR1')
    expect(wrapper.get('[data-guide-item="lingual"]').text()).toContain('PalatinaCara que mira hacia el paladar.')
  })

  it('draws and lists the surface findings of its tooth only', () => {
    const findings: OdontogramFinding[] = [
      { code: 'caries', teeth: ['36', '46'], surfaces: ['occlusal'] },
      { code: 'restoration', teeth: ['36'], surfaces: ['occlusal', 'mesial'], status: 'planned' },
      { code: 'temporary-restoration', teeth: ['37'] },
      { code: 'crown', teeth: ['36'] },
    ]
    const wrapper = guide({ toothId: '36', findings })
    const areas = wrapper.findAll('.odontogram-finding__area')

    // Caries and restoration split the occlusal surface; the mesial is whole.
    expect(areas).toHaveLength(3)
    expect(wrapper.findAll('[data-finding="restoration"]')[0].classes()).toContain('odontogram-finding--planned')
    expect(wrapper.find('[data-finding="crown"]').exists()).toBe(false)
    expect(wrapper.get('[data-guide-item="occlusal"]').text()).toContain(
      'Findings: Lesión de caries dental, Restauración definitiva (Planned)',
    )
    expect(wrapper.get('[data-guide-item="distal"]').text()).not.toContain('Findings')
  })

  it('highlights a surface from the list or the diagram and reports it', async () => {
    const wrapper = guide({})

    expect(wrapper.find('.odontogram-surface-guide__highlight').exists()).toBe(false)

    await wrapper.get('[data-guide-item="distal"]').trigger('focus')
    expect(wrapper.get('.odontogram-surface-guide__highlight').attributes('data-highlight')).toBe('distal')
    expect(wrapper.get('[data-guide-item="distal"]').classes()).toContain('odontogram-surface-guide__item--active')

    await wrapper.get('[data-guide-surface="vestibular"]').trigger('mouseenter')
    expect(wrapper.get('.odontogram-surface-guide__highlight').attributes('data-highlight')).toBe('vestibular')

    await wrapper.get('svg').trigger('mouseleave')
    expect(wrapper.find('.odontogram-surface-guide__highlight').exists()).toBe(false)
    expect(wrapper.emitted('update:active')).toEqual([['distal'], ['vestibular'], [undefined]])
  })

  it('follows an active surface set from outside', () => {
    const wrapper = guide({ active: 'mesial' })
    expect(wrapper.get('.odontogram-surface-guide__highlight').attributes('data-highlight')).toBe('mesial')
  })

  it('emits surface clicks and shows the selected surfaces', async () => {
    const wrapper = guide({ selected: ['occlusal'] })

    expect(wrapper.get('[data-guide-item="occlusal"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-guide-surface="occlusal"]').classes()).toContain('odontogram-surface--selected')

    await wrapper.get('[data-guide-item="mesial"]').trigger('click')
    await wrapper.get('[data-guide-surface="distal"]').trigger('click')
    expect(wrapper.emitted('surface-click')).toEqual([['mesial'], ['distal']])

    await wrapper.setProps({ disabled: true })
    await wrapper.get('[data-guide-surface="lingual"]').trigger('click')
    expect(wrapper.emitted('surface-click')).toHaveLength(2)
  })
})

describe('showSurfaceLetters', () => {
  it('draws no letters by default', () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true } })
    expect(wrapper.find('.odontogram__surface-letters').exists()).toBe(false)
  })

  it('draws the adapted letter of every surface above the findings', () => {
    const wrapper = mount(Odontogram, {
      props: {
        showSurfaces: true,
        showSurfaceLetters: true,
        findings: [{ code: 'caries', teeth: ['11'], surfaces: ['occlusal'] }],
      },
    })
    const letter = (key: string) => wrapper.get(`[data-letter-for="${key}"]`).text()
    const layers = [...wrapper.get('svg').element.children].map((child) => child.getAttribute('class'))

    expect(wrapper.findAll('.odontogram__surface-letter')).toHaveLength(32 * 5)
    expect(letter('11:occlusal')).toBe('I')
    expect(letter('11:lingual')).toBe('P')
    expect(letter('36:occlusal')).toBe('O')
    expect(letter('36:lingual')).toBe('L')
    expect(layers.indexOf('odontogram__surface-letters')).toBeGreaterThan(layers.indexOf('odontogram__findings'))
  })

  it('needs the surface diagrams', () => {
    const wrapper = mount(Odontogram, { props: { showSurfaceLetters: true } })
    expect(wrapper.find('.odontogram__surface-letters').exists()).toBe(false)
  })
})
