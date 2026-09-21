/** FDI quadrants used by primary (deciduous) dentition. */
export type PrimaryQuadrant = 5 | 6 | 7 | 8

export interface PrimaryQuadrantTransform {
  quadrant: PrimaryQuadrant
  transform: string
}

/**
 * Provisional arch composition for the five pediatric SVG approximations.
 *
 * The 461-unit height is intentionally independent from the permanent arch's
 * 694-unit viewBox. It keeps every lower-arch spacing intact while leaving
 * more than 30 units between the upper and lower second molars.
 */
/**
 * Mirrors an upper primary quadrant across the horizontal axis of its SVG
 * workspace. It preserves every path's size and curvature, yielding the
 * corresponding mandibular quadrant.
 */
export function mirrorPrimaryQuadrant(
  width: number,
  height: number,
  mirrorHorizontally = false,
): string {
  const scaleX = mirrorHorizontally ? -1 : 1
  const translateX = mirrorHorizontally ? -width : 0

  return `scale(${scaleX}, -1) translate(${translateX}, -${height})`
}

export interface PrimaryArchLayoutDefinition {
  layout: 'arch'
  viewBox: string
  quadrants: readonly PrimaryQuadrantTransform[]
  provisional: true
}

export const primaryArchLayoutDefinition: PrimaryArchLayoutDefinition = {
  layout: 'arch',
  viewBox: '0 0 409 461',
  quadrants: [
    { quadrant: 5, transform: '' },
    { quadrant: 6, transform: 'scale(-1, 1) translate(-409, 0)' },
    { quadrant: 8, transform: mirrorPrimaryQuadrant(409, 461) },
    { quadrant: 7, transform: mirrorPrimaryQuadrant(409, 461, true) },
  ],
  provisional: true,
}





