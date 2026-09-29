<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useOdontogram } from '../composables/useOdontogram'
import { useToothSelection } from '../composables/useToothSelection'
import type {
  OdontogramCondition,
  OdontogramHalf,
  OdontogramLabelsInput,
  OdontogramToothStates,
  ToothDefinition,
  ToothNotation,
  ToothState,
  ToothVisualCondition,
} from '../types/odontogram'
import { toothStates as allToothStates } from '../types/odontogram'
import type { Box, ToothAnchor } from '../utils/anchors'
import type { RenderableDentition } from '../utils/dentition-layout'
import { resolveOdontogramLabels } from '../utils/labels'
import type { OdontogramLayout } from '../utils/layout'
import { findNavigationTarget, type ToothNavigationKey } from '../utils/navigation'
import { getToothStateMarks, resolveToothState } from '../utils/state-marks'
import { ntsPeruFindingCatalog } from '../catalogs/nts-peru'
import type { FindingCatalog, OdontogramFinding } from '../types/findings'
import { getFindingIcon } from '../utils/findings'
import type { OdontogramSurfaces, ToothSurface } from '../types/surfaces'
import { getSurfaceName, toggleSurface } from '../utils/surfaces'
import { formatToothNumber } from '../utils/notation'
import { absentToothStates } from '../utils/state-marks'
import ConditionLabels from './ConditionLabels.vue'
import FindingPrimitives from './FindingPrimitives.vue'
import OdontogramTooltip, { type TooltipAnchorRect } from './OdontogramTooltip.vue'
import SurfaceDiagrams from './SurfaceDiagrams.vue'
import Tooth from './Tooth.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    dentition?: RenderableDentition
    notation?: ToothNotation
    singleSelect?: boolean
    disabled?: boolean
    showLabels?: boolean
    showTooltip?: boolean
    conditions?: OdontogramCondition[]
    layout?: OdontogramLayout
    labels?: OdontogramLabelsInput
    showNumbers?: boolean
    showHalf?: OdontogramHalf
    toothStates?: OdontogramToothStates
    findings?: OdontogramFinding[]
    findingCatalog?: FindingCatalog
    showSurfaces?: boolean
    surfaces?: OdontogramSurfaces
    teeth?: string[]
  }>(),
  {
    modelValue: () => [],
    dentition: 'permanent',
    notation: 'FDI',
    singleSelect: false,
    disabled: false,
    showLabels: false,
    showTooltip: true,
    conditions: undefined,
    layout: 'arch',
    labels: undefined,
    showNumbers: false,
    showHalf: 'full',
    toothStates: undefined,
    findings: undefined,
    findingCatalog: () => ntsPeruFindingCatalog,
    showSurfaces: false,
    surfaces: () => ({}),
    teeth: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [selectedTeeth: string[]]
  change: [selectedTeeth: string[]]
  'tooth-click': [tooth: ToothDefinition, selectedTeeth: string[]]
  'update:surfaces': [surfaces: OdontogramSurfaces]
  'surface-click': [tooth: ToothDefinition, surface: ToothSurface, surfaces: OdontogramSurfaces]
}>()

defineSlots<{
  tooltip?: (props: {
    tooth: ToothDefinition
    selected: boolean
    condition?: ToothVisualCondition
    state: ToothState
    /** Names of the findings on the tooth. */
    findings: readonly string[]
    /** Tooth number in the chart's notation; `tooth.id` stays FDI. */
    number: string
  }) => unknown
  /** SVG content drawn above the teeth, in the layout's viewBox coordinates. */
  overlay?: (props: {
    anchors: Readonly<Record<string, ToothAnchor>>
    viewBox: Box
    dentition: RenderableDentition
    layout: OdontogramLayout
  }) => unknown
}>()

const {
  viewBox,
  viewBoxRect,
  quadrants,
  anchors,
  anchorList,
  numberLabels,
  surfaceDiagrams,
  findingLayout,
  findingsByTooth,
  conditionByTooth,
} = useOdontogram({
  dentition: () => props.dentition,
  layout: () => props.layout,
  notation: () => props.notation,
  conditions: () => props.conditions,
  showHalf: () => props.showHalf,
  showNumbers: () => props.showNumbers,
  findings: () => props.findings,
  findingCatalog: () => props.findingCatalog,
  showSurfaces: () => props.showSurfaces,
  teeth: () => props.teeth,
})

