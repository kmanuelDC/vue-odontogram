export { default as Odontogram } from './components/Odontogram.vue'
export { default as Tooth } from './components/Tooth.vue'
export { default as SurfaceGuide } from './components/SurfaceGuide.vue'
export { default as ToothInspector } from './components/ToothInspector.vue'

export { buildToothId, formatToothNumber, getPalmerQuadrant, getToothType } from './utils/notation'
export type { PalmerQuadrant } from './utils/notation'
export { getQuadrant } from './utils/quadrants'
export { defaultOdontogramLabels } from './utils/labels'
export { toothStates } from './types/odontogram'
export { ntsPeruFindingCatalog } from './catalogs/nts-peru'
export type { NtsPeruFindingCode } from './catalogs/nts-peru'
export { findingStatuses } from './types/findings'
export { getFindingScope, resolveFindingTone } from './utils/findings'
export type {
  FindingCatalog,
  FindingDefinition,
  FindingDirection,
  FindingScope,
  FindingStatus,
  FindingSymbol,
  FindingSymbolKind,
  FindingTone,
  OdontogramFinding,
} from './types/findings'
export { surfaceShapeKinds, toothSurfaces } from './types/surfaces'
export type { OdontogramSurfaces, SurfaceShapeKind, ToothSurface, ToothSurfaceName } from './types/surfaces'
export { getSurfaceName, toggleSurface } from './utils/surfaces'
export type { SurfaceDiagram, SurfaceShape } from './utils/surfaces'
export { addFinding, addSurfaceFinding, getToothRecord, removeSurfaceFinding } from './utils/finding-records'
export type {
  SurfaceFindingInput,
  SurfaceFindingRemoval,
  ToothFindingInput,
  ToothFindingEntry,
  ToothRecord,
} from './utils/finding-records'
export { getToothAnchors, getLayoutViewBox } from './utils/anchors'
export type { Box, Point, ToothAnchor } from './utils/anchors'

export type {
  DentalArch,
  DentalSide,
  Dentition,
  OdontogramCondition,
  OdontogramHalf,
  OdontogramLabels,
  OdontogramLabelsInput,
  OdontogramToothStates,
  ToothDefinition,
  ToothNotation,
  ToothShape,
  ToothState,
  ToothType,
  ToothVisualCondition,
} from './types/odontogram'

export type { OdontogramLayout } from './utils/layout'
export type { ToothCondition } from './components/Tooth.vue'
export type { TooltipPlacement } from './components/OdontogramTooltip.vue'
