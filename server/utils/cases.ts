import { CaseDto as Case } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesQuery, StatusCell } from '@sas/ui'
import { htmlContent } from './utils'
import { renderMacro, statusCell } from './macros'
import config from '../config'
import { accommodationCell } from './accommodationSummary'

export const formatRiskLevel = (level?: Case['riskLevel']) => {
  return (
    {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    }[level] || 'Unknown'
  )
}

export const casesResultsSummary = (cases: Case[]): string => {
  const summary = `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

  return summary
}

export const queryToFilters = (query: GetCasesQuery, currentUrl: string): { text: string; href: string }[] => {
  const filters: { text: string; href: string }[] = []
  if (query?.searchTerm)
    filters.push({ text: `Search: '${query.searchTerm}'`, href: removeQueryParam(currentUrl, 'searchTerm') })
  if (query?.assignedTo && query.assignedTo !== 'you')
    filters.push({ text: `Assigned to: ${query.assignedTo}`, href: removeQueryParam(currentUrl, 'assignedTo') })
  if (query?.riskLevel)
    filters.push({ text: `RoSH: ${formatRiskLevel(query.riskLevel)}`, href: removeQueryParam(currentUrl, 'riskLevel') })
  return filters
}

const removeQueryParam = (url: string, param: string): string => {
  const [path, search] = url.split('?')
  const params = new URLSearchParams(search)
  params.delete(param)
  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

export const personCell = (c: Case): string => renderMacro('personCell', c)

export const actionsCell = (actions: Case['actions']): string => renderMacro('actionsCell', { actions })

export const casesToRows = (cases: Case[]): TableRow[] =>
  cases.map(c => {
    if (!config.flags.v10CasesList) {
      return [htmlContent(personCell(c))]
    }

    return [
      htmlContent(personCell(c)),
      htmlContent(accommodationCell('current', c.currentAccommodation)),
      htmlContent(accommodationCell('next', c.nextAccommodation)),
      htmlContent(statusCell(caseStatusCell(c))),
      htmlContent(actionsCell(c.actions)),
    ]
  })

export const casesTableColumns = () => {
  if (!config.flags.v10CasesList) {
    return [{ text: 'Person' }]
  }

  return [
    { text: 'Person' },
    { text: 'Current accommodation' },
    { text: 'Next accommodation' },
    { text: 'Status' },
    { text: 'Actions' },
  ]
}

export const caseAssignedTo = (c: Case, username: string): string => {
  return String(c.assignedTo?.username) === username ? `You (${c.assignedTo.name})` : c.assignedTo?.name
}

export const mapGetCasesQuery = (query: GetCasesQuery): GetCasesQuery => {
  const { searchTerm, riskLevel } = query

  return {
    searchTerm,
    riskLevel,
  }
}

export const caseStatusCell = (c: Case): StatusCell => {
  const date = c.currentAccommodation?.endDate
  return (
    {
      RISK_OF_NO_FIXED_ABODE: { status: { text: 'Risk of no fixed abode', colour: 'orange' }, date },
      NO_FIXED_ABODE: { status: { text: 'No fixed abode', colour: 'grey' } },
      TRANSIENT: { status: { text: 'Transient', colour: 'purple' } },
      SETTLED: { status: { text: 'Settled', colour: 'green' } },
    }[c.status] || { status: { text: 'Unknown' } }
  )
}
