import paths from '../paths/ui'
import type { Request } from 'express'
import uiPaths from '../paths/ui'
import { IndexRequest } from '@sas/ui'

// eslint-disable-next-line import/prefer-default-export
export const getActivePage = (path: string): string => {
  if (path === paths.cases.search.pattern) return 'search'
  if (path.startsWith(paths.customList.index.pattern)) return 'customList'
  return 'caseList'
}

export const getActiveCaseListSegment = (req: Request): string => {
  const newUrl = !req.path?.length || req.path == '/' || req?.path?.startsWith('/cases') ? 'cases' : 'custom-list'
  console.log(`getActiveCaseListSegment: ${newUrl}`)
  return  newUrl
}



export const getActiveCaseListUrl = (req: Request,withPrefix:boolean = false): string => {
  const caseListUrl = req.session.caseListUrl || uiPaths.cases.index({})
  console.log(`getActiveCaseListUrl: ${caseListUrl}`)
  return withPrefix ? `/${caseListUrl}` : caseListUrl
}

export const setActiveCaseListParams = (req: IndexRequest): void => {
  const search = new URLSearchParams(req.query).toString()
}

export const setActiveCaseListUrl = (req: IndexRequest): void => {
  // todo - might not just be people type, could be any.
  let search = req.query?.peopleType ? new URLSearchParams(req.query).toString() : ''
  if(!search){
    //todo still need this bit? was meant to be - keep it if already there!
    search= req?.session?.caseListUrl?.includes('?') ? req.session.caseListUrl.split('?')[1] : ''
  }
  console.log(`req.originalUrl: ${req.originalUrl}`)
  //todo
console.log(`req.path: ${req.path.length}`)
  const newUrl = !req.path?.length || req.path == '/' || req?.path?.startsWith('/cases') ? '/' : '/custom-list'
  // req.session.caseListUrl = `${uiPaths.cases.index({})}${search ? `?${search}` : ''}`
  req.session.caseListUrl = `${newUrl}${search ? `?${search}` : ''}`
  // req.session.caseListUrl = newUrl
  console.log(req.originalUrl == '/')
  console.log(`setCaseListUrl: ${req.session.caseListUrl}`)
}
