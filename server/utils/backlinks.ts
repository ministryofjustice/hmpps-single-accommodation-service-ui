import { match, Path } from 'path-to-regexp'
import type { Request } from 'express'
import { IndexRequest } from '@sas/ui'
import uiPaths from '../paths/ui'
import config from '../config'

/**
 * Provides referer links for pages with multiple routes
 * A set of match path patterns are provided. If the referer in the request matches one of these paths,
 * the referer is returned and stored in the session against this page pattern.
 * If no match, the last stored referer for this page is returned
 * @param pagePattern a unique id for the page being rendered - typically the pattern of the path.
 * @param req the page request object
 * @param matchList an array of path.pattern strings to match against the referer in the request
 * @param defaultPath the path that is returned if there is no match in the session i.e. if the session has ended.
 * @return the url to use as the backlink for the page.
 */

export const getPageBackLink = (
  pagePattern: string,
  req: Request,
  matchList: Array<Path>,
  defaultPath = getCaseListUrl(req),
): string => {
  const {
    session,
    headers: { referer },
  } = req
  const refererUrl = referer && new URL(referer)
  const lastReferer = session.pageReferers?.[pagePattern]

  if (refererUrl && refererUrl.host === new URL(config.ingressUrl).host) {
    const refererPath = refererUrl?.pathname
    const hasMatch = matchList.find(path => match(path)(refererPath))

    if (hasMatch) {
      const currentReferer = `${refererPath}${refererUrl?.search || ''}`

      session.pageReferers = {
        ...session.pageReferers,
        [pagePattern]: currentReferer,
      }

      return currentReferer
    }
  }

  return lastReferer || defaultPath
}

export const getCaseListUrl = (req: Request): string => req.session.caseListUrl || uiPaths.cases.index({})

export const setCaseListUrl = (req: IndexRequest): void => {
  const search = new URLSearchParams(req.query).toString()

  req.session.caseListUrl = `${uiPaths.cases.index({})}${search ? `?${search}` : ''}`
}
