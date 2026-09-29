import { computed, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { OdontogramCondition, OdontogramHalf, ToothNotation } from '../types/odontogram'
import { getLayoutViewBox, getToothAnchors, type ToothAnchor } from '../utils/anchors'
import { composeQuadrants, getDentitionToothIds } from '../utils/compositions'
import type { RenderableDentition } from '../utils/dentition-layout'
import type { OdontogramLayout } from '../utils/layout'
import { getToothNumberLabels } from '../utils/numbers'
import { boxFromPoints, type Box } from '../utils/svg-geometry'
import { ntsPeruFindingCatalog } from '../catalogs/nts-peru'
import type { FindingCatalog, OdontogramFinding } from '../types/findings'
import { layoutFindings } from '../utils/findings'
import { getSurfaceDiagrams } from '../utils/surfaces'
import { getToothFrames } from '../utils/tooth-frames'

export interface OdontogramOptions {
  dentition: MaybeRefOrGetter<RenderableDentition>
  layout: MaybeRefOrGetter<OdontogramLayout>
  notation: MaybeRefOrGetter<ToothNotation>
  conditions: MaybeRefOrGetter<readonly OdontogramCondition[] | undefined>
  showHalf?: MaybeRefOrGetter<OdontogramHalf>
  showNumbers?: MaybeRefOrGetter<boolean>
  findings?: MaybeRefOrGetter<readonly OdontogramFinding[] | undefined>
  findingCatalog?: MaybeRefOrGetter<FindingCatalog | undefined>
  showSurfaces?: MaybeRefOrGetter<boolean>
  /** FDI IDs of the teeth to draw; every tooth of the dentition when omitted. */
  teeth?: MaybeRefOrGetter<readonly string[] | undefined>
}

const upperQuadrants = new Set([1, 2, 5, 6])

/** Smallest box containing every box, grown by `padding` on each side. */
function unionBox(boxes: readonly Box[], padding: number): Box {
  const box = boxFromPoints(
    boxes.flatMap(({ x, y, width, height }) => [
      { x, y },
      { x: x + width, y: y + height },
    ]),
  )

  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + 2 * padding,
    height: box.height + 2 * padding,
  }
}

/**
 * Resolves the dataset, composition, tooth definitions, anchors and number
 * labels for a dentition and layout, limited to the visible arches.
 */
