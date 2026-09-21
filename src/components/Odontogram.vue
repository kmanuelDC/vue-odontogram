<script setup lang="ts">
import { computed, ref } from 'vue'
import { primaryHorizontalTeethPaths } from '../data/primary-horizontal'
import { primaryTeethPaths } from '../data/primary'
import { permanentHorizontalTeethPaths } from '../data/permanent-horizontal'
import { permanentTeethPaths } from '../data/permanent'
import { useToothSelection } from '../composables/useToothSelection'
import type { ToothDefinition, ToothNotation } from '../types/odontogram'
import {
  resolveDentitionLayout,
  type RenderableDentition,
} from '../utils/dentition-layout'
import { getLayoutDefinition, type OdontogramLayout } from '../utils/layout'
import { primaryArchLayoutDefinition } from '../utils/primary-layout'
import { primaryHorizontalLayoutDefinition } from '../utils/primary-horizontal-layout'
import { buildToothId } from '../utils/notation'
import ConditionLabels from './ConditionLabels.vue'
import OdontogramTooltip, {
  type TooltipAnchorRect,
  type ToothVisualCondition,
} from './OdontogramTooltip.vue'
import Tooth from './Tooth.vue'


interface OdontogramCondition extends ToothVisualCondition {
  teeth: string[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    dentition?: RenderableDentition
    notation?: ToothNotation
    singleSelect?: boolean
    disabled?: boolean
    showLabels?: boolean
    showTooltip?: boolean
    conditions?: OdontogramCondition[]
    layout?: OdontogramLayout
  }>(),
  {
    modelValue: () => [],
    dentition: 'permanent',
    notation: 'FDI',
    singleSelect: false,
    disabled: false,
    showLabels: false,
    showTooltip: true,
    conditions: undefined,
    layout: 'arch',
  },
)

const emit = defineEmits<{
  'update:modelValue': [selectedTeeth: string[]]
  change: [selectedTeeth: string[]]
  'tooth-click': [tooth: ToothDefinition, selectedTeeth: string[]]
}>()

const resolvedDentitionLayout = computed(() =>
  resolveDentitionLayout(props.dentition, props.layout),
)

const resolvedLayout = computed<OdontogramLayout>(() => {
  const resolution = resolvedDentitionLayout.value

  if (resolution.fellBack) {
    console.warn(
      '[vue-odontogram] Primary dentition currently supports only the arch layout; falling back to arch.',
    )
  }

  return resolution.resolved.layout
})

const layoutDefinition = computed(() => {
  const layout = resolvedLayout.value

  if (props.dentition === 'primary') {
    return layout === 'horizontal'
      ? primaryHorizontalLayoutDefinition
      : primaryArchLayoutDefinition
  }

  return getLayoutDefinition(layout)
})
const shapesForLayout = computed(() => {
  const layout = resolvedLayout.value

  if (props.dentition === 'primary') {
    return layout === 'horizontal'
      ? primaryHorizontalTeethPaths
      : primaryTeethPaths
  }

  return layout === 'horizontal'
    ? permanentHorizontalTeethPaths
    : permanentTeethPaths
})

const teethByQuadrant = computed(() =>
  layoutDefinition.value.quadrants.map(({ quadrant, transform }) => ({
    quadrant,
    transform,
    teeth: shapesForLayout.value.map(
      (shape): ToothDefinition => ({
        id: buildToothId(props.dentition, quadrant, shape.position, 'FDI'),
        position: shape.position,
        quadrant,
        dentition: props.dentition,
        type: shape.type,
        shape,
      }),
    ),
  })),
)

const hoveredTooth = ref<ToothDefinition>()
const hoveredAnchorRect = ref<TooltipAnchorRect>()

const conditionByTooth = computed(() => {
  const conditions = new Map<string, OdontogramCondition>()

  for (const condition of props.conditions ?? []) {
    for (const toothId of condition.teeth) {
      conditions.set(toothId, condition)
    }
  }

  return conditions
})

const { isSelected, toggle } = useToothSelection({
  modelValue: () => props.modelValue,
  singleSelect: () => props.singleSelect,
})

function handleMouseEnter(tooth: ToothDefinition, event: MouseEvent): void {
  const target = event.currentTarget
  if (!(target instanceof SVGElement)) {
    return
  }

  const rect = target.getBoundingClientRect()
  hoveredTooth.value = tooth
  hoveredAnchorRect.value = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

function handleMouseLeave(): void {
  hoveredTooth.value = undefined
  hoveredAnchorRect.value = undefined
}

function handleSelect(tooth: ToothDefinition): void {
  const selectedTeeth = toggle(tooth.id)

  emit('update:modelValue', selectedTeeth)
  emit('change', selectedTeeth)
  emit('tooth-click', tooth, selectedTeeth)
}
</script>

<template>
  <div
    class="odontogram"
    role="listbox"
    aria-label="Odontogram"
    :aria-multiselectable="!singleSelect"
    :aria-disabled="disabled"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
:viewBox="layoutDefinition.viewBox"
      class="odontogram__svg"
      :aria-label="`${dentition} odontogram`"
    >
      <title>{{ dentition }} odontogram</title>

      <g
        v-for="quadrant in teethByQuadrant"
        :key="quadrant.quadrant"
        :transform="quadrant.transform"
      >
        <Tooth
          v-for="tooth in quadrant.teeth"
          :key="tooth.id"
          :tooth="tooth"
          :selected="isSelected(tooth.id)"
          :disabled="disabled"
          :condition="conditionByTooth.get(tooth.id)"
          :layout="resolvedLayout"
          @select="handleSelect"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        />
      </g>
    </svg>

    <OdontogramTooltip
      v-if="showTooltip"
      :active="Boolean(hoveredTooth)"
      :tooth="hoveredTooth"
      :selected="hoveredTooth ? isSelected(hoveredTooth.id) : false"
      :condition="hoveredTooth ? conditionByTooth.get(hoveredTooth.id) : undefined"
      :anchor-rect="hoveredAnchorRect"
    />

    <ConditionLabels v-if="showLabels" :conditions="conditions" />
  </div>
</template>

<style>
.odontogram {
  --odontogram-stroke-color: #8a98be;
  --odontogram-selected-color: #c6ccf8;
  width: 100%;
  color: var(--odontogram-stroke-color);
}

.odontogram__svg {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  touch-action: manipulation;
}

.odontogram-tooth path:nth-of-type(2) {
  opacity: 0;
  transition: opacity 200ms ease-in;
}

.odontogram-tooth path[data-colored='true'],
.odontogram-tooth--selected path:nth-of-type(2),
.odontogram-tooth:not(.odontogram-tooth--disabled):hover path:nth-of-type(2) {
  opacity: 1;
}

.odontogram-tooth--selected path:nth-of-type(2),
.odontogram-tooth:not(.odontogram-tooth--disabled):hover path:nth-of-type(2) {
  fill: var(--odontogram-selected-color);
}

.odontogram-tooth:focus-visible {
  outline: 3px solid currentColor;
}
</style>














