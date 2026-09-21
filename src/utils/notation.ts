import type { ToothNotation } from '../types/odontogram'
import {
  isQuadrantForDentition,
  type NumberedDentition,
} from './quadrants'

const positionLimit: Record<NumberedDentition, number> = {
  permanent: 8,
  primary: 5,
}

/**
 * Builds a tooth identifier from its dental position.
 *
 * FDI is the currently implemented numbering system. Universal and Palmer are
 * retained in the public type as planned extensions, but intentionally throw
 * until their primary-dentition rules are implemented.
 */
export function buildToothId(
  dentition: NumberedDentition,
  quadrant: number,
  position: number,
  notation: ToothNotation,
): string {
  if (!isQuadrantForDentition(dentition, quadrant)) {
    throw new RangeError(`Quadrant ${quadrant} is not valid for ${dentition} dentition.`)
  }

  const maximumPosition = positionLimit[dentition]
  if (!Number.isInteger(position) || position < 1 || position > maximumPosition) {
    throw new RangeError(
      `Position ${position} is not valid for ${dentition} dentition; expected 1–${maximumPosition}.`,
    )
  }

  if (notation !== 'FDI') {
    throw new Error(`${notation} notation is not implemented yet.`)
  }

  return `${quadrant}${position}`
}
