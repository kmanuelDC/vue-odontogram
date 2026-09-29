import type { ToothShape, ToothType } from './geometry'
import type { FindingStatus } from './findings'
import type { ToothSurfaceName } from './surfaces'

/** The set of dentitions the library can represent. */
export type Dentition = 'permanent' | 'primary' | 'mixed'

/** Dental numbering systems supported by the public API. */
export type ToothNotation = 'FDI' | 'Universal' | 'Palmer'

export type DentalArch = 'upper' | 'lower'

export type DentalSide = 'left' | 'right'

/** Which arches an odontogram shows: both, or only one of them. */
export type OdontogramHalf = 'full' | DentalArch

/**
 * A tooth in a chart. It connects its clinical position to a reusable SVG
 * shape, without placing rendering concerns in the data model.
 */
export interface ToothDefinition {
  id: string
  position: number
  quadrant: number
  dentition: Dentition
  type: ToothType
  shape: ToothShape
}

/**
 * Presence status of a tooth. It is independent of selection and conditions:
 * - `present`: the tooth is in the mouth (default).
 * - `missing`: absent, e.g. agenesis or unknown cause.
 * - `extracted`: removed.
 * - `implant`: replaced by an implant.
 * - `unerupted`: not yet erupted.
 */
export type ToothState = 'present' | 'missing' | 'extracted' | 'implant' | 'unerupted'

export const toothStates: readonly ToothState[] = [
  'present',
  'missing',
  'extracted',
  'implant',
  'unerupted',
]

/** Tooth states keyed by FDI ID; unlisted teeth are `present`. */
export type OdontogramToothStates = Partial<Record<string, ToothState>>

/** Colors and legend text applied to a tooth. */
export interface ToothVisualCondition {
  label?: string
  fillColor?: string
  outlineColor?: string
}

/**
 * A visual condition applied to a group of FDI teeth. A tooth shows a single
 * condition: when it appears in several groups, the last group wins.
 */
export interface OdontogramCondition extends ToothVisualCondition {
  teeth: string[]
}

/** User-facing text rendered by the odontogram, tooltip and legend. */
export interface OdontogramLabels {
  /** Accessible name of the whole chart container. */
  odontogram: string
  /** Title and accessible name of the SVG, per dentition. */
  chartTitles: Record<Dentition, string>
  /** Prefix of each tooth's accessible name, e.g. "Tooth 11". */
  tooth: string
  type: string
  selected: string
  yes: string
  no: string
  condition: string
  /** Accessible name of the condition legend. */
  legend: string
  /** Display names per tooth type; missing entries show the type itself. */
  toothTypes: Partial<Record<ToothType, string>>
  /** Prefix of the tooth state line in the tooltip. */
  state: string
  /** Display names per tooth state. */
  states: Record<ToothState, string>
  /** Prefix of the findings line in the tooltip. */
  findings: string
  /** Finding statuses, shown after planned and done findings. */
  findingStatuses: Record<FindingStatus, string>
  /** Accessible name of the surface diagrams layer. */
  surfaces: string
  /** Clinical surface names, e.g. "Tooth 11, Incisal". */
  surfaceNames: Record<ToothSurfaceName, string>
}

/** Labels override where nested maps can also be partially replaced. */
export type OdontogramLabelsInput = Partial<
  Omit<OdontogramLabels, 'chartTitles' | 'states' | 'surfaceNames' | 'findingStatuses'> & {
    chartTitles: Partial<OdontogramLabels['chartTitles']>
    states: Partial<OdontogramLabels['states']>
    surfaceNames: Partial<OdontogramLabels['surfaceNames']>
    findingStatuses: Partial<OdontogramLabels['findingStatuses']>
  }
>

export type { ToothShape, ToothType }
