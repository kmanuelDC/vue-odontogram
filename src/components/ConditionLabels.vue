<script setup lang="ts">
import type { FindingStatus, FindingTone } from '../types/findings'
import type { ToothState, ToothVisualCondition } from '../types/odontogram'
import type { FindingPrimitive } from '../utils/findings'
import FindingPrimitives from './FindingPrimitives.vue'

withDefaults(
  defineProps<{
    conditions?: ToothVisualCondition[]
    /** Non-present tooth states to explain, each with its display name. */
    states?: { state: Exclude<ToothState, 'present'>; label: string }[]
    /** Findings to explain, each with its icon. */
    findings?: {
      key: string
      code: string
      name: string
      status: FindingStatus
      tone: FindingTone
      color?: string
      icon: FindingPrimitive[]
    }[]
    ariaLabel?: string
  }>(),
  {
    conditions: undefined,
    states: () => [],
    findings: () => [],
    ariaLabel: 'Tooth condition legend',
  },
)
</script>

<template>
  <ul
    v-if="conditions?.length || states.length || findings.length"
    class="odontogram-condition-labels"
    :aria-label="ariaLabel"
  >
    <li
      v-for="(condition, index) in conditions"
      :key="`${index}-${condition.label}`"
      class="odontogram-condition-labels__item"
    >
      <span
        aria-hidden="true"
        class="odontogram-condition-labels__swatch"
        :style="{
          background: condition.fillColor,
          borderColor: condition.outlineColor ?? condition.fillColor,
        }"
      />
      <span>{{ condition.label }}</span>
    </li>

    <li
      v-for="{ state, label } in states"
      :key="`state-${state}`"
      class="odontogram-condition-labels__item"
      :data-state="state"
    >
      <!-- Miniature of the mark drawn on the chart for this state. -->
      <svg
        aria-hidden="true"
        class="odontogram-condition-labels__icon"
        viewBox="0 0 16 16"
        fill="none"
      >
        <rect
          class="odontogram-condition-labels__icon-tooth"
          :class="`odontogram-condition-labels__icon-tooth--${state}`"
          x="2"
          y="2"
          width="12"
          height="12"
          rx="4"
          :stroke-dasharray="state === 'missing' || state === 'extracted' ? '2.5 2' : undefined"
        />
        <g v-if="state === 'extracted'" class="odontogram-state-mark--cross">
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </g>
        <g v-else-if="state === 'implant'" class="odontogram-state-mark--implant">
          <rect x="6.5" y="4" width="3" height="8" />
          <line x1="5.5" y1="6" x2="10.5" y2="6" />
          <line x1="5.5" y1="8" x2="10.5" y2="8" />
          <line x1="5.5" y1="10" x2="10.5" y2="10" />
        </g>
      </svg>
      <span>{{ label }}</span>
    </li>

    <li
      v-for="finding in findings"
      :key="finding.key"
      class="odontogram-condition-labels__item"
      :data-finding="finding.code"
      :data-status="finding.status"
      :data-tone="finding.tone"
    >
      <svg
        aria-hidden="true"
        class="odontogram-condition-labels__icon odontogram-finding"
        :class="[`odontogram-finding--${finding.tone}`, `odontogram-finding--${finding.status}`]"
        :style="finding.color ? { color: finding.color } : undefined"
        viewBox="0 0 16 16"
        fill="none"
        stroke-width="1.4"
      >
        <FindingPrimitives :primitives="finding.icon" />
      </svg>
      <span>{{ finding.name }}</span>
    </li>
  </ul>
</template>

<style>
.odontogram-condition-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  font-family: sans-serif;
  font-size: 14px;
  list-style: none;
}

.odontogram-condition-labels__item {
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: capitalize;
}

/* State and finding names are shown as written (e.g. "Diente en clavija"). */
.odontogram-condition-labels__item[data-state],
.odontogram-condition-labels__item[data-finding] {
  text-transform: none;
}

.odontogram-condition-labels__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid;
  border-radius: 4px;
}

.odontogram-condition-labels__icon {
  width: 16px;
  height: 16px;
  overflow: visible;
}

.odontogram-condition-labels__icon-tooth {
  stroke: var(--odontogram-stroke-color, #8a98be);
  stroke-width: 1.5;
}

.odontogram-condition-labels__icon line,
.odontogram-condition-labels__icon .odontogram-state-mark--implant rect {
  stroke-width: 1.5;
}

.odontogram-condition-labels__icon-tooth--missing,
.odontogram-condition-labels__icon-tooth--extracted {
  opacity: var(--odontogram-absent-opacity, 0.55);
}

.odontogram-condition-labels__icon-tooth--unerupted {
  opacity: var(--odontogram-unerupted-opacity, 0.45);
}
</style>
