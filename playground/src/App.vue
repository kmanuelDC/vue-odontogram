<script setup lang="ts">
import { computed, ref } from 'vue'
import Odontogram from '../../src/components/Odontogram.vue'
import type { OdontogramFinding } from '../../src/types/findings'
import type { OdontogramHalf, OdontogramToothStates, ToothNotation } from '../../src/types/odontogram'
import type { OdontogramSurfaces } from '../../src/types/surfaces'
import type { OdontogramLayout } from '../../src/utils/layout'

type PlaygroundDentition = 'permanent' | 'primary' | 'mixed'

// Optional initial state from the URL, e.g. ?dentition=primary&layout=horizontal&anchors
const query = new URLSearchParams(window.location.search)

const dentitions: PlaygroundDentition[] = ['permanent', 'primary', 'mixed']
const dentition = ref<PlaygroundDentition>(
  dentitions.find((item) => item === query.get('dentition')) ?? 'permanent',
)

/**
 * Mixed dentition of an eight-year-old: permanent first molars and incisors,
 * primary canines and molars. Without it, a mixed chart shows all 52 teeth.
 */
const mixedExample = [
  '16', '12', '11', '21', '22', '26', '36', '32', '31', '41', '42', '46',
  '55', '54', '53', '63', '64', '65', '75', '74', '73', '83', '84', '85',
]
const useMixedExample = ref(query.has('age8'))
const teeth = computed(() =>
  dentition.value === 'mixed' && useMixedExample.value ? mixedExample : undefined,
)
const selectedTeeth = ref<string[]>([])
const layout = ref<OdontogramLayout>(query.get('layout') === 'horizontal' ? 'horizontal' : 'arch')
const notations: ToothNotation[] = ['FDI', 'Universal', 'Palmer']
const notation = ref<ToothNotation>(
  notations.find((item) => item.toLowerCase() === query.get('notation')?.toLowerCase()) ?? 'FDI',
)
const singleSelect = ref(false)
const showLabels = ref(true)
const showTooltip = ref(true)
const showAnchors = ref(query.has('anchors'))
const showNumbers = ref(query.has('numbers'))
const showStates = ref(query.has('states'))
const showFindings = ref(query.has('findings'))
const showSurfaces = ref(query.has('surfaces'))
const selectedSurfaces = ref<OdontogramSurfaces>(
  query.has('surfaces') ? { 11: ['vestibular', 'mesial'], 16: ['occlusal'], 36: ['distal', 'lingual'], 51: ['occlusal'] } : {},
)

const permanentFindings: OdontogramFinding[] = [
  { code: 'fracture', teeth: ['11'] },
  { code: 'diastema', teeth: ['11', '21'] },
  { code: 'crown', teeth: ['21'] },
  { code: 'temporary-crown', teeth: ['22'] },
  { code: 'rotated', teeth: ['13'] },
  { code: 'peg', teeth: ['23'] },
  { code: 'migrated', teeth: ['24'], direction: 'distal' },
  { code: 'root-remnant', teeth: ['15'] },
  { code: 'pulp-treatment', teeth: ['16'] },
  { code: 'extruded', teeth: ['17'] },
  { code: 'intruded', teeth: ['27'] },
  { code: 'fixed-prosthesis', teeth: ['45', '47'] },
  { code: 'fixed-orthodontic-appliance', teeth: ['42', '32'] },
  { code: 'mobility', teeth: ['33'], label: 'M2' },
  { code: 'transposition', teeth: ['34', '35'] },
  { code: 'erupting', teeth: ['38'] },
  { code: 'supernumerary', teeth: ['43'] },
  { code: 'fusion', teeth: ['44'] },
  { code: 'extraction', teeth: ['28'], status: 'planned' },
  { code: 'extraction', teeth: ['48'], status: 'done' },
  { code: 'caries', teeth: ['26'], surfaces: ['occlusal', 'distal'] },
  { code: 'caries', teeth: ['36'], surfaces: ['mesial'] },
  { code: 'restoration', teeth: ['36'], surfaces: ['occlusal'], status: 'planned' },
  { code: 'restoration', teeth: ['37'], surfaces: ['occlusal', 'vestibular'] },
  { code: 'temporary-restoration', teeth: ['46'], surfaces: ['occlusal'] },
  { code: 'restoration', teeth: ['14'], surfaces: ['distal'], color: '#7c3aed' },
]

