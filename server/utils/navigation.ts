import type { Request } from 'express'
import { IndexRequest } from '@sas/ui'
import uiPaths from '../paths/ui'

export const getActivePage = (path: string): string => {
  if (path === uiPaths.cases.search.pattern) return 'search'
  if (path.startsWith(uiPaths.customList.index.pattern)) return 'customList'
  return 'caseList'
}

export const getActiveCaseListSegment = (req: Request): string => {
  if (typeof req.path === 'string') {
    if (req.path?.startsWith('/search')) return 'search'
    if (req.path?.startsWith('/custom-list')) return 'custom-list'
  }
  return 'cases'
}

export const getActiveCaseListUrl = (req: Request): string => {
  return req.session.caseListUrl || uiPaths.cases.index({})
}

export const setActiveCaseListUrl = (req: IndexRequest): void => {
  let search = req.query?.peopleType ? new URLSearchParams(req.query).toString() : ''
  if (!search) {
    search = req?.session?.caseListUrl?.includes('?') ? req.session.caseListUrl.split('?')[1] : ''
  }

  let newUrl = '/'
  if (typeof req.path === 'string') {
    if (req.path?.startsWith('/search')) {
      newUrl = '/search'
    } else if (req.path?.startsWith('/custom-list')) {
      newUrl = '/custom-list'
    }
  }

  req.session.caseListUrl = `${newUrl}${search ? `?${search}` : ''}`
}
