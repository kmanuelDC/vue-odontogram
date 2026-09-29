<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ntsPeruFindingCatalog } from '../catalogs/nts-peru'
import type { FindingCatalog, FindingStatus, OdontogramFinding } from '../types/findings'
import { findingStatuses } from '../types/findings'
import type { OdontogramLabelsInput, OdontogramToothStates, ToothNotation } from '../types/odontogram'
import { toothSurfaces, type SurfaceShapeKind, type ToothSurface } from '../types/surfaces'
import {
  getToothRecord,
  type SurfaceFindingRemoval,
  type ToothFindingEntry,
  type ToothFindingInput,
} from '../utils/finding-records'
import { getFindingScope } from '../utils/findings'
import { resolveOdontogramLabels } from '../utils/labels'
import { formatToothNumber, getToothType } from '../utils/notation'
import { absentToothStates, resolveToothState } from '../utils/state-marks'
import { getSurfaceName } from '../utils/surfaces'
import SurfaceGuide from './SurfaceGuide.vue'

/**
 * Panel with everything recorded on one tooth: its surfaces (drawn with the
 * surface guide), its findings by surface and on the whole tooth, and a form
 * to add new ones. It holds no clinical rules and saves nothing: it emits
 * `add-finding` and `remove-finding`, and the app decides what to record.
 */
const props = withDefaults(
  defineProps<{
    /** FDI ID of the tooth. */
    toothId: string
    findings?: OdontogramFinding[]
    findingCatalog?: FindingCatalog
    toothStates?: OdontogramToothStates
    labels?: OdontogramLabelsInput
    notation?: ToothNotation
    /** Shape of the surface diagram, like the chart's `surfaceShape`. */
    shape?: SurfaceShapeKind
    /** Read-only panel: no adding or removing. */
    disabled?: boolean
    /**
     * Surfaces chosen for the next surface finding. Bind it with
     * `v-model:selected-surfaces` to choose them from the chart too (e.g.
     * `surfaces[toothId]` of the chart's `v-model:surfaces`); without it the
     * panel keeps its own choice.
     */
    selectedSurfaces?: ToothSurface[]
  }>(),
  {
    findings: () => [],
    findingCatalog: () => ntsPeruFindingCatalog,
    toothStates: undefined,
    labels: undefined,
    notation: 'FDI',
    shape: 'square',
    disabled: false,
    selectedSurfaces: undefined,
  },
)

const emit = defineEmits<{
  /** A finding to record; pass it to `addFinding` to update the list. */
  'add-finding': [input: ToothFindingInput]
  /** A finding to remove; pass it to `removeSurfaceFinding` to update the list. */
  'remove-finding': [removal: SurfaceFindingRemoval]
  /** The surfaces chosen for the next surface finding changed. */
  'update:selectedSurfaces': [surfaces: ToothSurface[]]
}>()

const text = computed(() => resolveOdontogramLabels(props.labels))
const number = computed(() => formatToothNumber(props.toothId, props.notation))
const spokenNumber = computed(() => formatToothNumber(props.toothId, props.notation, 'text'))
const type = computed(() => {
  const toothType = getToothType(props.toothId)
  return text.value.toothTypes[toothType] ?? toothType
})
const state = computed(() => resolveToothState(props.toothStates, props.toothId))
/** Missing and extracted teeth have no surfaces to record on. */
const absent = computed(() => absentToothStates.has(state.value))

const record = computed(() => getToothRecord(props.toothId, props.findings, props.findingCatalog))

/** Surfaces with findings, in the usual order, with their clinical names. */
const surfaceGroups = computed(() =>
  toothSurfaces
    .filter((surface) => record.value.surfaces[surface].length)
    .map((surface) => {
      const name = getSurfaceName(surface, props.toothId)
      return {
        surface,
        name: text.value.surfaceNames[name],
        letter: text.value.surfaceLetters[name],
        entries: record.value.surfaces[surface],
      }
    }),
)

function describe({ finding, definition }: ToothFindingEntry): string {
  const status = finding.status ?? 'existing'
  const name = definition?.name ?? finding.code
  return status === 'existing' ? name : `${name} (${text.value.findingStatuses[status]})`
}

/** Whole-tooth findings can be removed; spans and pairs only through their own teeth. */
function removable({ scope, finding }: ToothFindingEntry): boolean {
  return (scope === 'tooth' || scope === 'unknown') && finding.teeth.includes(props.toothId)
}

