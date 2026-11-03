import type { Request } from 'express'
import { IndexRequest } from '@sas/ui'
import uiPaths from '../paths/ui'

export const getActivePage = (path: string): string => {
  if (path === uiPaths.cases.search.pattern) return 'search'
  if (path.startsWith(uiPaths.customList.index.pattern)) return 'customList'
  return 'caseList'
}

export const getActiveCaseListSegment = (req: Request): string => {
  return !req.path?.length || req.path === '/' || req?.path?.startsWith('/cases') ? 'cases' : 'custom-list'
}

export const getActiveCaseListUrl = (req: Request): string => {
  return req.session.caseListUrl || uiPaths.cases.index({})
}

export const setActiveCaseListUrl = (req: IndexRequest): void => {
  let search = req.query?.peopleType ? new URLSearchParams(req.query).toString() : ''
  if (!search) {
    search = req?.session?.caseListUrl?.includes('?') ? req.session.caseListUrl.split('?')[1] : ''
  }
  const newUrl = !req.path?.length || req.path === '/' || req?.path?.startsWith('/cases') ? '/' : '/custom-list'
  req.session.caseListUrl = `${newUrl}${search ? `?${search}` : ''}`
}
