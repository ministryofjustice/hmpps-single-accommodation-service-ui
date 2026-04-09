import { match, Path } from 'path-to-regexp'
import type { Request } from 'express'

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
  defaultPath = '/',
): string => {
  const {
    session,
    headers: { referer },
  } = req
  const refererPath = (referer && new URL(referer).pathname) || ''
  const foundReferer = matchList.find(path => match(path)(refererPath))
  const lastReferer = session.pageReferers?.[pagePattern]
  if (foundReferer && lastReferer !== referer) {
    session.pageReferers = session.pageReferers || {}
    session.pageReferers[pagePattern] = referer
  }

  return foundReferer ? referer : lastReferer || defaultPath
}

/**
 * Captures the redirect URL at the start of a flow.
 * Reuses getPageBackLink, storing against the provided pattern
 * so it can be retrieved later in the flow.
 */
export const setFlowRedirect = (pagePattern: string, req: Request, matchList: Array<Path>, defaultPath = '/'): string =>
  getPageBackLink(pagePattern, req, matchList, defaultPath)

/**
 * Retrieves the redirect URL that was captured at the start of the flow.
 */
export const getFlowRedirect = (pagePattern: string, req: Request, defaultPath = '/'): string => {
  return req.session.pageReferers?.[pagePattern] || defaultPath
}