// Catalog codes offered by the form: on surfaces, or on the whole tooth.
const codes = computed(() => {
  const all = Object.entries(props.findingCatalog).map(([code, definition]) => ({
    code,
    name: definition.name,
    scope: getFindingScope(definition.symbol),
  }))
  return {
    surface: all.filter(({ scope }) => scope === 'surface'),
    tooth: all.filter(({ scope }) => scope === 'tooth'),
  }
})

const code = ref(codes.value.surface[0]?.code ?? codes.value.tooth[0]?.code ?? '')
const status = ref<FindingStatus>('existing')
/** Surfaces chosen on the diagram for the next surface finding. */
const ownChoice = ref<ToothSurface[]>([])
/** Chosen surfaces: controlled through `selectedSurfaces`, or kept by the panel. */
const chosen = computed<ToothSurface[]>({
  get: () => props.selectedSurfaces ?? ownChoice.value,
  set: (surfaces) => {
    ownChoice.value = surfaces
    emit('update:selectedSurfaces', surfaces)
  },
})

// A new tooth starts without chosen surfaces; when bound, the app owns them.
watch(
  () => props.toothId,
  () => {
    ownChoice.value = []
  },
)

const isSurfaceCode = computed(() => codes.value.surface.some((option) => option.code === code.value))
const canAdd = computed(
  () => !props.disabled && Boolean(code.value) && (!isSurfaceCode.value || (chosen.value.length > 0 && !absent.value)),
)

function toggleChosen(surface: ToothSurface): void {
  chosen.value = chosen.value.includes(surface)
    ? chosen.value.filter((item) => item !== surface)
    : toothSurfaces.filter((item) => item === surface || chosen.value.includes(item))
}

function add(): void {
  if (!canAdd.value) {
    return
  }

  emit('add-finding', {
    code: code.value,
    toothId: props.toothId,
    ...(isSurfaceCode.value ? { surfaces: [...chosen.value] } : {}),
    ...(status.value === 'existing' ? {} : { status: status.value }),
  })
  chosen.value = []
}

function remove(entry: ToothFindingEntry, surface?: ToothSurface): void {
  if (!props.disabled) {
    emit('remove-finding', { index: entry.index, toothId: props.toothId, ...(surface ? { surface } : {}) })
  }
}
</script>

<template>
  <section
    class="odontogram-inspector"
    :aria-label="`${text.inspector.title}, ${text.tooth} ${spokenNumber}`"
    :data-tooth-id="toothId"
  >
    <div class="odontogram-inspector__header">
      <strong class="odontogram-inspector__title">{{ text.tooth }} {{ number }}</strong>
      <span class="odontogram-inspector__type">{{ type }}</span>
      <span v-if="state !== 'present'" class="odontogram-inspector__state" :data-state="state">
        {{ text.states[state] }}
      </span>
    </div>

    <div class="odontogram-inspector__body">
      <SurfaceGuide
        class="odontogram-inspector__guide"
        :tooth-id="toothId"
        :findings="findings"
        :finding-catalog="findingCatalog"
        :selected="chosen"
        :labels="labels"
        :notation="notation"
        :shape="shape"
        :disabled="disabled || absent"
        :show-list="false"
        @surface-click="toggleChosen"
      />

      <div class="odontogram-inspector__details">
        <div class="odontogram-inspector__section">
          <p class="odontogram-inspector__heading">{{ text.inspector.surfaceFindings }}</p>
          <ul v-if="surfaceGroups.length" class="odontogram-inspector__list">
            <li v-for="group in surfaceGroups" :key="group.surface" :data-inspector-surface="group.surface">
              <span class="odontogram-inspector__badge" aria-hidden="true">{{ group.letter }}</span>
              <span class="odontogram-inspector__surface-name">{{ group.name }}</span>
              <span class="odontogram-inspector__entries">
                <span v-for="entry in group.entries" :key="entry.index" class="odontogram-inspector__entry">
                  {{ describe(entry) }}
                  <button
                    v-if="!disabled"
                    type="button"
                    class="odontogram-inspector__remove"
                    :aria-label="`${text.inspector.remove}: ${describe(entry)}, ${group.name}`"
                    @click="remove(entry, group.surface)"
                  >
                    ×
                  </button>
                </span>
              </span>
            </li>
          </ul>
          <p v-else class="odontogram-inspector__empty">{{ text.inspector.noFindings }}</p>
        </div>

        <div class="odontogram-inspector__section">
          <p class="odontogram-inspector__heading">{{ text.inspector.toothFindings }}</p>
          <ul v-if="record.tooth.length" class="odontogram-inspector__list">
            <li v-for="entry in record.tooth" :key="entry.index" data-inspector-tooth-finding>
              <span class="odontogram-inspector__entry">
                {{ describe(entry) }}
                <button
                  v-if="!disabled && removable(entry)"
                  type="button"
                  class="odontogram-inspector__remove"
                  :aria-label="`${text.inspector.remove}: ${describe(entry)}`"
                  @click="remove(entry)"
                >
                  ×
                </button>
              </span>
            </li>
          </ul>
          <p v-else class="odontogram-inspector__empty">{{ text.inspector.noFindings }}</p>
        </div>

        <form v-if="!disabled" class="odontogram-inspector__section odontogram-inspector__form" @submit.prevent="add">
          <p class="odontogram-inspector__heading">{{ text.inspector.addFinding }}</p>
          <label class="odontogram-inspector__field">
            {{ text.inspector.finding }}
            <select v-model="code" name="finding">
              <optgroup v-if="codes.surface.length" :label="text.inspector.onSurfaces">
                <option v-for="option in codes.surface" :key="option.code" :value="option.code">{{ option.name }}</option>
              </optgroup>
              <optgroup v-if="codes.tooth.length" :label="text.inspector.onTooth">
                <option v-for="option in codes.tooth" :key="option.code" :value="option.code">{{ option.name }}</option>
              </optgroup>
            </select>
          </label>
          <p v-if="isSurfaceCode" class="odontogram-inspector__hint" data-inspector-chosen>
            <template v-if="chosen.length">
              {{ chosen.map((surface) => text.surfaceNames[getSurfaceName(surface, toothId)]).join(', ') }}
            </template>
            <template v-else>{{ text.inspector.chooseSurfaces }}</template>
          </p>
          <fieldset class="odontogram-inspector__status">
            <legend>{{ text.inspector.status }}</legend>
            <label v-for="option in findingStatuses" :key="option">
              <input v-model="status" type="radio" name="status" :value="option" />
              {{ text.findingStatuses[option] }}
            </label>
          </fieldset>
          <button type="submit" class="odontogram-inspector__add" :disabled="!canAdd">{{ text.inspector.add }}</button>
        </form>
      </div>
    </div>
  </section>