/**
 * Descriptions of the findings on a tooth, without repetitions, e.g.
 * "Caries (Occlusal, Mesial)" or "Extraction (Planned)".
 */
function findingNamesOf(toothId: string): string[] {
  const { surfaceNames, findingStatuses } = resolvedLabels.value
  const describe = ({ name, surfaces, status }: (typeof findingLayout.value.findings)[number]) => {
    const details = [
      ...(surfaces ?? []).map((surface) => surfaceNames[getSurfaceName(surface, toothId)]),
      ...(status === 'existing' ? [] : [findingStatuses[status]]),
    ]
    return details.length ? `${name} (${details.join(', ')})` : name
  }

  return [...new Set((findingsByTooth.value.get(toothId) ?? []).map(describe))]
}

/** One legend entry per finding code, status and color on the visible teeth. */
const legendFindings = computed(() => {
  const entries = new Map<string, (typeof findingLayout.value.findings)[number]>()
  for (const finding of findingLayout.value.findings) {
    const key = [finding.code, finding.status, finding.tone, finding.color ?? ''].join(':')
    entries.set(key, entries.get(key) ?? finding)
  }

  return [...entries.entries()].map(([key, { code, name, status, tone, color }]) => ({
    key,
    code,
    name: status === 'existing' ? name : `${name} (${resolvedLabels.value.findingStatuses[status]})`,
    status,
    tone,
    color,
    icon: getFindingIcon(props.findingCatalog[code].symbol),
  }))
})

function stateOf(toothId: string): ToothState {
  return resolveToothState(props.toothStates, toothId)
}

/** Tooth number as shown, in the chart's notation. */
function numberOf(toothId: string): string {
  return formatToothNumber(toothId, props.notation)
}

/** Tooth number as read aloud: Palmer uses `UR1` instead of box-drawing corners. */
function spokenNumberOf(toothId: string): string {
  return formatToothNumber(toothId, props.notation, 'text')
}

/** Missing and extracted teeth have no surfaces to select. */
const inactiveSurfaceTeeth = computed(
  () => new Set(anchorList.value.filter(({ toothId }) => absentToothStates.has(stateOf(toothId))).map(({ toothId }) => toothId)),
)

const toothById = computed(
  () => new Map(quadrants.value.flatMap(({ teeth }) => teeth.map(({ tooth }) => [tooth.id, tooth] as const))),
)

function handleSurfaceToggle(toothId: string, surface: ToothSurface): void {
  const surfaces = toggleSurface(props.surfaces, toothId, surface)

  emit('update:surfaces', surfaces)
  emit('surface-click', toothById.value.get(toothId)!, surface, surfaces)
}

const stateMarks = computed(() => getToothStateMarks(anchorList.value, props.toothStates))

/** Non-present states shown on the visible teeth, in a stable order. */
const legendStates = computed(() => {
  const used = new Set(anchorList.value.map(({ toothId }) => stateOf(toothId)))

  return allToothStates
    .filter((state): state is Exclude<ToothState, 'present'> => state !== 'present' && used.has(state))
    .map((state) => ({ state, label: resolvedLabels.value.states[state] }))
})

const svgElement = ref<SVGSVGElement | null>(null)
const activeToothId = ref<string>()

/**
 * The single tooth reachable with Tab: the last focused one, else the first
 * selected visible tooth, else the first tooth rendered.
 */
const focusableToothId = computed(() => {
  const visible = anchors.value

  if (activeToothId.value && visible[activeToothId.value]) {
    return activeToothId.value
  }

  return props.modelValue.find((id) => visible[id]) ?? anchorList.value[0]?.toothId
})

function handleFocus(tooth: ToothDefinition, event: FocusEvent): void {
  activeToothId.value = tooth.id
  showToothTooltip(tooth, event)
}

