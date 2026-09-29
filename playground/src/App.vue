<script setup lang="ts">
import { computed, ref } from 'vue'
import Odontogram from '../../src/components/Odontogram.vue'
import SurfaceGuide from '../../src/components/SurfaceGuide.vue'
import type { OdontogramLabelsInput } from '../../src/types/odontogram'
import type { SurfaceShapeKind, ToothSurface } from '../../src/types/surfaces'
import type { ToothAnchor } from '../../src/utils/anchors'
import type { SurfaceDiagram } from '../../src/utils/surfaces'
import { toggleSurface } from '../../src/utils/surfaces'
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
const selectedTeeth = ref<string[]>(query.get('select')?.split(',').filter(Boolean) ?? [])
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
const showSurfaceLetters = ref(query.has('letters'))
const showGuide = ref(query.has('guide'))
const showSurfacePath = ref(query.has('surfacepath'))
const surfaceShape = ref<SurfaceShapeKind>(query.get('shape') === 'circle' ? 'circle' : 'square')

/** Quadrants drawn on the patient's right side (the viewer's left). */
const rightQuadrants = new Set([1, 4, 5, 8])

/**
 * Debug path through the surface diagram centers of each row, in arch order
 * (right back to the midline, then to the left back), to spot jumps.
 */
function surfacePaths(
  diagrams: readonly SurfaceDiagram[],
  anchors: Readonly<Record<string, ToothAnchor>>,
): { row: string; d: string; points: { toothId: string; x: number; y: number }[] }[] {
  const rows = new Map<string, SurfaceDiagram[]>()
  for (const diagram of diagrams) {
    const row = anchors[diagram.toothId]?.row
    if (row) {
      rows.set(row, [...(rows.get(row) ?? []), diagram])
    }
  }

  const along = (toothId: string) => {
    const position = Number(toothId[1])
    return rightQuadrants.has(Number(toothId[0])) ? -position : position
  }

  const polyline = (points: { x: number; y: number }[]) =>
    points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')

  return [...rows].map(([row, rowDiagrams]) => {
    const sorted = [...rowDiagrams].sort((a, b) => along(a.toothId) - along(b.toothId))
    const points = sorted.map(({ toothId, center }) => ({ toothId, x: center.x, y: center.y }))
    // The same row through the tooth centers: the distribution of the teeth,
    // used as the reference the diagram path should follow.
    const teeth = sorted.map(({ toothId }) => ({ toothId, ...anchors[toothId].center }))
    return { row, points, d: polyline(points), teeth, teethD: polyline(teeth) }
  })
}
type PlaygroundLanguage = 'en' | 'es'
const language = ref<PlaygroundLanguage>(query.get('lang') === 'es' ? 'es' : 'en')

/** Spanish texts, with the surface definitions of the surface guide. */
const spanishLabels: OdontogramLabelsInput = {
  odontogram: 'Odontograma',
  tooth: 'Pieza',
  type: 'Tipo',
  selected: 'Seleccionada',
  yes: 'Sí',
  no: 'No',
  condition: 'Condición',
  findings: 'Hallazgos',
  findingStatuses: { existing: 'Existente', planned: 'Planificado', done: 'Realizado' },
  surfaces: 'Superficies dentales',
  surface: 'Superficie',
  surfaceGuide: 'Guía de superficies',
  surfaceNames: {
    vestibular: 'Vestibular',
    mesial: 'Mesial',
    occlusal: 'Oclusal',
    incisal: 'Incisal',
    distal: 'Distal',
    lingual: 'Lingual',
    palatal: 'Palatina',
  },
  surfaceDescriptions: {
    vestibular: 'Cara que mira hacia los labios o las mejillas (afuera).',
    mesial: 'Superficie que está más cerca de la línea media de la boca.',
    occlusal: 'Superficie de masticación de molares y premolares.',
    incisal: 'Borde filoso de corte de incisivos y caninos.',
    distal: 'Superficie que se aleja de la línea media de la boca.',
    lingual: 'Cara que mira hacia la lengua (dientes inferiores).',
    palatal: 'Cara que mira hacia el paladar (dientes superiores).',
  },
}
const labels = computed(() => (language.value === 'es' ? spanishLabels : undefined))

