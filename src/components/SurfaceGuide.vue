<script setup lang="ts">
import { computed, ref } from 'vue'
import { ntsPeruFindingCatalog } from '../catalogs/nts-peru'
import type { FindingCatalog, OdontogramFinding } from '../types/findings'
import type { OdontogramLabelsInput, ToothNotation } from '../types/odontogram'
import { toothSurfaces, type SurfaceShapeKind, type ToothSurface } from '../types/surfaces'
import { getToothRecord } from '../utils/finding-records'
import { layoutToothSurfaceFindings } from '../utils/findings'
import { resolveOdontogramLabels } from '../utils/labels'
import { formatToothNumber } from '../utils/notation'
import { buildSurfaceDiagram, getSurfaceAxes, surfaceCenter } from '../utils/surfaces'
import FindingPrimitives from './FindingPrimitives.vue'

const props = withDefaults(
  defineProps<{
    /** FDI ID of the tooth to explain. */
    toothId: string
    /** Findings of the chart; the guide draws and lists this tooth's surface findings. */
    findings?: OdontogramFinding[]
    findingCatalog?: FindingCatalog
    /** Surfaces shown as selected, e.g. `surfaces[toothId]` of `v-model:surfaces`. */
    selected?: ToothSurface[]
    /** Highlighted surface; follows hover and focus, and can be set from outside. */
    active?: ToothSurface
    labels?: OdontogramLabelsInput
    notation?: ToothNotation
    disabled?: boolean
    /** Shape of the diagram, like the chart's `surfaceShape`. */
    shape?: SurfaceShapeKind
  }>(),
  {
    findings: () => [],
    findingCatalog: () => ntsPeruFindingCatalog,
    selected: () => [],
    active: undefined,
    labels: undefined,
    notation: 'FDI',
    disabled: false,
    shape: 'square',
  },
)

const emit = defineEmits<{
  'surface-click': [surface: ToothSurface]
  'update:active': [surface: ToothSurface | undefined]
}>()

/** Diagram side and center in the guide's `0 0 100 100` viewBox. */
const size = 84
const center = { x: 50, y: 50 }

const resolvedLabels = computed(() => resolveOdontogramLabels(props.labels))
const number = computed(() => formatToothNumber(props.toothId, props.notation))
const spokenNumber = computed(() => formatToothNumber(props.toothId, props.notation, 'text'))

/** Same orientation as the horizontal chart: vestibular out, mesial toward the midline. */
const diagram = computed(() =>
  buildSurfaceDiagram(props.toothId, center, getSurfaceAxes(props.toothId), size, 1.2, props.shape),
)

const drawnFindings = computed(() =>
  layoutToothSurfaceFindings(props.findings, props.findingCatalog, diagram.value),
)

const record = computed(() => getToothRecord(props.toothId, props.findings, props.findingCatalog))

/** Recorded findings of a surface, e.g. "Caries (Planned)". */
function findingsOf(surface: ToothSurface): string[] {
  const { findingStatuses } = resolvedLabels.value
  return record.value.surfaces[surface].map(({ finding, definition }) => {
    const name = definition?.name ?? finding.code
    const status = finding.status ?? 'existing'
    return status === 'existing' ? name : `${name} (${findingStatuses[status]})`
  })
}

const localActive = ref<ToothSurface>()
const activeSurface = computed(() => localActive.value ?? props.active)

function setActive(surface: ToothSurface | undefined): void {
  localActive.value = surface
  emit('update:active', surface)
}

function select(surface: ToothSurface): void {
  if (!props.disabled) {
    emit('surface-click', surface)
  }
}

const shapes = computed(() =>
  diagram.value.surfaces.map((shape) => ({
    ...shape,
    center: surfaceCenter(shape),
    letter: resolvedLabels.value.surfaceLetters[shape.name],
  })),
)
const activeShape = computed(() => shapes.value.find(({ surface }) => surface === activeSurface.value))

const items = computed(() =>
  toothSurfaces.map((surface) => {
    const { name, letter } = shapes.value.find((shape) => shape.surface === surface)!
    return {
      surface,
      letter,
      name: resolvedLabels.value.surfaceNames[name],
      description: resolvedLabels.value.surfaceDescriptions[name],
      findings: findingsOf(surface),
      selected: props.selected.includes(surface),
    }
  }),
)
</script>