async function handleNavigate(tooth: ToothDefinition, key: ToothNavigationKey): Promise<void> {
  const targetId = findNavigationTarget(anchorList.value, tooth.id, key)
  if (!targetId) {
    return
  }

  activeToothId.value = targetId
  await nextTick()
  svgElement.value
    ?.querySelector<SVGElement>(`[data-tooth-id="${targetId}"]`)
    ?.focus()
}

const resolvedLabels = computed(() => resolveOdontogramLabels(props.labels))
const chartTitle = computed(() => resolvedLabels.value.chartTitles[props.dentition])

const hoveredTooth = ref<ToothDefinition>()
const hoveredAnchorRect = ref<TooltipAnchorRect>()

const { isSelected, toggle } = useToothSelection({
  modelValue: () => props.modelValue,
  singleSelect: () => props.singleSelect,
})

/** Shows the tooltip for a tooth that is hovered or focused. */
function showToothTooltip(tooth: ToothDefinition, event: Event): void {
  const target = event.currentTarget
  if (!(target instanceof SVGElement)) {
    return
  }

  const rect = target.getBoundingClientRect()
  hoveredTooth.value = tooth
  hoveredAnchorRect.value = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

function hideToothTooltip(): void {
  hoveredTooth.value = undefined
  hoveredAnchorRect.value = undefined
}

function handleSelect(tooth: ToothDefinition): void {
  const selectedTeeth = toggle(tooth.id)

  emit('update:modelValue', selectedTeeth)
  emit('change', selectedTeeth)
  emit('tooth-click', tooth, selectedTeeth)
}
</script>

<template>
  <div
    class="odontogram"
    role="listbox"
    :aria-label="resolvedLabels.odontogram"
    :aria-multiselectable="!singleSelect"
    :aria-disabled="disabled"
  >
    <svg
      ref="svgElement"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      :viewBox="viewBox"
      class="odontogram__svg"
      :aria-label="chartTitle"
    >
      <title>{{ chartTitle }}</title>

      <g
        v-for="quadrant in quadrants"
        :key="quadrant.quadrant"
        :transform="quadrant.transform"
      >
        <Tooth
          v-for="{ tooth, transform } in quadrant.teeth"
          :key="tooth.id"
          :tooth="tooth"
          :selected="isSelected(tooth.id)"
          :disabled="disabled"
          :condition="conditionByTooth.get(tooth.id)"
          :layout-transform="transform"
          :label="resolvedLabels.tooth"
          :focusable="tooth.id === focusableToothId"
          :state="stateOf(tooth.id)"
          :state-label="resolvedLabels.states[stateOf(tooth.id)]"
          :description="findingNamesOf(tooth.id).join(', ') || undefined"
          :number="numberOf(tooth.id)"
          :spoken-number="spokenNumberOf(tooth.id)"
          @select="handleSelect"
          @mouseenter="showToothTooltip"
          @mouseleave="hideToothTooltip"
          @focus="handleFocus"
          @blur="hideToothTooltip"
          @navigate="handleNavigate"
        />
      </g>

      <g v-if="stateMarks.length" class="odontogram__state-marks" aria-hidden="true">
        <template v-for="mark in stateMarks" :key="mark.toothId">
          <g
            v-if="mark.kind === 'cross'"
            class="odontogram-state-mark--cross"
            :data-mark-for="mark.toothId"
            :stroke-width="mark.strokeWidth"
          >
            <line v-for="(line, index) in mark.lines" :key="index" v-bind="line" />
          </g>
          <g
            v-else
            class="odontogram-state-mark--implant"
            :data-mark-for="mark.toothId"
            :stroke-width="mark.strokeWidth"
          >
            <rect
              :x="mark.body.x"
              :y="mark.body.y"
              :width="mark.body.width"
              :height="mark.body.height"
              :rx="mark.body.width / 4"
            />
            <line v-for="(line, index) in mark.threads" :key="index" v-bind="line" />
          </g>
        </template>
      </g>

      <SurfaceDiagrams
        v-if="surfaceDiagrams.length"
        :diagrams="surfaceDiagrams"
        :anchors="anchorList"
        :surfaces="surfaces"
        :disabled="disabled"
        :inactive-teeth="inactiveSurfaceTeeth"
        :labels="resolvedLabels"
        :spoken-number="spokenNumberOf"
        @toggle="handleSurfaceToggle"
      />

      <g v-if="findingLayout.findings.length" class="odontogram__findings" aria-hidden="true">
        <g
          v-for="finding in findingLayout.findings"
          :key="finding.key"
          class="odontogram-finding"
          :class="[`odontogram-finding--${finding.tone}`, `odontogram-finding--${finding.status}`]"
          :style="finding.color ? { color: finding.color } : undefined"
          :data-finding="finding.code"
          :data-status="finding.status"
          :data-teeth="finding.teeth.join(' ')"
          :stroke-width="finding.strokeWidth"
          :stroke-dasharray="
            finding.status === 'planned' ? `${finding.strokeWidth * 2} ${finding.strokeWidth * 1.6}` : undefined
          "
        >
          <FindingPrimitives :primitives="finding.primitives" />
        </g>
      </g>

      <g v-if="numberLabels.length" class="odontogram__numbers" aria-hidden="true">
        <template v-for="label in numberLabels" :key="label.toothId">
          <text
            class="odontogram__number"
            :class="{ 'odontogram__number--selected': isSelected(label.toothId) }"
            :data-number-for="label.toothId"
            :x="label.x"
            :y="label.y"
            :font-size="label.fontSize"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ label.text }}
          </text>
          <path
            v-if="label.corner"
            class="odontogram__number-corner"
            :class="{ 'odontogram__number-corner--selected': isSelected(label.toothId) }"
            :data-corner-for="label.toothId"
            :d="label.corner"
            :stroke-width="label.fontSize * 0.08"
          />
        </template>
      </g>

      <g v-if="$slots.overlay" class="odontogram__overlay">
        <slot
          name="overlay"
          :anchors="anchors"
          :viewBox="viewBoxRect"
          :dentition="dentition"
          :layout="layout"
        />
      </g>
    </svg>

    <OdontogramTooltip
      v-if="showTooltip"
      :active="Boolean(hoveredTooth)"
      :tooth="hoveredTooth"
      :selected="hoveredTooth ? isSelected(hoveredTooth.id) : false"
      :condition="hoveredTooth ? conditionByTooth.get(hoveredTooth.id) : undefined"
      :state="hoveredTooth ? stateOf(hoveredTooth.id) : 'present'"
      :findings="hoveredTooth ? findingNamesOf(hoveredTooth.id) : []"
      :number="hoveredTooth ? numberOf(hoveredTooth.id) : undefined"
      :anchor-rect="hoveredAnchorRect"
      :labels="resolvedLabels"
    >
      <template v-if="$slots.tooltip" #default="slotProps">
        <slot name="tooltip" v-bind="slotProps" />
      </template>
    </OdontogramTooltip>

    <ConditionLabels
      v-if="showLabels"
      :conditions="conditions"
      :states="legendStates"
      :findings="legendFindings"
      :aria-label="resolvedLabels.legend"
    />
  </div>
