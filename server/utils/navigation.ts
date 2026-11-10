import { IndexRequest } from '@sas/ui'
import uiPaths from '../paths/ui'

export const getActivePage = (path: string): string => {
  if (path.startsWith(uiPaths.cases.search.pattern)) return 'search'
  if (path.startsWith(uiPaths.customList.index.pattern)) return 'custom-list'
  return 'case-list'
}

export const getCaseListUrl = (req: IndexRequest): string => {
  return req?.session?.caseListUrl || uiPaths.cases.index({})
}

export const setActiveCaseListUrl = (req: IndexRequest, url: string): void => {
  let search = req.query?.peopleType ? new URLSearchParams(req.query).toString() : ''
  if (!search) {
    search = req?.session?.caseListUrl?.includes('?') ? req.session.caseListUrl.split('?')[1] : ''
  }
  let newUrl = '/'
  if (url?.startsWith('search')) {
    newUrl = '/search'
  } else if (url?.startsWith('custom-list')) {
    newUrl = '/custom-list'
  }
  newUrl = `${newUrl}${search ? `?${search}` : ''}`
  req.session.caseListUrl = newUrl
}
