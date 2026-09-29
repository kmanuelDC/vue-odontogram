<script setup lang="ts">
import { computed } from 'vue'
import type { ToothDefinition, ToothState } from '../types/odontogram'
import { toothNavigationKeys, type ToothNavigationKey } from '../utils/navigation'
import { absentToothStates } from '../utils/state-marks'

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
    /** Presentation transform supplied by the layout, after the shape's own. */
    layoutTransform?: string
    /** Prefix of the accessible name, e.g. "Tooth" → "Tooth 11". */
    label?: string
    /** Whether Tab reaches this tooth; a chart keeps a single tab stop. */
    focusable?: boolean
    /** Presence status; it never changes selection or interaction. */
    state?: ToothState
    /** Name of a non-present state, appended to the accessible name. */
    stateLabel?: string
    /** Extra text appended to the accessible name, e.g. the tooth findings. */
    description?: string
    /** Number shown in the title, in the chart's notation; the FDI ID by default. */
    number?: string
    /** Number read in the accessible name; `number` by default. */
    spokenNumber?: string
  }>(),
  {
    selected: false,
    disabled: false,
    condition: undefined,
    layoutTransform: undefined,
    label: 'Tooth',
    focusable: true,
    state: 'present',
    stateLabel: undefined,
    description: undefined,
    number: undefined,
    spokenNumber: undefined,
  },
)

/** Missing and extracted teeth keep only a dashed outline, without crown. */
const absent = computed(() => absentToothStates.has(props.state))
const accessibleName = computed(() =>
  [
    `${props.label} ${props.spokenNumber ?? props.number ?? props.tooth.id}`,
    props.state !== 'present' ? props.stateLabel : undefined,
    props.description,
  ]
    .filter(Boolean)
    .join(', '),
)

const emit = defineEmits<{
  select: [tooth: ToothDefinition]
  mouseenter: [tooth: ToothDefinition, event: MouseEvent]
  mouseleave: [tooth: ToothDefinition, event: MouseEvent]
  focus: [tooth: ToothDefinition, event: FocusEvent]
  blur: [tooth: ToothDefinition, event: FocusEvent]
  navigate: [tooth: ToothDefinition, key: ToothNavigationKey]
}>()

const strokeColor = computed(() =>
  props.condition?.outlineColor ??
  (props.selected ? 'var(--odontogram-selected-stroke-color, #b8c0cc)' : 'currentColor'),
)
const fillColor = computed(() => props.condition?.fillColor ?? 'currentColor')

const toothTransform = computed(() => {
  const transforms = [props.tooth.shape.transform, props.layoutTransform].filter(
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
  } else if (toothNavigationKeys.has(event.key)) {
    event.preventDefault()
    emit('navigate', props.tooth, event.key as ToothNavigationKey)
  }
}
</script>

<template>
  <g
    class="odontogram-tooth"
    :class="{
      'odontogram-tooth--selected': selected,
      'odontogram-tooth--disabled': disabled,
      'odontogram-tooth--absent': absent,
      [`odontogram-tooth--${state}`]: state !== 'present',
    }"
    :role="disabled ? undefined : 'option'"
    :aria-label="accessibleName"
    :data-tooth-state="state"
    :aria-selected="disabled ? undefined : selected"
    :aria-disabled="disabled"
    :tabindex="disabled || !focusable ? -1 : 0"
    :data-tooth-id="tooth.id"
    :style="{ cursor: disabled ? 'default' : 'pointer', color: strokeColor }"
    :transform="toothTransform"
    @click="select"
    @keydown="handleKeydown"
    @mouseenter="emit('mouseenter', tooth, $event)"
    @mouseleave="emit('mouseleave', tooth, $event)"
    @focus="emit('focus', tooth, $event)"
    @blur="emit('blur', tooth, $event)"
  >
    <title>{{ number ?? tooth.id }}</title>

    <path
      :stroke="strokeColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :stroke-dasharray="absent ? '4 3' : undefined"
      :d="tooth.shape.outlinePath"
    />

    <!-- Absent teeth keep the shadow only to show hover and selection. -->
    <path
      v-if="tooth.shape.shadowPath"
      :fill="fillColor"
      :d="tooth.shape.shadowPath"
      :data-colored="condition && !absent ? 'true' : undefined"
      :style="{ opacity: condition && !absent ? 1 : undefined }"
    />

    <template v-if="absent" />
    <template v-else-if="Array.isArray(tooth.shape.lineHighlightPath)">
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