</template>

<style>
.odontogram {
  --odontogram-stroke-color: #8a98be;
  --odontogram-selected-color: #c6ccf8;
  --odontogram-selected-stroke-color: #b8c0cc;
  --odontogram-focus-outline-color: rgb(184 167 232 / 70%);
  width: 100%;
  color: var(--odontogram-stroke-color);
}

.odontogram__svg {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 0.5rem;
  overflow: visible;
  user-select: none;
  touch-action: manipulation;
}

.odontogram__numbers,
.odontogram__state-marks,
.odontogram__findings {
  pointer-events: none;
}

/* Findings: blue for good state or completed treatment, red for bad state or pending. */
.odontogram-finding--good {
  color: var(--odontogram-finding-good-color, #1d4ed8);
}

.odontogram-finding--bad {
  color: var(--odontogram-finding-bad-color, #dc2626);
}

.odontogram-finding__stroke {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.odontogram-finding__area {
  fill: currentColor;
  stroke: var(--odontogram-surface-stroke-color, var(--odontogram-stroke-color));
  stroke-linejoin: round;
}

/*
 * Planned treatments: dashed strokes (sized from the stroke width by the
 * chart; override with --odontogram-finding-planned-dasharray) and a
 * lighter fill.
 */
.odontogram-finding--planned .odontogram-finding__stroke {
  stroke-dasharray: var(--odontogram-finding-planned-dasharray);
}

.odontogram-finding--planned .odontogram-finding__area {
  stroke-dasharray: none;
  fill-opacity: var(--odontogram-finding-planned-fill-opacity, 0.45);
}

.odontogram-condition-labels .odontogram-finding--planned .odontogram-finding__stroke {
  stroke-dasharray: var(--odontogram-finding-planned-dasharray, 2 1.5);
}

.odontogram-finding__text {
  fill: currentColor;
  font-family: inherit;
  font-weight: 700;
}

/* Tooth states: the crown of absent teeth is hidden, only a dashed outline stays. */
.odontogram-tooth--absent {
  opacity: var(--odontogram-absent-opacity, 0.55);
}

.odontogram-tooth--unerupted {
  opacity: var(--odontogram-unerupted-opacity, 0.45);
}

.odontogram-state-mark--cross line {
  stroke: var(--odontogram-extracted-color, #dc2626);
  stroke-linecap: round;
}

.odontogram-state-mark--implant rect,
.odontogram-state-mark--implant line {
  stroke: var(--odontogram-implant-color, #0f766e);
  stroke-linecap: round;
}

.odontogram-state-mark--implant rect {
  fill: var(--odontogram-implant-fill, #ccfbf1);
}

.odontogram__number {
  fill: var(--odontogram-number-color, #64748b);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}

.odontogram__number-corner {
  fill: none;
  stroke: var(--odontogram-number-color, #64748b);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.odontogram__number-corner--selected {
  stroke: var(--odontogram-number-selected-color, #4338ca);
}

.odontogram__number--selected {
  fill: var(--odontogram-number-selected-color, #4338ca);
  font-weight: 700;
}

/* Surface diagrams: white surfaces, filled when selected. */
.odontogram-surface {
  fill: var(--odontogram-surface-fill, #fff);
  stroke: var(--odontogram-surface-stroke-color, var(--odontogram-stroke-color));
  stroke-linejoin: round;
  cursor: pointer;
  transition: fill 150ms ease-in;
}

.odontogram:not([aria-disabled='true']) .odontogram-surfaces:not(.odontogram-surfaces--inactive) .odontogram-surface:hover {
  fill: var(--odontogram-surface-hover-color, var(--odontogram-selected-color));
}

.odontogram-surface--selected,
.odontogram-surface--selected:hover {
  fill: var(--odontogram-surface-selected-color, #6366f1);
}

.odontogram-surface:focus {
  outline: none;
}

.odontogram-surface:focus-visible {
  stroke: var(--odontogram-surface-focus-color, #4338ca);
  stroke-width: 2px;
}

.odontogram-surfaces--inactive {
  opacity: var(--odontogram-absent-opacity, 0.55);
}

.odontogram-surfaces--inactive .odontogram-surface,
.odontogram[aria-disabled='true'] .odontogram-surface {
  cursor: default;
}

/* Overlays never block tooth clicks unless a child opts in. */
.odontogram__overlay {
  pointer-events: none;
}

.odontogram-tooth path:nth-of-type(2) {
  opacity: 0;
  transition: opacity 200ms ease-in;
}

.odontogram-tooth path[data-colored='true'],
.odontogram-tooth--selected path:nth-of-type(2),
.odontogram-tooth:not(.odontogram-tooth--disabled):hover path:nth-of-type(2) {
  opacity: 1;
}

.odontogram-tooth--selected path:nth-of-type(2),
.odontogram-tooth:not(.odontogram-tooth--disabled):hover path:nth-of-type(2) {
  fill: var(--odontogram-selected-color);
}

.odontogram-tooth:focus,
.odontogram-tooth:focus-visible {
  outline: 0.5px solid var(--odontogram-focus-outline-color);
  filter: drop-shadow(0 0 0.5px rgb(221 214 254 / 60%)) drop-shadow(0 0 1.5px rgb(167 139 250 / 21%));
}
</style>
