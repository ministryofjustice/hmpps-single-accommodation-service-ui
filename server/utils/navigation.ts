import { IndexRequest } from '@sas/ui'
import { Response } from 'express'
import uiPaths from '../paths/ui'

export const getActivePage = (req: IndexRequest): string => {
  if (getCaseListUrl(req).startsWith(uiPaths.cases.search.pattern)) return 'search'
  if (getCaseListUrl(req).startsWith(uiPaths.customList.index.pattern)) return 'custom-list'
  return 'case-list'
}

export const getCaseListUrl = (req: IndexRequest): string => {
  const activeTab = req.session.caseListUrl || uiPaths.cases.index({})
  const filters = req.session.caseListFilters

  return filters ? `${activeTab}?${filters}` : activeTab
}

export const setCaseListFilters = (req: IndexRequest): void => {
  req.session.caseListFilters = req.query?.peopleType && new URLSearchParams(req.query).toString()
}

export const setActiveCaseListTab = (
  req: IndexRequest,
  res: Response,
  tab: 'custom-list' | 'case-list' | 'search',
): void => {
  res.locals.activePage = tab

  req.session.caseListUrl = {
    'custom-list': uiPaths.customList.index({}),
    'case-list': uiPaths.cases.index({}),
    search: uiPaths.cases.search({}),
  }[tab]
}