</template>

<style>
.odontogram-inspector {
  display: grid;
  gap: 0.75rem;
  color: #1e293b;
  font-family: inherit;
  font-size: 0.875rem;
}

.odontogram-inspector__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.odontogram-inspector__title {
  font-size: 1rem;
}

.odontogram-inspector__type {
  color: #64748b;
}

.odontogram-inspector__state {
  padding: 0 0.4rem;
  border-radius: 999px;
  color: #b91c1c;
  background: #fee2e2;
}

/* Diagram next to the details when there is room, above them otherwise. */
.odontogram-inspector__body {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}

.odontogram-inspector__guide {
  flex: 0 0 9rem;
  grid-template-columns: 1fr;
}

.odontogram-inspector__details {
  flex: 1 1 14rem;
}

.odontogram-inspector__guide .odontogram-surface-guide__title {
  display: none;
}

.odontogram-inspector__details {
  display: grid;
  gap: 0.75rem;
}

.odontogram-inspector__section {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}

.odontogram-inspector__heading {
  margin: 0;
  font-weight: 700;
}

.odontogram-inspector__list {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.odontogram-inspector__list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.odontogram-inspector__badge {
  display: inline-grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  font-weight: 700;
  background: #e2e8f0;
}

.odontogram-inspector__surface-name {
  font-weight: 600;
}

.odontogram-inspector__entries {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.odontogram-inspector__entry {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.25rem 0.1rem 0.5rem;
  border-radius: 999px;
  background: #f1f5f9;
}

.odontogram-inspector .odontogram-inspector__remove {
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #475569;
  font: inherit;
  line-height: 1;
  background: transparent;
  cursor: pointer;
}

.odontogram-inspector .odontogram-inspector__remove:hover,
.odontogram-inspector .odontogram-inspector__remove:focus-visible {
  color: #fff;
  background: #dc2626;
}

.odontogram-inspector__empty,
.odontogram-inspector__hint {
  margin: 0;
  color: #64748b;
}

.odontogram-inspector__field {
  display: grid;
  gap: 0.25rem;
}

.odontogram-inspector__status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.odontogram-inspector__status legend {
  padding: 0;
  margin-bottom: 0.25rem;
}

.odontogram-inspector .odontogram-inspector__add {
  justify-self: start;
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--odontogram-surface-selected-color, #6366f1);
  border-radius: 0.375rem;
  color: #fff;
  font: inherit;
  background: var(--odontogram-surface-selected-color, #6366f1);
  cursor: pointer;
}

.odontogram-inspector .odontogram-inspector__add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
