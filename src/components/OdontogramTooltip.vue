<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ToothDefinition } from '../types/odontogram'

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export interface ToothVisualCondition {
  label?: string
  fillColor?: string
  outlineColor?: string
}

export interface TooltipAnchorRect {
  top: number
  right: number
  bottom: number
  left: number
}

const props = withDefaults(
  defineProps<{
    active: boolean
    tooth?: ToothDefinition
    selected?: boolean
    condition?: ToothVisualCondition
    anchorRect?: TooltipAnchorRect
    placement?: TooltipPlacement
    margin?: number
  }>(),
  {
    selected: false,
    condition: undefined,
    anchorRect: undefined,
    placement: 'top',
    margin: 10,
  },
)

const tooltip = ref<HTMLElement | null>(null)
const coordinates = ref({ left: -9999, top: -9999, isBelow: false })

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

async function updateCoordinates(): Promise<void> {
  if (!(props.active && props.anchorRect && tooltip.value)) {
    return
  }

  await nextTick()
  const tooltipRect = tooltip.value.getBoundingClientRect()
  const viewportPadding = 8
  const arrowOffset = 12
  const wantsBottom = props.placement.startsWith('bottom')
  const centerX = props.anchorRect.left + (props.anchorRect.right - props.anchorRect.left) / 2
  const maximumLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding)
  const left = clamp(centerX - tooltipRect.width / 2, viewportPadding, maximumLeft)
  const above = props.anchorRect.top - tooltipRect.height - props.margin - arrowOffset
  const below = props.anchorRect.bottom + props.margin + arrowOffset
  const maximumTop = Math.max(viewportPadding, window.innerHeight - tooltipRect.height - viewportPadding)

  let isBelow = wantsBottom
  let top = wantsBottom ? below : above

  if (!isBelow && top < viewportPadding) {
    isBelow = true
    top = below
  }
  if (isBelow && top > maximumTop) {
    isBelow = false
    top = above
  }

  coordinates.value = { left, top: clamp(top, viewportPadding, maximumTop), isBelow }
}

watch(
  () => [props.active, props.anchorRect, props.placement, props.margin] as const,
  () => void updateCoordinates(),
  { deep: true, flush: 'post' },
)
</script>

<template>
  <div
    v-if="active && tooth"
    ref="tooltip"
    class="odontogram-tooltip"
    role="tooltip"
    :style="{
      position: 'fixed',
      left: `${coordinates.left}px`,
      top: `${coordinates.top}px`,
      opacity: coordinates.left === -9999 ? 0 : 1,
    }"
  >
    <slot :tooth="tooth" :selected="selected" :condition="condition">
      <div>Tooth: {{ tooth.id }}</div>
      <div>Type: {{ tooth.type }}</div>
      <div>Selected: {{ selected ? 'Yes' : 'No' }}</div>
      <div v-if="condition?.label">Condition: {{ condition.label }}</div>
    </slot>
    <span
      aria-hidden="true"
      class="odontogram-tooltip__arrow"
      :class="{ 'odontogram-tooltip__arrow--below': coordinates.isBelow }"
    />
  </div>
</template>

<style>
.odontogram-tooltip {
  z-index: 1000;
  pointer-events: none;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--odontogram-tooltip-bg, rgba(0, 0, 0, 0.85));
  color: var(--odontogram-tooltip-fg, #fff);
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transition: opacity 150ms ease;
}

.odontogram-tooltip__arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 0;
  height: 0;
  border-top: 6px solid var(--odontogram-tooltip-bg, rgba(0, 0, 0, 0.85));
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  transform: translateX(-50%);
}

.odontogram-tooltip__arrow--below {
  top: -6px;
  bottom: auto;
  border-top: 0;
  border-bottom: 6px solid var(--odontogram-tooltip-bg, rgba(0, 0, 0, 0.85));
}
</style>
