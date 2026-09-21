<script setup lang="ts">
import { computed, ref } from 'vue'
import Odontogram from '../../src/components/Odontogram.vue'
import type { OdontogramLayout } from '../../src/utils/layout'

type PlaygroundDentition = 'permanent' | 'primary'

const dentition = ref<PlaygroundDentition>('permanent')
const selectedTeeth = ref<string[]>([])
const layout = ref<OdontogramLayout>('arch')
const singleSelect = ref(false)
const showLabels = ref(true)
const showTooltip = ref(true)

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
const conditions = computed(() =>
  dentition.value === 'primary' ? primaryConditions : permanentConditions,
)

function setDentition(value: PlaygroundDentition): void {
  dentition.value = value
  selectedTeeth.value = []
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
      <fieldset>
        <legend>Dentition</legend>
        <label>
          <input
            type="radio"
            name="dentition"
            :checked="dentition === 'permanent'"
            @change="setDentition('permanent')"
          />
          Permanent
        </label>
        <label>
          <input
            type="radio"
            name="dentition"
            :checked="dentition === 'primary'"
            @change="setDentition('primary')"
          />
          Primary
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

      <label><input v-model="showLabels" type="checkbox" /> Labels</label>
      <label><input v-model="showTooltip" type="checkbox" /> Tooltip</label>
    </section>

    <section class="playground__chart" aria-live="polite">
      <Odontogram
        v-model="selectedTeeth"
        :dentition="dentition"
        :layout="layout"
        :single-select="singleSelect"
        :show-labels="showLabels"
        :show-tooltip="showTooltip"
        :conditions="conditions"
      />
    </section>

    <section class="playground__output">
      <h2>Selected {{ dentition }} teeth</h2>
      <pre>{{ JSON.stringify(selectedTeeth, null, 2) }}</pre>
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

.playground__eyebrow {
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.playground__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
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


