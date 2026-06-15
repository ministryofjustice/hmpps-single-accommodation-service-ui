import { CaseDto as Case, Team } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesQuery, SelectOption, StatusCell } from '@sas/ui'
import { htmlContent, initialiseName } from './utils'
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

export const queryToFilters = (
  query: GetCasesQuery,
  currentUrl: string,
  teams: Team[] = [],
): { text: string; href: string }[] => {
  const filters: { text: string; href: string }[] = []

  if (query?.searchTerm)
    filters.push({ text: `Search: ‘${query.searchTerm}’`, href: removeQueryParam(currentUrl, 'searchTerm') })

  if (query?.teamCode) {
    const teamName = teams?.find(team => team.code === query.teamCode)?.name
    filters.push({ text: `Assigned to: ${teamName || 'Unknown team'}`, href: removeQueryParam(currentUrl, 'teamCode') })
  }

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

export const personCell = (caseData: Case, assignedToText?: string): string =>
  renderMacro('personCell', { ...caseData, name: displayName(caseData, ''), assignedToText })

export const actionsCell = (actions: Case['actions']): string => renderMacro('actionsCell', { actions })

export const casesToRows = (cases: Case[], currentUsername?: string): TableRow[] =>
  cases.map(c => {
    const assignedToText = currentUsername ? caseAssignedTo(c, currentUsername) : undefined

    if (!config.flags.v10CasesList) {
      return [htmlContent(personCell(c, assignedToText))]
    }

    return [
      htmlContent(personCell(c, assignedToText)),
      htmlContent(accommodationCell('current', c.currentAccommodation)),
      htmlContent(accommodationCell('next', c.nextAccommodation)),
      htmlContent(statusCell(caseStatusCell(c))),
      htmlContent(actionsCell(c.actions)),
    ]
  })

export const casesTableColumns = () => {
  if (!config.flags.v10CasesList) {
    return [{ text: 'Name' }]
  }

  return [
    { text: 'Name' },
    { text: 'Current accommodation' },
    { text: 'Next accommodation' },
    { text: 'Status' },
    { text: 'Actions' },
  ]
}

export const caseAssignedTo = (c: Case, username: string): string => {
  const fullName = `${c.assignedTo.forename} ${c.assignedTo.surname}`
  return c.assignedTo?.username.toUpperCase() === username.toUpperCase() ? `You (${fullName})` : fullName
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

export const displayName = (caseData: Case, laoFlag = '(limited access offender)'): string => {
  switch (caseData.userAccess) {
    case 'LIMITED':
      return 'Limited access offender'
    case 'UNKNOWN':
      return 'Unknown'
    default:
      return `${caseData.name} ${caseData.limitedAccess ? laoFlag : ''}`.trim()
  }
}

export const assignedToOptions = (fullName: string, teams: Team[]): SelectOption[] => [
  { text: `You (${initialiseName(fullName)})`, value: '' },
  ...teams.map(t => ({ text: t.name, value: t.code })),
]