const primaryFindings: OdontogramFinding[] = [
  { code: 'fracture', teeth: ['51'] },
  { code: 'diastema', teeth: ['51', '61'] },
  { code: 'crown', teeth: ['64'] },
  { code: 'rotated', teeth: ['52'] },
  { code: 'root-remnant', teeth: ['75'] },
  { code: 'erupting', teeth: ['85'] },
  { code: 'mobility', teeth: ['71'], label: 'M1' },
  { code: 'caries', teeth: ['54', '84'], surfaces: ['occlusal'] },
  { code: 'restoration', teeth: ['74'], surfaces: ['mesial', 'occlusal'], status: 'planned' },
]

/** Picks the permanent or primary example, or both for a mixed chart. */
function forDentition<T>(permanent: T[], primary: T[]): T[] {
  const byDentition = { permanent, primary, mixed: [...permanent, ...primary] }
  return byDentition[dentition.value]
}

const findings = computed(() =>
  showFindings.value ? forDentition(permanentFindings, primaryFindings) : undefined,
)

const permanentStates: OdontogramToothStates = {
  18: 'extracted',
  28: 'missing',
  36: 'implant',
  46: 'extracted',
  38: 'unerupted',
  48: 'unerupted',
}

const primaryStates: OdontogramToothStates = {
  55: 'extracted',
  64: 'missing',
  85: 'unerupted',
}

const toothStates = computed(() => {
  if (!showStates.value) {
    return undefined
  }
  const byDentition = {
    permanent: permanentStates,
    primary: primaryStates,
    mixed: { ...permanentStates, ...primaryStates },
  }
  return byDentition[dentition.value]
})
const showHalf = ref<OdontogramHalf>(
  query.get('half') === 'upper' || query.get('half') === 'lower'
    ? (query.get('half') as OdontogramHalf)
    : 'full',
)

const permanentConditions = [
  {
    label: 'Observation',
    teeth: ['16', '26'],
    fillColor: '#fbbf24',
    outlineColor: '#b45309',
  },
]

const primaryConditions = [
  {
    label: 'Observation',
    teeth: ['51', '65'],
    fillColor: '#fbbf24',
    outlineColor: '#b45309',
  },
]

const primaryExample = ['51', '52', '65']
const conditions = computed(() => forDentition(permanentConditions, primaryConditions))

function setDentition(value: PlaygroundDentition): void {
  dentition.value = value
  selectedTeeth.value = []
  selectedSurfaces.value = {}
}

function loadPrimaryExample(): void {
  selectedTeeth.value = [...primaryExample]
}
</script>

