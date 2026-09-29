import type { OdontogramLabels, OdontogramLabelsInput } from '../types/odontogram'

export const defaultOdontogramLabels: Readonly<OdontogramLabels> = {
  odontogram: 'Odontogram',
  chartTitles: {
    permanent: 'permanent odontogram',
    primary: 'primary odontogram',
    mixed: 'mixed odontogram',
  },
  tooth: 'Tooth',
  type: 'Type',
  selected: 'Selected',
  yes: 'Yes',
  no: 'No',
  condition: 'Condition',
  legend: 'Tooth condition legend',
  toothTypes: {},
  state: 'State',
  states: {
    present: 'Present',
    missing: 'Missing',
    extracted: 'Extracted',
    implant: 'Implant',
    unerupted: 'Unerupted',
  },
  findings: 'Findings',
  findingStatuses: {
    existing: 'Existing',
    planned: 'Planned',
    done: 'Done',
  },
  surfaces: 'Tooth surfaces',
  surfaceNames: {
    vestibular: 'Vestibular',
    mesial: 'Mesial',
    occlusal: 'Occlusal',
    incisal: 'Incisal',
    distal: 'Distal',
    lingual: 'Lingual',
    palatal: 'Palatal',
  },
}

/** Merges partial overrides, including nested maps, over the defaults. */
export function resolveOdontogramLabels(labels?: OdontogramLabelsInput): OdontogramLabels {
  return {
    ...defaultOdontogramLabels,
    ...labels,
    chartTitles: { ...defaultOdontogramLabels.chartTitles, ...labels?.chartTitles },
    toothTypes: { ...defaultOdontogramLabels.toothTypes, ...labels?.toothTypes },
    states: { ...defaultOdontogramLabels.states, ...labels?.states },
    surfaceNames: { ...defaultOdontogramLabels.surfaceNames, ...labels?.surfaceNames },
    findingStatuses: { ...defaultOdontogramLabels.findingStatuses, ...labels?.findingStatuses },
  }
}
