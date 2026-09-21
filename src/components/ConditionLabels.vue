<script setup lang="ts">
import type { ToothVisualCondition } from './OdontogramTooltip.vue'

defineProps<{
  conditions?: ToothVisualCondition[]
}>()
</script>

<template>
  <ul v-if="conditions?.length" class="odontogram-condition-labels" aria-label="Tooth condition legend">
    <li v-for="condition in conditions" :key="condition.label" class="odontogram-condition-labels__item">
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

.odontogram-condition-labels__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid;
  border-radius: 4px;
}
</style>
