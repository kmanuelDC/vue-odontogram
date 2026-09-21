import type { ToothShape, ToothType } from './geometry'

/** The set of dentitions the library can represent. */
export type Dentition = 'permanent' | 'primary' | 'mixed'

/** Dental numbering systems supported by the public API. */
export type ToothNotation = 'FDI' | 'Universal' | 'Palmer'

export type DentalArch = 'upper' | 'lower'

export type DentalSide = 'left' | 'right'

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

export type { ToothShape, ToothType }
