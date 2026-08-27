import { Request } from 'express'
import { CaseAction, CaseDto as Case, Team } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesQuery, SelectOption } from '@sas/ui'
import { htmlContent, initialiseName } from './utils'
import { renderMacro, statusCell } from './macros'
import { renderActions } from './actions'
import { staffName } from './staff'
import config from '../config'
import { accommodationCell, accommodationStatusCell } from './accommodationSummary'
import { validateAndFlashErrors, validateCrn } from './validation'

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

export const casesTabs = (
  url: string,
  peopleType: 'nfarisk' | 'housed',
): { text: string; href: string; selected?: boolean }[] => [
  {
    text: 'Housing support needed',
    href: updateQueryParams(url, { peopleType: 'nfarisk' }),
    selected: peopleType === 'nfarisk',
  },
  {
    text: 'Settled housing secured',
    href: updateQueryParams(url, { peopleType: 'housed' }),
    selected: peopleType === 'housed',
  },
]

export const casesResultsSummary = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

export const searchResultsSummary = (searchTerm?: string, cases: Case[] = []): string | undefined =>
  searchTerm ? `${cases.length > 0 ? "Result for '" : "0 results for '"}${searchTerm}'` : undefined

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

export const removeQueryParam = (url: string, param: string): string => updateQueryParams(url, { [param]: undefined })

export const updateQueryParams = (url: string, updateParams: Record<string, unknown>): string => {
  const [path, search] = url.split('?')
  const params = new URLSearchParams(search)

  for (const [key, value] of Object.entries(updateParams)) {
    if (!value) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
  }

  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

export const personCell = (caseData: Case, assignedToText?: string): string =>
  renderMacro('personCell', {
    ...caseData,
    name: displayName(caseData, { laoFlag: '', caseList: true }),
    assignedToText,
  })

export const actionsCell = (actions: CaseAction[]): string =>
  renderMacro('actionsCell', { actions: renderActions(actions) })

export const casesToRows = (cases: Case[], currentUsername?: string): TableRow[] =>
  cases.map(c => {
    const assignedToText = currentUsername ? caseAssignedTo(c, currentUsername) : undefined
    if (!config.flags.caseListV2) {
      return [htmlContent(personCell(c, assignedToText))]
    }
    const accommodationStatus = accommodationStatusCell(c)
    return [
      htmlContent(personCell(c, assignedToText)),
      htmlContent(accommodationCell('current', c)),
      htmlContent(accommodationCell('next', c)),
      htmlContent(accommodationStatus ? statusCell(accommodationStatus) : ''),
    ]
  })

export const casesTableColumns = () => {
  if (!config.flags.caseListV2) {
    return [{ text: 'Name' }]
  }
  return [{ text: 'Name' }, { text: 'Current accommodation' }, { text: 'Next accommodation' }, { text: 'Status' }]
}

export const caseAssignedTo = (c: Case, username: string): string => {
  if (c.userAccess !== 'FULL') return ''
  if (!c.assignedTo) return 'unallocated'
  return staffName(c.assignedTo, username)
}

type DisplayNameOptions = {
  laoFlag?: string
  caseList?: boolean
  onlyFirstLast?: boolean
}

export const displayName = (caseData: Case, options: DisplayNameOptions = {}): string => {
  const { laoFlag = '(limited access offender)', caseList = false, onlyFirstLast = false } = options
  const { forename = '', middleNames = '', surname = '' } = caseData ?? {}
  const name = caseList
    ? `${[surname, forename].filter(Boolean).join(', ')} ${(!onlyFirstLast && middleNames) || ''}`.trim()
    : [forename, !onlyFirstLast && middleNames, surname].filter(Boolean).join(' ')

  switch (caseData.userAccess) {
    case 'LIMITED':
      return 'Limited access offender'
    case 'UNKNOWN':
      return 'Unknown'
    default:
      return `${name || 'Unknown'} ${caseData.limitedAccess ? laoFlag : ''}`.trim()
  }
}

export const assignedToOptions = (fullName: string, teams: Team[]): SelectOption[] => [
  { text: `You (${initialiseName(fullName)})`, value: '' },
  ...teams.map(t => ({ text: t.name, value: t.code })),
]

export const validateSearchCrn = (req: Request, crn?: string) => {
  const errors: Record<string, string> = {
    searchTerm: validateCrn(crn),
  }
  return validateAndFlashErrors(req, errors)
}