<template>
  <section
    class="odontogram-surface-guide"
    :aria-label="`${resolvedLabels.surfaceGuide}, ${resolvedLabels.tooth} ${spokenNumber}`"
    :data-tooth-id="toothId"
  >
    <p class="odontogram-surface-guide__title">{{ resolvedLabels.tooth }} {{ number }}</p>

    <svg
      class="odontogram-surface-guide__diagram"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      @mouseleave="setActive(undefined)"
    >
      <path
        v-for="shape in shapes"
        :key="shape.surface"
        class="odontogram-surface"
        :class="{ 'odontogram-surface--selected': selected.includes(shape.surface) }"
        :d="shape.d"
        :stroke-width="diagram.strokeWidth"
        :data-guide-surface="shape.surface"
        @mouseenter="setActive(shape.surface)"
        @click="select(shape.surface)"
      />

      <g class="odontogram-surface-guide__findings">
        <g
          v-for="finding in drawnFindings"
          :key="finding.key"
          class="odontogram-finding"
          :class="[`odontogram-finding--${finding.tone}`, `odontogram-finding--${finding.status}`]"
          :style="finding.color ? { color: finding.color } : undefined"
          :stroke-width="finding.strokeWidth"
          :data-finding="finding.code"
        >
          <FindingPrimitives :primitives="finding.primitives" />
        </g>
      </g>

      <path
        v-if="activeShape"
        class="odontogram-surface-guide__highlight"
        :d="activeShape.d"
        :data-highlight="activeShape.surface"
      />

      <text
        v-for="shape in shapes"
        :key="`letter-${shape.surface}`"
        class="odontogram-surface-guide__letter"
        :class="{ 'odontogram-surface-guide__letter--active': shape.surface === activeSurface }"
        :x="shape.center.x"
        :y="shape.center.y"
        text-anchor="middle"
        dominant-baseline="central"
      >
        {{ shape.letter }}
      </text>
    </svg>

    <ul class="odontogram-surface-guide__list">
      <li v-for="item in items" :key="item.surface">
        <button
          type="button"
          class="odontogram-surface-guide__item"
          :class="{ 'odontogram-surface-guide__item--active': item.surface === activeSurface }"
          :aria-pressed="item.selected"
          :disabled="disabled"
          :data-guide-item="item.surface"
          @mouseenter="setActive(item.surface)"
          @mouseleave="setActive(undefined)"
          @focus="setActive(item.surface)"
          @blur="setActive(undefined)"
          @click="select(item.surface)"
        >
          <span class="odontogram-surface-guide__badge" aria-hidden="true">{{ item.letter }}</span>
          <span class="odontogram-surface-guide__text">
            <strong>{{ item.name }}</strong>
            <span>{{ item.description }}</span>
            <span v-if="item.findings.length" class="odontogram-surface-guide__findings-text">
              {{ resolvedLabels.findings }}: {{ item.findings.join(', ') }}
            </span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style>
.odontogram-surface-guide {
  --odontogram-stroke-color: #8a98be;
  --odontogram-selected-color: #c6ccf8;
  display: grid;
  grid-template-columns: minmax(7rem, 10rem) minmax(0, 1fr);
  gap: 0.5rem 1rem;
  align-items: start;
  color: #1e293b;
  font-family: inherit;
}

.odontogram-surface-guide__title {
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 700;
}

.odontogram-surface-guide__diagram {
  width: 100%;
  height: auto;
  overflow: visible;
}

.odontogram-surface-guide__diagram .odontogram-surface:hover {
  fill: var(--odontogram-surface-hover-color, var(--odontogram-selected-color));
}

.odontogram-surface-guide__highlight {
  fill: none;
  stroke: var(--odontogram-surface-focus-color, #4338ca);
  stroke-width: 2.4;
  stroke-linejoin: round;
  pointer-events: none;
}

.odontogram-surface-guide__findings {
  pointer-events: none;
}

.odontogram-surface-guide__letter {
  fill: var(--odontogram-surface-letter-color, #334155);
  font-size: 10px;
  font-weight: 700;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 2.5px;
  pointer-events: none;
}

.odontogram-surface-guide__letter--active {
  fill: var(--odontogram-surface-focus-color, #4338ca);
}

/* One column in narrow containers, several side by side when there is room. */
.odontogram-surface-guide__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 0.25rem 0.75rem;
  align-content: start;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Scoped under the guide so host button styles do not override it. */
.odontogram-surface-guide .odontogram-surface-guide__item {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  background: none;
  cursor: pointer;
}

.odontogram-surface-guide .odontogram-surface-guide__item:disabled {
  cursor: default;
  opacity: 1;
}

.odontogram-surface-guide .odontogram-surface-guide__item--active {
  border-color: var(--odontogram-surface-focus-color, #4338ca);
  background: var(--odontogram-surface-guide-active-bg, #eef2ff);
}

.odontogram-surface-guide__item[aria-pressed='true'] .odontogram-surface-guide__badge {
  color: #fff;
  background: var(--odontogram-surface-selected-color, #6366f1);
}

.odontogram-surface-guide__badge {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  font-weight: 700;
  background: #e2e8f0;
}

.odontogram-surface-guide__text {
  display: grid;
  gap: 0.1rem;
}

.odontogram-surface-guide__findings-text {
  color: #475569;
  font-size: 0.8125rem;
}
</style>
