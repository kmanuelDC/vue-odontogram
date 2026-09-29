<script setup lang="ts">
import type { FindingPrimitive } from '../utils/findings'

defineProps<{
  primitives: readonly FindingPrimitive[]
}>()
</script>

<template>
  <template v-for="(primitive, index) in primitives" :key="index">
    <path v-if="primitive.type === 'path'" class="odontogram-finding__stroke" :d="primitive.d" />
    <path v-else-if="primitive.type === 'area'" class="odontogram-finding__area" :d="primitive.d" />
    <circle
      v-else-if="primitive.type === 'circle'"
      class="odontogram-finding__stroke"
      :cx="primitive.cx"
      :cy="primitive.cy"
      :r="primitive.r"
    />
    <text
      v-else
      class="odontogram-finding__text"
      :x="primitive.x"
      :y="primitive.y"
      :font-size="primitive.fontSize"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {{ primitive.text }}
    </text>
  </template>
</template>
