<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue'
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
import { getToothRecord, type ToothRecord } from '../utils/finding-records'
import { toothSurfaces, type OdontogramSurfaces, type SurfaceShapeKind, type ToothSurface } from '../types/surfaces'
import { getSurfaceName, surfaceCenter, toggleSurface, type SurfaceDiagram } from '../utils/surfaces'
import { formatToothNumber } from '../utils/notation'
import { absentToothStates } from '../utils/state-marks'
import ConditionLabels from './ConditionLabels.vue'
import FindingPrimitives from './FindingPrimitives.vue'
import OdontogramTooltip, { type TooltipAnchorRect, type TooltipSurfaceSummary } from './OdontogramTooltip.vue'
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
    /** Draws each surface's letter (V, M, O/I, D, L/P) on the chart diagrams. */
    showSurfaceLetters?: boolean
    /** Shape of the surface diagrams: `square` (default) or `circle`. */
    surfaceShape?: SurfaceShapeKind
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
    showSurfaceLetters: false,
    surfaceShape: 'square',
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
    /**
     * Hovered or focused surface, if the tooltip is for a surface; then
     * `selected` and `findings` refer to that surface.
     */
    surface?: ToothSurface
    /** Clinical name of `surface` on the tooth, e.g. "Palatal". */
    surfaceName?: string
    /**
     * In the tooltip of a tooth, the findings of each surface with any; then
     * `findings` lists only the findings of the whole tooth.
     */
    surfaceSummary: readonly TooltipSurfaceSummary[]
  }) => unknown
  /**
   * Menu opened by clicking a surface (or Enter/Space on it). When given, a
   * surface no longer toggles its selection: the app shows its findings and
   * records new ones, and calls `close` when done. Esc and a click outside
   * close it too.
   */
  'surface-menu'?: (props: {
    toothId: string
    tooth: ToothDefinition
    surface: ToothSurface
    /** Clinical name of `surface` on the tooth, e.g. "Palatal". */
    surfaceName: string
    /** Everything recorded on the tooth; `record.surfaces[surface]` for this surface. */
    record: ToothRecord
    close: () => void
  }) => unknown
  /** SVG content drawn above the teeth, in the layout's viewBox coordinates. */
  overlay?: (props: {
    anchors: Readonly<Record<string, ToothAnchor>>
    viewBox: Box
    dentition: RenderableDentition
    layout: OdontogramLayout
    /** Surface diagrams drawn with `showSurfaces`, with their centers and boxes. */
    surfaceDiagrams: readonly SurfaceDiagram[]
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
  surfaceShape: () => props.surfaceShape,
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

/** Letters of every surface of the chart diagrams, drawn above the findings. */
const surfaceLetters = computed(() =>
  props.showSurfaceLetters
    ? surfaceDiagrams.value.flatMap((diagram) =>
        diagram.surfaces.map((shape) => ({
          key: `${diagram.toothId}:${shape.surface}`,
          ...surfaceCenter(shape),
          fontSize: diagram.size * 0.24,
          text: resolvedLabels.value.surfaceLetters[shape.name],
        })),
      )
    : [],
)

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

const slots = useSlots()

/** Surface whose menu is open, with the polygon it is anchored to. */
const surfaceMenu = ref<{ toothId: string; surface: ToothSurface; element: SVGElement }>()
const surfaceMenuElement = ref<HTMLElement | null>(null)
const surfaceMenuPosition = ref({ left: -9999, top: -9999 })

/** Click, Enter or Space on a surface: opens its menu, or toggles its selection. */
function handleSurfaceActivate(toothId: string, surface: ToothSurface, element: SVGElement): void {
  if (!slots['surface-menu']) {
    handleSurfaceToggle(toothId, surface)
    return
  }

  emit('surface-click', toothById.value.get(toothId)!, surface, props.surfaces)
  hideToothTooltip()
  surfaceMenu.value = { toothId, surface, element }
  void placeSurfaceMenu()
}

/** Places the menu below its surface (above when there is no room) and focuses it. */
async function placeSurfaceMenu(): Promise<void> {
  surfaceMenuPosition.value = { left: -9999, top: -9999 }
  await nextTick()
  const menu = surfaceMenuElement.value
  const anchor = surfaceMenu.value?.element
  if (!menu || !anchor) {
    return
  }

  const padding = 8
  const rect = anchor.getBoundingClientRect()
  const { width, height } = menu.getBoundingClientRect()
  const clamp = (value: number, maximum: number) => Math.min(Math.max(value, padding), Math.max(padding, maximum))
  const below = rect.bottom + padding
  const top = below + height > window.innerHeight - padding ? rect.top - height - padding : below

  surfaceMenuPosition.value = {
    left: clamp(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - padding),
    top: clamp(top, window.innerHeight - height - padding),
  }
  menu
    .querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ?.focus()
}

/** Closes the menu; by default the focus returns to its surface. */
function closeSurfaceMenu(restoreFocus = true): void {
  const element = surfaceMenu.value?.element
  surfaceMenu.value = undefined
  if (restoreFocus) {
    element?.focus()
  }
}

const surfaceMenuProps = computed(() => {
  const menu = surfaceMenu.value
  if (!menu) {
    return undefined
  }

  return {
    toothId: menu.toothId,
    tooth: toothById.value.get(menu.toothId)!,
    surface: menu.surface,
    surfaceName: resolvedLabels.value.surfaceNames[getSurfaceName(menu.surface, menu.toothId)],
    record: getToothRecord(menu.toothId, props.findings ?? [], props.findingCatalog),
    close: () => closeSurfaceMenu(),
  }
})

function handleDocumentPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (surfaceMenu.value && target && !surfaceMenuElement.value?.contains(target) && target !== surfaceMenu.value.element) {
    closeSurfaceMenu(false)
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (surfaceMenu.value && event.key === 'Escape') {
    event.preventDefault()
    closeSurfaceMenu()
  }
}

watch(
  () => Boolean(surfaceMenu.value),
  (open) => {
    if (open) {
      document.addEventListener('pointerdown', handleDocumentPointerDown, true)
      document.addEventListener('keydown', handleDocumentKeydown)
    } else {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  },
)

// The menu closes when its tooth or the diagrams are no longer drawn.
watch(
  () => surfaceMenu.value && !surfaceDiagrams.value.some(({ toothId }) => toothId === surfaceMenu.value!.toothId),
  (gone) => gone && closeSurfaceMenu(false),
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

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
/** Surface of `hoveredTooth` under the pointer or focus, if any. */
const hoveredSurface = ref<ToothSurface>()
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
  hoveredSurface.value = undefined
  hoveredAnchorRect.value = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

function hideToothTooltip(): void {
  hoveredTooth.value = undefined
  hoveredSurface.value = undefined
  hoveredAnchorRect.value = undefined
}

/** Shows the tooltip for a surface that is hovered or focused. */
function showSurfaceTooltip(toothId: string, surface: ToothSurface, event: Event): void {
  const tooth = toothById.value.get(toothId)
  if (tooth) {
    showToothTooltip(tooth, event)
    hoveredSurface.value = surface
  }
}

/**
 * What the tooltip of a tooth shows: its whole-tooth findings, and a summary
 * of the findings of each surface.
 */
const toothTooltip = computed(() => {
  const tooth = hoveredTooth.value
  if (!tooth || hoveredSurface.value) {
    return undefined
  }

  const { surfaceNames, surfaceLetters, findingStatuses } = resolvedLabels.value
  const describe = ({ finding, definition }: { finding: OdontogramFinding; definition?: { name: string } }) => {
    const status = finding.status ?? 'existing'
    const name = definition?.name ?? finding.code
    return status === 'existing' ? name : `${name} (${findingStatuses[status]})`
  }
  const record = getToothRecord(tooth.id, props.findings ?? [], props.findingCatalog)
  const summary: TooltipSurfaceSummary[] = toothSurfaces
    .filter((surface) => record.surfaces[surface].length)
    .map((surface) => {
      const name = getSurfaceName(surface, tooth.id)
      return {
        surface,
        letter: surfaceLetters[name],
        name: surfaceNames[name],
        findings: [...new Set(record.surfaces[surface].map(describe))],
      }
    })
  // Surface findings are in the summary; the findings line keeps the rest.
  const toothFindings = [
    ...new Set(
      (findingsByTooth.value.get(tooth.id) ?? [])
        .filter(({ surfaces }) => !surfaces)
        .map((finding) =>
          finding.status === 'existing' ? finding.name : `${finding.name} (${findingStatuses[finding.status]})`,
        ),
    ),
  ]

  return { summary, findings: toothFindings }
})

/** What the tooltip shows for the hovered surface. */
const surfaceTooltip = computed(() => {
  const tooth = hoveredTooth.value
  const surface = hoveredSurface.value
  if (!tooth || !surface) {
    return undefined
  }

  const { surfaceNames, surfaceDescriptions, findingStatuses } = resolvedLabels.value
  const name = getSurfaceName(surface, tooth.id)
  const findings = getToothRecord(tooth.id, props.findings ?? [], props.findingCatalog).surfaces[surface].map(
    ({ finding, definition }) => {
      const status = finding.status ?? 'existing'
      const findingName = definition?.name ?? finding.code
      return status === 'existing' ? findingName : `${findingName} (${findingStatuses[status]})`
    },
  )

  return {
    surface,
    name: surfaceNames[name],
    description: surfaceDescriptions[name],
    findings: [...new Set(findings)],
    selected: props.surfaces[tooth.id]?.includes(surface) ?? false,
  }
})

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
        :menu="Boolean($slots['surface-menu'])"
        :open-menu="surfaceMenu"
        @activate="handleSurfaceActivate"
        @enter="showSurfaceTooltip"
        @leave="hideToothTooltip"
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

      <g v-if="surfaceLetters.length" class="odontogram__surface-letters" aria-hidden="true">
        <text
          v-for="letter in surfaceLetters"
          :key="letter.key"
          class="odontogram__surface-letter"
          :data-letter-for="letter.key"
          :x="letter.x"
          :y="letter.y"
          :font-size="letter.fontSize"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ letter.text }}
        </text>
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
          :surface-diagrams="surfaceDiagrams"
        />
      </g>
    </svg>

    <OdontogramTooltip
      v-if="showTooltip"
      :active="Boolean(hoveredTooth) && !surfaceMenu"
      :tooth="hoveredTooth"
      :selected="surfaceTooltip ? surfaceTooltip.selected : hoveredTooth ? isSelected(hoveredTooth.id) : false"
      :condition="hoveredTooth ? conditionByTooth.get(hoveredTooth.id) : undefined"
      :state="hoveredTooth ? stateOf(hoveredTooth.id) : 'present'"
      :findings="surfaceTooltip ? surfaceTooltip.findings : toothTooltip ? toothTooltip.findings : []"
      :number="hoveredTooth ? numberOf(hoveredTooth.id) : undefined"
      :surface="surfaceTooltip?.surface"
      :surface-name="surfaceTooltip?.name"
      :surface-description="surfaceTooltip?.description"
      :surface-summary="toothTooltip?.summary ?? []"
      :anchor-rect="hoveredAnchorRect"
      :labels="resolvedLabels"
    >
      <template v-if="$slots.tooltip" #default="slotProps">
        <slot name="tooltip" v-bind="slotProps" />
      </template>
    </OdontogramTooltip>

    <div
      v-if="surfaceMenuProps && $slots['surface-menu']"
      ref="surfaceMenuElement"
      class="odontogram-surface-menu"
      role="dialog"
      :aria-label="`${resolvedLabels.surfaceMenu}: ${resolvedLabels.tooth} ${spokenNumberOf(surfaceMenuProps.toothId)}, ${surfaceMenuProps.surfaceName}`"
      :data-menu-for="`${surfaceMenuProps.toothId}:${surfaceMenuProps.surface}`"
      :style="{
        position: 'fixed',
        left: `${surfaceMenuPosition.left}px`,
        top: `${surfaceMenuPosition.top}px`,
        opacity: surfaceMenuPosition.left === -9999 ? 0 : 1,
      }"
    >
      <slot name="surface-menu" v-bind="surfaceMenuProps" />
    </div>

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
.odontogram__surface-letters,
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

.odontogram__surface-letter {
  fill: var(--odontogram-surface-letter-color, #334155);
  font-family: inherit;
  font-weight: 700;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 0.12em;
}

/* Overlays never block tooth clicks unless a child opts in. */
/* Surface menu: a floating panel; its content comes from the surface-menu slot. */
.odontogram-surface-menu {
  z-index: 1000;
  min-width: 12rem;
  max-width: min(22rem, calc(100vw - 16px));
  padding: 0.75rem;
  border: 1px solid var(--odontogram-surface-menu-border, #cbd5e1);
  border-radius: 0.5rem;
  color: var(--odontogram-surface-menu-fg, #1e293b);
  background: var(--odontogram-surface-menu-bg, #fff);
  box-shadow: 0 8px 24px rgb(15 23 42 / 18%);
}

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
