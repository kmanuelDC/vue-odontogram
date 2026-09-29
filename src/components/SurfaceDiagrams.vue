<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { OdontogramLabels } from '../types/odontogram'
import type { OdontogramSurfaces, ToothSurface } from '../types/surfaces'
import { toothSurfaces } from '../types/surfaces'
import type { ToothAnchor } from '../utils/anchors'
import { findNavigationTarget, toothNavigationKeys, type ToothNavigationKey } from '../utils/navigation'
import type { SurfaceDiagram } from '../utils/surfaces'

const props = defineProps<{
  diagrams: readonly SurfaceDiagram[]
  /** Anchors of the visible teeth, for left/right navigation on screen. */
  anchors: readonly ToothAnchor[]
  surfaces: OdontogramSurfaces
  disabled: boolean
  /** Teeth whose surfaces cannot be selected, e.g. missing or extracted. */
  inactiveTeeth: ReadonlySet<string>
  labels: OdontogramLabels
  /** Number read in accessible names, in the chart's notation. */
  spokenNumber: (toothId: string) => string
  /** Activating a surface opens a menu instead of toggling its selection. */
  menu?: boolean
  /** Surface whose menu is open, if any. */
  openMenu?: { toothId: string; surface: ToothSurface }
}>()

const emit = defineEmits<{
  /** Click, Enter or Space on a surface; `element` is its polygon. */
  activate: [toothId: string, surface: ToothSurface, element: SVGElement]
  /** A surface is hovered or focused; the event target is its polygon. */
  enter: [toothId: string, surface: ToothSurface, event: Event]
  leave: []
}>()

const root = ref<SVGGElement | null>(null)
const active = ref<{ toothId: string; surface: ToothSurface }>()

function handleFocus(toothId: string, surface: ToothSurface, event: FocusEvent): void {
  active.value = { toothId, surface }
  emit('enter', toothId, surface, event)
}

function isSelected(toothId: string, surface: ToothSurface): boolean {
  return props.surfaces[toothId]?.includes(surface) ?? false
}

const activeDiagrams = computed(() => props.diagrams.filter(({ toothId }) => !props.inactiveTeeth.has(toothId)))

/**
 * The single surface reachable with Tab: the last focused one, else the first
 * selected surface, else the first surface of the first active tooth.
 */
const focusable = computed(() => {
  const diagrams = activeDiagrams.value
  if (active.value && diagrams.some(({ toothId }) => toothId === active.value!.toothId)) {
    return active.value
  }

  for (const { toothId } of diagrams) {
    const surface = toothSurfaces.find((item) => isSelected(toothId, item))
    if (surface) {
      return { toothId, surface }
    }
  }

  return diagrams[0] ? { toothId: diagrams[0].toothId, surface: toothSurfaces[0] } : undefined
})

function isFocusable(toothId: string, surface: ToothSurface): boolean {
  return focusable.value?.toothId === toothId && focusable.value.surface === surface
}

function activate(toothId: string, surface: ToothSurface, event: Event): void {
  if (!props.disabled && !props.inactiveTeeth.has(toothId) && event.currentTarget instanceof SVGElement) {
    active.value = { toothId, surface }
    emit('activate', toothId, surface, event.currentTarget)
  }
}

function isMenuOpen(toothId: string, surface: ToothSurface): boolean {
  return props.openMenu?.toothId === toothId && props.openMenu.surface === surface
}

/** Left/right and Home/End move between teeth; up/down between the surfaces of a tooth. */
function target(toothId: string, surface: ToothSurface, key: ToothNavigationKey) {
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const index = toothSurfaces.indexOf(surface) + (key === 'ArrowDown' ? 1 : -1)
    return toothSurfaces[index] ? { toothId, surface: toothSurfaces[index] } : undefined
  }

  const anchors = props.anchors.filter((anchor) => !props.inactiveTeeth.has(anchor.toothId) || anchor.toothId === toothId)
  const next = findNavigationTarget(anchors, toothId, key)
  return next && next !== toothId ? { toothId: next, surface } : undefined
}

async function handleKeydown(event: KeyboardEvent, toothId: string, surface: ToothSurface): Promise<void> {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    activate(toothId, surface, event)
    return
  }
  if (!toothNavigationKeys.has(event.key)) {
    return
  }

  event.preventDefault()
  const next = target(toothId, surface, event.key as ToothNavigationKey)
  if (!next) {
    return
  }

  active.value = next
  await nextTick()
  root.value
    ?.querySelector<SVGElement>(`[data-surface-tooth="${next.toothId}"][data-surface="${next.surface}"]`)
    ?.focus()
}
</script>

<template>
  <g ref="root" class="odontogram__surfaces" role="group" :aria-label="labels.surfaces">
    <g
      v-for="diagram in diagrams"
      :key="diagram.toothId"
      class="odontogram-surfaces"
      :class="{ 'odontogram-surfaces--inactive': inactiveTeeth.has(diagram.toothId) }"
      :data-surfaces-for="diagram.toothId"
      :stroke-width="diagram.strokeWidth"
    >
      <path
        v-for="{ surface, name, d } in diagram.surfaces"
        :key="surface"
        class="odontogram-surface"
        :class="{ 'odontogram-surface--selected': isSelected(diagram.toothId, surface) }"
        :d="d"
        :role="menu ? 'button' : 'checkbox'"
        :aria-label="`${labels.tooth} ${spokenNumber(diagram.toothId)}, ${labels.surfaceNames[name]}`"
        :aria-checked="menu ? undefined : isSelected(diagram.toothId, surface)"
        :aria-haspopup="menu ? 'dialog' : undefined"
        :aria-expanded="menu ? isMenuOpen(diagram.toothId, surface) : undefined"
        :aria-disabled="disabled || inactiveTeeth.has(diagram.toothId) || undefined"
        :tabindex="!disabled && isFocusable(diagram.toothId, surface) ? 0 : -1"
        :data-surface-tooth="diagram.toothId"
        :data-surface="surface"
        @click="activate(diagram.toothId, surface, $event)"
        @focus="handleFocus(diagram.toothId, surface, $event)"
        @blur="emit('leave')"
        @mouseenter="emit('enter', diagram.toothId, surface, $event)"
        @mouseleave="emit('leave')"
        @keydown="handleKeydown($event, diagram.toothId, surface)"
      />
    </g>
  </g>
</template>
