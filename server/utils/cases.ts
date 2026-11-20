import { Request } from 'express'
import { CaseAction, CaseDto, CaseDto as Case, TeamDto, TeamMemberDto } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesApiQuery, IndexRequest, SelectOption } from '@sas/ui'
import { htmlContent, initialiseName } from './utils'
import { renderMacro, statusCell } from './macros'
import { renderActions } from './actions'
import { staffName } from './staff'
import { accommodationCell, accommodationStatusCell } from './accommodationSummary'
import { validateAndFlashErrors, validateCrn } from './validation'
import { summaryListRow } from './summaryListRow'
import { formatDateAndAge } from './dates'

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
  peopleType: 'NFA_RISK' | 'HOUSED',
): { text: string; href: string; selected?: boolean }[] => [
  {
    text: 'Housing support needed',
    href: updateQueryParams(url, { peopleType: 'NFA_RISK' }),
    selected: peopleType === 'NFA_RISK',
  },
  {
    text: 'Settled housing secured',
    href: updateQueryParams(url, { peopleType: 'HOUSED' }),
    selected: peopleType === 'HOUSED',
  },
]

export const casesResultsSummary = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

export const searchResultsSummary = (searchTerm: string, caseData: Case | null): string =>
  caseData ? `Result for ‘${searchTerm}’` : `0 results for ‘${searchTerm}’`

export const recentSearchItems = (cases: Case[] = []): { crn: string; name: string }[] =>
  cases.map(caseData => ({
    crn: caseData.crn,
    name: displayName(caseData, { caseList: true, onlyFirstLast: true, laoFlag: '' }),
  }))

export const queryToFilters = (
  query: GetCasesApiQuery,
  currentUrl: string,
  teams: TeamDto[] = [],
  teamMembers: TeamMemberDto[] = [],
): { text: string; href: string }[] => {
  const filters: { text: string; href: string }[] = []

  if (query?.searchTerm)
    filters.push({ text: `‘${query.searchTerm}’`, href: removeQueryParam(currentUrl, 'searchTerm') })

  if (query?.teamCode) {
    const teamName = teams?.find(team => team.code === query.teamCode)?.name
    filters.push({
      text: `Assigned to: ${teamName || 'Unknown team'}`,
      href: removeQueryParam(currentUrl, 'assignedTo'),
    })
  }
  if (query?.assignedToUsername) {
    const teamMember = teamMembers?.find(member => member.username === query.assignedToUsername)
    const fullName = teamMember ? `${teamMember.forename} ${teamMember.surname}` : undefined
    filters.push({
      text: `Assigned to: ${fullName || 'Unknown team member'}`,
      href: removeQueryParam(currentUrl, 'assignedTo'),
    })
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
    const accommodationStatus = accommodationStatusCell(c)
    return [
      htmlContent(personCell(c, assignedToText)),
      htmlContent(accommodationCell('current', c)),
      htmlContent(accommodationCell('next', c)),
      htmlContent(accommodationStatus ? statusCell(accommodationStatus) : ''),
    ]
  })

export const caseToRows = (caseData: Case | null): TableRow[] => (caseData ? casesToRows([caseData]) : [])

export const casesTableColumns = () => [
  { text: 'Name' },
  { text: 'Current accommodation' },
  { text: 'Next accommodation' },
  { text: 'Status' },
]

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

export type assignedToOptionsType = { user: SelectOption; teams: SelectOption[]; teamMembers: SelectOption[] }

export const setupAssignedToOptions = (
  fullName: string,
  teams: TeamDto[],
  teamMembers: TeamMemberDto[],
  assignedTo: string = '',
): assignedToOptionsType => ({
  user: { text: `You (${initialiseName(fullName)})`, value: '', selected: assignedTo === '' },
  teams: teams.map(t => ({ text: t.name, value: t.code, selected: assignedTo === t.code })),
  teamMembers: teamMembers.map(m => ({
    text: `${m.forename} ${m.surname}`,
    value: m.username,
    selected: assignedTo === m.username,
  })),
})

export const validateSearchCrn = (req: Request, crn?: string) => {
  const errors: Record<string, string> = {
    searchTerm: validateCrn(crn),
  }
  return validateAndFlashErrors(req, errors)
}

export enum CaseListFields {
  Search = 'search',
  AssignedTo = 'assignedTo',
  Rosh = 'rosh',
}
export const setupCaseList = (
  req: IndexRequest,
  username: string,
  cases: Case[],
  assignedToOptions: assignedToOptionsType,
  filters: { text: string; href: string }[],
) => {
  const { query } = req
  const { peopleType = 'NFA_RISK' } = query
  return {
    peopleType,
    tabs: casesTabs(req.originalUrl, peopleType),
    resultsSummary: casesResultsSummary(cases),
    casesTableColumns: casesTableColumns(),
    casesRows: casesToRows(cases, username),
    query,
    filters,
    assignedToOptions,
    riskLevelOptions: [
      { value: '', text: 'All' },
      { value: 'VERY_HIGH', text: 'Very high' },
      { value: 'HIGH', text: 'High' },
      { value: 'MEDIUM', text: 'Medium' },
      { value: 'LOW', text: 'Low' },
    ],
  }
}

export type caseListSettingsType = ReturnType<typeof setupCaseList>

export const caseSummaryListRows = (caseData: CaseDto) => {
  const rows = [
    summaryListRow('Name', displayName(caseData)),
    summaryListRow('Date of birth', formatDateAndAge(caseData.dateOfBirth)),
    summaryListRow('CRN', caseData.crn),
  ]
  if (caseData.prisonNumber) {
    rows.push(summaryListRow('Prison number', caseData.prisonNumber))
  }

  return rows
}