<template>
  <main class="playground">
    <header>
      <p class="playground__eyebrow">Development playground</p>
      <h1>vue-odontogram</h1>
      <p>Interactive validation for the public component API.</p>
    </header>

    <section class="playground__controls" aria-label="Odontogram controls">
      <div class="playground__controls-row">
        <fieldset>
          <legend>Dentition</legend>
          <label v-for="item in dentitions" :key="item">
            <input
              type="radio"
              name="dentition"
              :checked="dentition === item"
              @change="setDentition(item)"
            />
            {{ item[0].toUpperCase() + item.slice(1) }}
          </label>
        </fieldset>

        <fieldset>
          <legend>Layout</legend>
          <label>
            <input v-model="layout" type="radio" value="arch" />
            Arch
          </label>
          <label>
            <input v-model="layout" type="radio" value="horizontal" />
            Horizontal
          </label>
        </fieldset>

        <fieldset>
          <legend>Notation</legend>
          <label v-for="item in notations" :key="item">
            <input v-model="notation" type="radio" :value="item" />
            {{ item }}
          </label>
        </fieldset>

        <fieldset>
          <legend>Selection</legend>
          <label>
            <input v-model="singleSelect" type="radio" :value="true" />
            Single
          </label>
          <label>
            <input v-model="singleSelect" type="radio" :value="false" />
            Multiple
          </label>
        </fieldset>

        <fieldset>
          <legend>Arches</legend>
          <label><input v-model="showHalf" type="radio" value="full" /> Full</label>
          <label><input v-model="showHalf" type="radio" value="upper" /> Upper</label>
          <label><input v-model="showHalf" type="radio" value="lower" /> Lower</label>
        </fieldset>
      </div>

      <div class="playground__controls-row">
        <label><input v-model="showNumbers" type="checkbox" /> Numbers</label>
        <label><input v-model="showStates" type="checkbox" /> States</label>
        <label><input v-model="showFindings" type="checkbox" /> Findings</label>
        <label><input v-model="showSurfaces" type="checkbox" /> Surfaces</label>
        <label><input v-model="showLabels" type="checkbox" /> Labels</label>
        <label><input v-model="showTooltip" type="checkbox" /> Tooltip</label>
        <label><input v-model="showAnchors" type="checkbox" /> Anchors</label>
        <label v-if="dentition === 'mixed'">
          <input v-model="useMixedExample" type="checkbox" /> Mixed: age 8 example
        </label>
      </div>
    </section>

    <section class="playground__chart" aria-live="polite">
      <Odontogram
        v-model="selectedTeeth"
        v-model:surfaces="selectedSurfaces"
        :dentition="dentition"
        :layout="layout"
        :notation="notation"
        :teeth="teeth"
        :single-select="singleSelect"
        :show-labels="showLabels"
        :show-tooltip="showTooltip"
        :conditions="conditions"
        :show-numbers="showNumbers"
        :show-half="showHalf"
        :tooth-states="toothStates"
        :findings="findings"
        :show-surfaces="showSurfaces"
      >
        <template v-if="showAnchors" #overlay="{ anchors }">
          <g v-for="anchor in anchors" :key="anchor.toothId" class="playground__anchor">
            <rect
              :x="anchor.box.x"
              :y="anchor.box.y"
              :width="anchor.box.width"
              :height="anchor.box.height"
            />
            <text :x="anchor.center.x" :y="anchor.center.y">{{ anchor.toothId }}</text>
          </g>
        </template>
      </Odontogram>
    </section>

    <section class="playground__output">
      <h2>Selected {{ dentition }} teeth</h2>
      <pre>{{ JSON.stringify(selectedTeeth, null, 2) }}</pre>
      <template v-if="showSurfaces">
        <h2>Selected surfaces</h2>
        <pre>{{ JSON.stringify(selectedSurfaces, null, 2) }}</pre>
      </template>
    </section>

    <aside class="playground__notice">
      <h2>Primary example</h2>
      <pre>{{ JSON.stringify(primaryExample, null, 2) }}</pre>
      <button type="button" :disabled="dentition !== 'primary'" @click="loadPrimaryExample">
        Load primary example
      </button>
      <p>
        Primary SVG geometry, including its Horizontal layout, is provisional
        and intended only for visual development. Both Arch and Horizontal are
        available for visual review.
      </p>
    </aside>
  </main>
</template>

<style>
:root {
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  color: #172554;
  background: #f8fafc;
}

body {
  margin: 0;
}

.playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1.5rem;
  max-width: 70rem;
  margin: 0 auto;
  padding: 2rem;
}

.playground header,
.playground__controls,
.playground__chart,
.playground__output,
.playground__notice {
  padding: 1.25rem;
  border: 1px solid #dbeafe;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 5%);
}

.playground header,
.playground__controls,
.playground__chart {
  grid-column: 1 / -1;
}

.playground h1,
.playground h2,
.playground p {
  margin-top: 0;
}

.playground__anchor rect {
  fill: none;
  stroke: #f43f5e;
  stroke-dasharray: 2 2;
  stroke-width: 0.75;
}

.playground__anchor text {
  fill: #be123c;
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
}

.playground__eyebrow {
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.playground__controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.playground__controls-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.playground__controls-row + .playground__controls-row {
  padding-top: 1rem;
  border-top: 1px solid #dbeafe;
}

.playground fieldset {
  display: flex;
  gap: 0.75rem;
  border: 0;
}

.playground pre {
  overflow: auto;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #eff6ff;
}

.playground button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #2563eb;
  border-radius: 0.375rem;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
}

.playground button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 42rem) {
  .playground {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
</style>