export function useOdontogram(options: OdontogramOptions) {
  const dentition = () => toValue(options.dentition)
  const layout = () => toValue(options.layout)
  const showHalf = () => toValue(options.showHalf) ?? 'full'
  const showNumbers = () => toValue(options.showNumbers) ?? false

  const isVisibleQuadrant = (quadrant: number): boolean =>
    showHalf() === 'full' || (showHalf() === 'upper') === upperQuadrants.has(quadrant)

  /** Teeth listed in `teeth`, or undefined to draw every tooth. */
  const listedTeeth = computed(() => {
    const teeth = toValue(options.teeth)
    return teeth ? new Set(teeth) : undefined
  })
  const isListed = (toothId: string) => !listedTeeth.value || listedTeeth.value.has(toothId)

  watch(
    () => [toValue(options.teeth), dentition()] as const,
    ([teeth, current]) => {
      if (!teeth) {
        return
      }
      const known = new Set(getDentitionToothIds(current, 'arch'))
      const unknown = teeth.filter((toothId) => !known.has(toothId))
      if (unknown.length) {
        console.warn(`[vue-odontogram] Teeth ${unknown.join(', ')} are not part of the ${current} dentition.`)
      }
    },
    { immediate: true },
  )

  const quadrants = computed(() =>
    composeQuadrants(dentition(), layout())
      .filter(({ quadrant }) => isVisibleQuadrant(quadrant))
      .map((quadrant) => ({ ...quadrant, teeth: quadrant.teeth.filter(({ tooth }) => isListed(tooth.id)) }))
      .filter(({ teeth }) => teeth.length),
  )

  const chartBox = computed(() => getLayoutViewBox(dentition(), layout()))

  const anchorList = computed<readonly ToothAnchor[]>(() =>
    getToothAnchors(dentition(), layout()).filter(
      ({ quadrant, toothId }) => isVisibleQuadrant(quadrant) && isListed(toothId),
    ),
  )
  const anchors = computed<Readonly<Record<string, ToothAnchor>>>(() =>
    Object.fromEntries(anchorList.value.map((anchor) => [anchor.toothId, anchor])),
  )

  const numberLabels = computed(() =>
    showNumbers()
      ? getToothNumberLabels(anchorList.value, chartBox.value, layout(), toValue(options.notation))
      : [],
  )

  const toothFrames = computed(() => getToothFrames(anchorList.value, chartBox.value, layout()))

  const surfaceLayout = computed(() =>
    toValue(options.showSurfaces)
      ? getSurfaceDiagrams(toothFrames.value)
      : { diagrams: [], reserved: 0 },
  )

  const findingLayout = computed(() => {
    const findings = toValue(options.findings) ?? []
    if (!findings.length) {
      return { findings: [], issues: [] }
    }

    return layoutFindings(
      findings,
      toValue(options.findingCatalog) ?? ntsPeruFindingCatalog,
      toothFrames.value,
      surfaceLayout.value,
    )
  })

  watch(
    () => findingLayout.value.issues,
    (issues) => issues.forEach((issue) => console.warn(`[vue-odontogram] ${issue}`)),
    { immediate: true },
  )

  /** Teeth covered by each rendered finding, indexed by tooth. */
  const findingsByTooth = computed(() => {
    const byTooth = new Map<string, typeof findingLayout.value.findings>()

    for (const finding of findingLayout.value.findings) {
      for (const toothId of finding.teeth) {
        byTooth.set(toothId, [...(byTooth.get(toothId) ?? []), finding])
      }
    }

    return byTooth
  })

  /**
   * The full composition, or for a half chart its full width and only the
   * height of the visible teeth, numbers, surface diagrams and findings.
   */
  const viewBoxRect = computed<Box>(() => {
    const chart = chartBox.value
    const labelBoxes = [
      ...numberLabels.value.map(({ box }) => box),
      ...surfaceLayout.value.diagrams.map(({ box }) => box),
      ...findingLayout.value.findings.map(({ box }) => box),
    ]
    const padding = toothFrames.value.fontSize || 4

    if (showHalf() === 'full') {
      if (!labelBoxes.length) {
        return chart
      }

      // Grow the composition only where numbers, diagrams or findings extend beyond it.
      const content = unionBox(labelBoxes, padding / 2)
      const x = Math.min(chart.x, content.x)
      const y = Math.min(chart.y, content.y)

      return {
        x,
        y,
        width: Math.max(chart.x + chart.width, content.x + content.width) - x,
        height: Math.max(chart.y + chart.height, content.y + content.height) - y,
      }
    }

    const boxes = [...anchorList.value.map(({ box }) => box), ...labelBoxes]
    if (!boxes.length) {
      return chart
    }

    const content = unionBox(boxes, padding)
    return { x: chart.x, y: content.y, width: chart.width, height: content.height }
  })

  const viewBox = computed(() => {
    const { x, y, width, height } = viewBoxRect.value
    const round = (value: number) => Math.round(value * 100) / 100

    return [x, y, width, height].map(round).join(' ')
  })

  const conditionByTooth = computed(() => {
    const conditions = new Map<string, OdontogramCondition>()

    // Later groups override earlier ones for the same tooth.
    for (const condition of toValue(options.conditions) ?? []) {
      for (const toothId of condition.teeth) {
        conditions.set(toothId, condition)
      }
    }

    return conditions
  })

  return {
    viewBox,
    viewBoxRect,
    quadrants,
    anchors,
    anchorList,
    numberLabels,
    surfaceDiagrams: computed(() => surfaceLayout.value.diagrams),
    findingLayout,
    findingsByTooth,
    conditionByTooth,
  }
}