/** The guide follows the last selected tooth, or a molar of the dentition. */
const guideToothId = computed(
  () => selectedTeeth.value.at(-1) ?? (dentition.value === 'primary' ? '54' : '16'),
)

function toggleGuideSurface(surface: ToothSurface): void {
  selectedSurfaces.value = toggleSurface(selectedSurfaces.value, guideToothId.value, surface)
}
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
  // Two fills on one surface split it; an outline stays above a fill.
  { code: 'caries', teeth: ['37'], surfaces: ['occlusal'] },
  { code: 'caries', teeth: ['46'], surfaces: ['occlusal'] },
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

        <fieldset>
          <legend>Surface shape</legend>
          <label><input v-model="surfaceShape" type="radio" value="square" /> Square</label>
          <label><input v-model="surfaceShape" type="radio" value="circle" /> Circle</label>
        </fieldset>

        <fieldset>
          <legend>Language</legend>
          <label><input v-model="language" type="radio" value="en" /> English</label>
          <label><input v-model="language" type="radio" value="es" /> Español</label>
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
        <label><input v-model="showSurfaceLetters" type="checkbox" /> Surface letters</label>
        <label><input v-model="showGuide" type="checkbox" /> Guide</label>
        <label><input v-model="showSurfacePath" type="checkbox" /> Surface path</label>
        <label v-if="dentition === 'mixed'">
          <input v-model="useMixedExample" type="checkbox" /> Mixed: age 8 example
        </label>
      </div>
    </section>

    <section
      class="playground__chart"
      :class="{ 'playground__chart--with-guide': showGuide && layout === 'arch' }"
      aria-live="polite"
    >
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
        :show-surface-letters="showSurfaceLetters"
        :surface-shape="surfaceShape"
        :labels="labels"
      >
        <template v-if="showAnchors || showSurfacePath" #overlay="{ anchors, surfaceDiagrams }">
          <template v-if="showAnchors">
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
          <template v-if="showSurfacePath">
            <g
              v-for="path in surfacePaths(surfaceDiagrams, anchors)"
              :key="path.row"
              class="playground__surface-path"
              :data-row="path.row"
            >
              <path class="playground__tooth-path" :d="path.teethD" />
              <circle
                v-for="point in path.teeth"
                :key="`tooth-${point.toothId}`"
                class="playground__tooth-path"
                :cx="point.x"
                :cy="point.y"
                r="1.6"
              />
              <path :d="path.d" />
              <circle v-for="point in path.points" :key="point.toothId" :cx="point.x" :cy="point.y" r="1.6" />
            </g>
          </template>
        </template>
      </Odontogram>

      <SurfaceGuide
        v-if="showGuide"
        class="playground__guide"
        :class="layout === 'arch' ? 'playground__guide--side' : 'playground__guide--below'"
        :tooth-id="guideToothId"
        :findings="findings"
        :selected="selectedSurfaces[guideToothId]"
        :notation="notation"
        :labels="labels"
        :shape="surfaceShape"
        @surface-click="toggleGuideSurface"
      />
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

.playground__chart--with-guide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: 1.5rem;
  align-items: start;
}

/* Arch: a side column next to the chart, diagram above its details. */
.playground__guide--side {
  position: sticky;
  top: 1rem;
  grid-template-columns: 1fr;
}

/* Horizontal: below the chart, diagram on the left and details on the right. */
.playground__guide--below {
  grid-template-columns: 10rem minmax(0, 1fr);
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dbeafe;
}

@media (max-width: 36rem) {
  .playground__guide--below {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 56rem) {
  .playground__chart--with-guide {
    grid-template-columns: 1fr;
  }
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

.playground__surface-path path {
  fill: none;
  stroke: #f43f5e;
  stroke-width: 1.2;
  stroke-linejoin: round;
}

.playground__surface-path circle {
  fill: #f43f5e;
}

/* Reference: the same row through the tooth centers. */
.playground__surface-path path.playground__tooth-path {
  stroke: #0ea5e9;
  stroke-dasharray: 4 3;
}

.playground__surface-path circle.playground__tooth-path {
  fill: #0ea5e9;
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


