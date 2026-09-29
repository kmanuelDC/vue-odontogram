<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type {
  OdontogramLabels,
  ToothDefinition,
  ToothState,
  ToothVisualCondition,
} from '../types/odontogram'
import type { ToothSurface } from '../types/surfaces'
import { defaultOdontogramLabels } from '../utils/labels'

export type { ToothVisualCondition }

/** One line of the per-surface summary of a tooth. */
export interface TooltipSurfaceSummary {
  surface: ToothSurface
  /** Letter of the surface on the tooth, e.g. `P`. */
  letter: string
  /** Clinical name, e.g. "Palatal". */
  name: string
  /** Findings recorded on the surface. */
  findings: readonly string[]
}

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
    state?: ToothState
    /** Names of the findings on the tooth. */
    findings?: readonly string[]
    /** Tooth number in the chart's notation; the FDI ID by default. */
    number?: string
    /**
     * Hovered or focused surface. The tooltip then describes that surface:
     * `selected` and `findings` refer to it instead of the whole tooth.
     */
    surface?: ToothSurface
    /** Clinical name of `surface` on this tooth, e.g. "Palatal". */
    surfaceName?: string
    /** What `surface` is, from `labels.surfaceDescriptions`. */
    surfaceDescription?: string
    /** Findings of each surface of the tooth, for the tooltip of a tooth. */
    surfaceSummary?: readonly TooltipSurfaceSummary[]
    anchorRect?: TooltipAnchorRect
    placement?: TooltipPlacement
    margin?: number
    labels?: OdontogramLabels
  }>(),
  {
    selected: false,
    condition: undefined,
    state: 'present',
    findings: () => [],
    number: undefined,
    surface: undefined,
    surfaceName: undefined,
    surfaceDescription: undefined,
    surfaceSummary: () => [],
    anchorRect: undefined,
    placement: 'top',
    margin: 10,
    labels: () => defaultOdontogramLabels,
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
    <slot
      :tooth="tooth"
      :selected="selected"
      :condition="condition"
      :state="state"
      :findings="findings"
      :number="number ?? tooth.id"
      :surface="surface"
      :surface-name="surfaceName"
      :surface-summary="surfaceSummary"
    >
      <template v-if="surface">
        <div>{{ labels.tooth }}: {{ number ?? tooth.id }}</div>
        <div>{{ labels.surface }}: {{ surfaceName ?? surface }}</div>
        <div v-if="surfaceDescription" class="odontogram-tooltip__description">{{ surfaceDescription }}</div>
        <div v-if="state !== 'present'">{{ labels.state }}: {{ labels.states[state] }}</div>
        <div v-if="findings.length">{{ labels.findings }}: {{ findings.join(', ') }}</div>
        <div>{{ labels.selected }}: {{ selected ? labels.yes : labels.no }}</div>
      </template>
      <template v-else>
        <div>{{ labels.tooth }}: {{ number ?? tooth.id }}</div>
        <div>{{ labels.type }}: {{ labels.toothTypes[tooth.type] ?? tooth.type }}</div>
        <div v-if="state !== 'present'">{{ labels.state }}: {{ labels.states[state] }}</div>
        <div v-if="findings.length">{{ labels.findings }}: {{ findings.join(', ') }}</div>
        <template v-if="surfaceSummary.length">
          <div>{{ labels.surfaceSummary }}:</div>
          <div
            v-for="line in surfaceSummary"
            :key="line.surface"
            class="odontogram-tooltip__summary"
            :data-summary-surface="line.surface"
          >
            <span class="odontogram-tooltip__letter">{{ line.letter }}</span>
            {{ line.name }}: {{ line.findings.join(', ') }}
          </div>
        </template>
        <div>{{ labels.selected }}: {{ selected ? labels.yes : labels.no }}</div>
        <div v-if="condition?.label">{{ labels.condition }}: {{ condition.label }}</div>
      </template>
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

/* Per-surface summary: one indented line per surface with findings. */
.odontogram-tooltip__summary {
  padding-left: 0.5rem;
}

.odontogram-tooltip__letter {
  display: inline-block;
  min-width: 1.1em;
  font-weight: 700;
}

/* Surface definitions are longer than the other lines, so they may wrap. */
.odontogram-tooltip__description {
  max-width: 16rem;
  margin-bottom: 2px;
  opacity: 0.8;
  white-space: normal;
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
