import { getActivePage, getActiveCaseListUrl,getActiveCaseListSegment,setActiveCaseListUrl } from './navigation'
import { mock } from 'jest-mock-extended'
import { Session } from 'express-session'
import uiPaths from '../paths/ui'
import * as backlinksUtils from './backlinks'
import * as navigationUtils from './navigation'
import { Request } from 'express'

describe('getActivePage', () => {
  it('returns "caseList" for the case list page', () => {
    expect(getActivePage('/')).toEqual('caseList')
  })

  it('returns "search" for the search page', () => {
    expect(getActivePage('/search')).toEqual('search')
  })

  it('returns "caseList" for other pages', () => {
    expect(getActivePage('/cases/X123456')).toEqual('caseList')
  })

  it('returns "customList" for the custom list page', () => {
    expect(getActivePage('/custom-list')).toEqual('customList')
  })
  it('returns "customList" for the custom list pages', () => {
    expect(getActivePage('/custom-list/add-crns')).toEqual('customList')
  })
})

describe('getActiveCaseListUrl', () => {
  const pagePattern = 'page-Pattern'
  const mockRequest = (referer: string, lastStoredReferer: string) =>
    mock<Request & { session: Session }>({
      headers: { referer },
      session: {
        pageReferers: lastStoredReferer
          ? {
              [pagePattern]: lastStoredReferer,
            }
          : undefined,
      },
    })
  it('returns the base case list link if none is in session', () => {
    const request = mock<Request>()

    expect(getActiveCaseListUrl(request)).toEqual(uiPaths.cases.index({}))
  })

  it('returns the case list link saved in session', () => {
    const request = mock<Request>({
      session: {
        caseListUrl: '/?foo=bar&qux=0',
      },
    })

    expect(getActiveCaseListUrl(request)).toEqual('/?foo=bar&qux=0')
  })
})
describe('getActiveCaseListSegment', () => {
  const pagePattern = 'page-Pattern'
  const mockRequest = (referer: string, lastStoredReferer: string) =>
    mock<Request & { session: Session }>({
      headers: { referer },
      session: {
        pageReferers: lastStoredReferer
          ? {
              [pagePattern]: lastStoredReferer,
            }
          : undefined,
      },
    })
  it('returns the base case list link if none is in session', () => {
    const request = mock<Request>({path:undefined})

    expect(getActiveCaseListSegment(request)).toEqual('cases')
  })

  it('returns the case list link saved in session', () => {
    const request = mock<Request>({
      path: '/cases',
      session: {
        caseListUrl: '/?foo=bar&qux=0',
      },
    })

    expect(getActiveCaseListSegment(request)).toEqual('cases')
  })
})

// todo
describe('setActiveCaseListUrl', () => {
  it('sets the given case list link in session', () => {
    const request = mock<Request>({
      query: {
        teamCode: 'YES',
        a: 'b',
        peopleType: 'NFA_RISK',
      },
      path: '/cases/?teamCode=YES&a=b',
    })

    setActiveCaseListUrl(request)

    expect(request.session.caseListUrl).toEqual('/?teamCode=YES&a=b&peopleType=NFA_RISK')
  })
})

