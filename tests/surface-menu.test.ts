// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import Odontogram from '../src/components/Odontogram.vue'
import type { OdontogramFinding } from '../src/types/findings'
import type { ToothSurface } from '../src/types/surfaces'
import { addSurfaceFinding, removeSurfaceFinding, type ToothRecord } from '../src/utils/finding-records'

const surface = (toothId: string, name: string) => `[data-surface-tooth="${toothId}"][data-surface="${name}"]`

const mounted: { unmount(): void }[] = []
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

/**
 * A chart whose surface menu lists the findings of the surface and records a
 * caries, like an app would.
 */
function mountWithMenu(initial: OdontogramFinding[] = [], props: Record<string, unknown> = {}) {
  const findings = ref<OdontogramFinding[]>(initial)
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          Odontogram,
          { showSurfaces: true, findings: findings.value, ...props },
          {
            'surface-menu': (menu: {
              toothId: string
              surface: ToothSurface
              surfaceName: string
              record: ToothRecord
              close: () => void
            }) =>
              h('div', { class: 'menu' }, [
                h('p', { class: 'title' }, `${menu.toothId} ${menu.surfaceName}`),
                ...menu.record.surfaces[menu.surface].map((entry) =>
                  h(
                    'button',
                    {
                      class: 'remove',
                      onClick: () => {
                        findings.value = removeSurfaceFinding(findings.value, {
                          index: entry.index,
                          toothId: menu.toothId,
                          surface: menu.surface,
                        })
                      },
                    },
                    entry.definition?.name ?? entry.finding.code,
                  ),
                ),
                h(
                  'button',
                  {
                    class: 'add',
                    onClick: () => {
                      findings.value = addSurfaceFinding(findings.value, {
                        code: 'caries',
                        toothId: menu.toothId,
                        surfaces: [menu.surface],
                      })
                    },
                  },
                  'Add caries',
                ),
                h('button', { class: 'close', onClick: menu.close }, 'Close'),
              ]),
          },
        )
    },
  })

  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  return { wrapper, findings }
}

describe('surface menu slot', () => {
  it('opens next to the clicked surface instead of toggling its selection', async () => {
    const { wrapper } = mountWithMenu([{ code: 'restoration', teeth: ['36'], surfaces: ['occlusal'] }])
    const chart = wrapper.findComponent(Odontogram)

    await wrapper.get(surface('36', 'occlusal')).trigger('click')
    await nextTick()

    const menu = wrapper.get('.odontogram-surface-menu')
    expect(menu.attributes('role')).toBe('dialog')
    expect(menu.attributes('aria-label')).toBe('Surface findings: Tooth 36, Occlusal')
    expect(menu.get('.title').text()).toBe('36 Occlusal')
    expect(menu.findAll('.remove').map((button) => button.text())).toEqual(['Restauración definitiva'])

    expect(chart.emitted('update:surfaces')).toBeUndefined()
    expect(chart.emitted('surface-click')?.[0]?.slice(1)).toEqual(['occlusal', {}])
  })

  it('marks surfaces as menu buttons', async () => {
    const { wrapper } = mountWithMenu()
    const occlusal = wrapper.get(surface('16', 'occlusal'))

    expect(occlusal.attributes('role')).toBe('button')
    expect(occlusal.attributes('aria-haspopup')).toBe('dialog')
    expect(occlusal.attributes('aria-checked')).toBeUndefined()
    expect(occlusal.attributes('aria-expanded')).toBe('false')

    await occlusal.trigger('click')
    expect(wrapper.get(surface('16', 'occlusal')).attributes('aria-expanded')).toBe('true')
  })

  it('shows the updated record while the app edits the findings', async () => {
    const { wrapper, findings } = mountWithMenu()

    await wrapper.get(surface('16', 'distal')).trigger('click')
    await wrapper.get('.menu .add').trigger('click')

    expect(findings.value).toEqual([{ code: 'caries', teeth: ['16'], surfaces: ['distal'] }])
    expect(wrapper.findAll('.menu .remove').map((button) => button.text())).toEqual(['Lesión de caries dental'])
    expect(wrapper.findAll('.odontogram__findings .odontogram-finding__area')).toHaveLength(1)

    await wrapper.get('.menu .remove').trigger('click')
    expect(findings.value).toEqual([])
    expect(wrapper.find('.menu .remove').exists()).toBe(false)
  })

  it('closes with close(), Escape or a click outside, and returns the focus', async () => {
    const { wrapper } = mountWithMenu()

    await wrapper.get(surface('26', 'mesial')).trigger('click')
    await wrapper.get('.menu .close').trigger('click')
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(false)
    expect(document.activeElement?.getAttribute('data-surface')).toBe('mesial')

    await wrapper.get(surface('26', 'mesial')).trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(false)

    await wrapper.get(surface('26', 'mesial')).trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(false)
  })

  it('stays open when clicking inside it', async () => {
    const { wrapper } = mountWithMenu()

    await wrapper.get(surface('26', 'mesial')).trigger('click')
    wrapper.get('.menu').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(true)
  })

  it('opens with Enter and Space from the keyboard', async () => {
    const { wrapper } = mountWithMenu()

    await wrapper.get(surface('11', 'lingual')).trigger('keydown', { key: 'Enter' })
    expect(wrapper.get('.menu .title').text()).toBe('11 Palatal')

    await wrapper.get('.menu .close').trigger('click')
    await wrapper.get(surface('11', 'vestibular')).trigger('keydown', { key: ' ' })
    expect(wrapper.get('.menu .title').text()).toBe('11 Vestibular')
  })

  it('does not open on disabled charts or missing teeth, and hides the tooltip while open', async () => {
    const { wrapper } = mountWithMenu([], { toothStates: { 18: 'extracted' } })

    await wrapper.get(surface('18', 'occlusal')).trigger('click')
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(false)

    await wrapper.get(surface('17', 'occlusal')).trigger('mouseenter')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    await wrapper.get(surface('17', 'occlusal')).trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    const disabled = mountWithMenu([], { disabled: true }).wrapper
    await disabled.get(surface('17', 'occlusal')).trigger('click')
    expect(disabled.find('.odontogram-surface-menu').exists()).toBe(false)
  })

  it('keeps toggling the selection without the slot', async () => {
    const wrapper = mount(Odontogram, { props: { showSurfaces: true } })
    mounted.push(wrapper)

    await wrapper.get(surface('16', 'occlusal')).trigger('click')
    expect(wrapper.emitted('update:surfaces')).toEqual([[{ 16: ['occlusal'] }]])
    expect(wrapper.find('.odontogram-surface-menu').exists()).toBe(false)
    expect(wrapper.get(surface('16', 'occlusal')).attributes('role')).toBe('checkbox')
  })
})
