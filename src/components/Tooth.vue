<script setup lang="ts">
import { computed } from 'vue'
import type { ToothDefinition } from '../types/odontogram'
import type { OdontogramLayout } from '../utils/layout'

export interface ToothCondition {
  fillColor?: string
  outlineColor?: string
}

const props = withDefaults(
  defineProps<{
    tooth: ToothDefinition
    selected?: boolean
    disabled?: boolean
    condition?: ToothCondition
    layout?: OdontogramLayout
  }>(),
  {
    selected: false,
    disabled: false,
    condition: undefined,
    layout: 'arch',
  },
)

const emit = defineEmits<{
  select: [tooth: ToothDefinition]
  mouseenter: [tooth: ToothDefinition, event: MouseEvent]
  mouseleave: [tooth: ToothDefinition, event: MouseEvent]
}>()

const strokeColor = computed(() => props.condition?.outlineColor ?? 'currentColor')
const fillColor = computed(() => props.condition?.fillColor ?? 'currentColor')

/**
 * The provisional canine moves only on the x-axis to keep a compact
 * two-unit clearance from the lateral incisor.
 * The same local adjustment is used in all quadrants so the lower arch is
 * an exact vertical reflection of the upper curve.
 */
const primaryCanineTransformByQuadrant: Readonly<Record<number, string>> = {
  5: 'translate(209 20) scale(-1 1)',
  6: 'translate(209 20) scale(-1 1)',
  8: 'translate(209 20) scale(-1 1)',
  7: 'translate(209 20) scale(-1 1)',
}

/**
 * Mirrors each central incisor while moving it four units away from the
 * midline. The pair gains eight units of clearance, about 20% of its
 * provisional width.
 */
const primaryCentralIncisorTransform = 'translate(366 0) scale(-1 1)'

/**
 * Each lateral incisor moves away from the midline only on the x-axis and
 * rotates twenty degrees around its own center. The horizontal reflection makes
 * the upper-left lateral incisor rotate counterclockwise.
 */
const primaryLateralIncisorTransform = 'translate(-6 0) rotate(20 141.6 39.4)'

/**
 * Keeps 54/84 20 units left and 64/74 20 units right in screen space.
 * Horizontal quadrant reflection reverses the local x-axis for 64 and 74.
 */
const primaryFirstMolarTransformByQuadrant: Readonly<Record<number, string>> = {
  5: 'translate(-20 -4)',
  6: 'translate(-20 -4)',
  8: 'translate(-20 -4)',
  7: 'translate(-20 -4)',
}

const primarySecondMolarTransform = 'translate(0 6)'

const shapeTransform = computed(() => {
  if (props.layout !== 'arch') {
    return undefined
  }

  if (props.tooth.type === 'Primary Central Incisor') {
    return primaryCentralIncisorTransform
  }

  if (props.tooth.type === 'Primary Lateral Incisor') {
    return primaryLateralIncisorTransform
  }

  if (props.tooth.type === 'Primary Canine') {
    return primaryCanineTransformByQuadrant[props.tooth.quadrant]
  }

  if (props.tooth.type === 'Primary First Molar') {
    return primaryFirstMolarTransformByQuadrant[props.tooth.quadrant]
  }

  return props.tooth.type === 'Primary Second Molar' ? primarySecondMolarTransform : undefined
})
const toothTransform = computed(() => {
  const transforms = [props.tooth.shape.transform, shapeTransform.value].filter(
    (transform): transform is string => Boolean(transform),
  )

  return transforms.length ? transforms.join(' ') : undefined
})

function select(): void {
  if (!props.disabled) {
    emit('select', props.tooth)
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    select()
  }
}
</script>

<template>
  <g
    class="odontogram-tooth"
    :class="{
      'odontogram-tooth--selected': selected,
      'odontogram-tooth--disabled': disabled,
    }"
    :role="disabled ? undefined : 'option'"
    :aria-label="`Tooth ${tooth.id}`"
    :aria-selected="disabled ? undefined : selected"
    :aria-disabled="disabled"
    :tabindex="disabled ? -1 : 0"
    :style="{ cursor: disabled ? 'default' : 'pointer', color: strokeColor }"
    :transform="toothTransform"
    @click="select"
    @keydown="handleKeydown"
    @mouseenter="emit('mouseenter', tooth, $event)"
    @mouseleave="emit('mouseleave', tooth, $event)"
  >
    <title>{{ tooth.id }}</title>

    <path
      :stroke="strokeColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :d="tooth.shape.outlinePath"
    />

    <path
      v-if="tooth.shape.shadowPath"
      :fill="fillColor"
      :d="tooth.shape.shadowPath"
      :data-colored="condition ? 'true' : undefined"
      :style="{ opacity: condition ? 1 : undefined }"
    />

    <template v-if="Array.isArray(tooth.shape.lineHighlightPath)">
      <path
        v-for="path in tooth.shape.lineHighlightPath"
        :key="path"
        :stroke="strokeColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        :d="path"
      />
    </template>
    <path
      v-else-if="tooth.shape.lineHighlightPath"
      :stroke="strokeColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      :d="tooth.shape.lineHighlightPath"
    />
  </g>
</template>






























