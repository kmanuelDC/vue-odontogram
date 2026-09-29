import type { OdontogramSurfaces, ToothSurface, ToothSurfaceName } from '../types/surfaces'
import { toothSurfaces } from '../types/surfaces'
import { boxFromPoints, type Box, type Point } from './svg-geometry'
import type { ToothFrames } from './tooth-frames'

/** One clickable surface of a diagram. */
export interface SurfaceShape {
  surface: ToothSurface
  /** Clinical name on this tooth, e.g. `incisal` or `palatal`. */
  name: ToothSurfaceName
  /** Closed polygon, in viewBox coordinates. */
  d: string
}

/**
 * A five-surface diagram drawn next to a tooth: a square split into a central
 * occlusal square and four trapezoids. It is rotated with the tooth frame, so
 * the vestibular side faces out of the arch and the mesial side faces the
 * midline in every layout.
 */
export interface SurfaceDiagram {
  toothId: string
  center: Point
  /** Side of the square. */
  size: number
  strokeWidth: number
  /** In `toothSurfaces` order. */
  surfaces: SurfaceShape[]
  /** Area covered by the diagram, stroke included. */
  box: Box
}

export interface SurfaceDiagramLayout {
  diagrams: SurfaceDiagram[]
  /**
   * Distance the diagrams use beyond the vestibular edge of each tooth, so
   * vestibular marks such as abbreviations can be placed past them.
   */
  reserved: number
}

/** Diagram side relative to the composition's font size. */
const sizeRatio = 2.4
/** Side of the occlusal square relative to the diagram side. */
const innerRatio = 0.4

const upperQuadrants = new Set([1, 2, 5, 6])

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Distance from a tooth center to its outline along a unit direction, using
 * the ellipse inscribed in its box: crowns are rounded, so the box corners
 * would leave diagonal diagrams too far from their tooth.
 */
function ellipseExtent(box: Box, { x, y }: Point): number {
  return Math.hypot((box.width / 2) * x, (box.height / 2) * y)
}

/**
 * Clinical name of a surface on an FDI tooth: incisal instead of occlusal on
 * incisors and canines, palatal instead of lingual on upper teeth.
 */
export function getSurfaceName(surface: ToothSurface, toothId: string): ToothSurfaceName {
  if (surface === 'occlusal' && Number(toothId.slice(1)) <= 3) {
    return 'incisal'
  }
  if (surface === 'lingual' && upperQuadrants.has(Number(toothId[0]))) {
    return 'palatal'
  }

  return surface
}

/**
 * Local corners of each surface as `[vestibular, mesial]` offsets from the
 * diagram center, for an outer half side `h` and inner half side `k`.
 */
function localPolygons(h: number, k: number): Record<ToothSurface, [number, number][]> {
  return {
    vestibular: [[h, -h], [h, h], [k, k], [k, -k]],
    lingual: [[-h, -h], [-h, h], [-k, k], [-k, -k]],
    mesial: [[-h, h], [h, h], [k, k], [-k, k]],
    distal: [[-h, -h], [h, -h], [k, -k], [-k, -k]],
    occlusal: [[k, -k], [k, k], [-k, k], [-k, -k]],
  }
}

/**
 * Places one surface diagram on the vestibular side of every tooth. All
 * diagrams share one size, which follows the teeth like the tooth numbers.
 */
export function getSurfaceDiagrams({ frames, fontSize, gap }: ToothFrames): SurfaceDiagramLayout {
  const size = round(fontSize * sizeRatio)
  const h = size / 2
  const strokeWidth = Math.max(0.5, round(size * 0.05))
  const polygons = localPolygons(h, h * innerRatio)
  const diagrams: SurfaceDiagram[] = []

  for (const frame of frames.values()) {
    const vestibular = frame.outer
    // The side axis is perpendicular to the vestibular one and points to the midline.
    let mesial = { x: -vestibular.y, y: vestibular.x }
    if (mesial.x * frame.mesial.x + mesial.y * frame.mesial.y < 0) {
      mesial = { x: -mesial.x, y: -mesial.y }
    }

    const distance = ellipseExtent(frame.box, vestibular) + gap + h
    const center = {
      x: frame.center.x + vestibular.x * distance,
      y: frame.center.y + vestibular.y * distance,
    }
    const toWorld = ([v, m]: [number, number]): Point => ({
      x: center.x + vestibular.x * v + mesial.x * m,
      y: center.y + vestibular.y * v + mesial.y * m,
    })

    const surfaces = toothSurfaces.map((surface) => ({
      surface,
      name: getSurfaceName(surface, frame.toothId),
      d: `${polygons[surface]
        .map((corner, index) => {
          const { x, y } = toWorld(corner)
          return `${index ? 'L' : 'M'}${round(x)} ${round(y)}`
        })
        .join(' ')} Z`,
    }))

    const corners = boxFromPoints(polygons.vestibular.concat(polygons.lingual).map(toWorld))
    const half = strokeWidth / 2

    diagrams.push({
      toothId: frame.toothId,
      center,
      size,
      strokeWidth,
      surfaces,
      box: {
        x: corners.x - half,
        y: corners.y - half,
        width: corners.width + strokeWidth,
        height: corners.height + strokeWidth,
      },
    })
  }

  return { diagrams, reserved: diagrams.length ? gap + size : 0 }
}

/**
 * Returns a new surfaces model with one surface of a tooth toggled. Surfaces
 * keep the `toothSurfaces` order and teeth without surfaces are removed.
 */
export function toggleSurface(
  surfaces: OdontogramSurfaces | undefined,
  toothId: string,
  surface: ToothSurface,
): OdontogramSurfaces {
  const current = new Set(surfaces?.[toothId] ?? [])
  if (current.has(surface)) {
    current.delete(surface)
  } else {
    current.add(surface)
  }

  const next = { ...surfaces }
  if (current.size) {
    next[toothId] = toothSurfaces.filter((item) => current.has(item))
  } else {
    delete next[toothId]
  }

  return next
}
