import { mock } from 'jest-mock-extended'
import { Request } from 'express'
import { getActivePage, getActiveCaseListUrl, getActiveCaseListSegment, setActiveCaseListUrl } from './navigation'
import uiPaths from '../paths/ui'

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
  it('returns "cases" when path is /cases', () => {
    const request = mock<Request>({
      originalUrl: '/cases',
      session: {
        caseListUrl: '/?foo=bar&qux=0',
      },
    })

    expect(getActiveCaseListSegment(request)).toEqual('cases')
  })

  it('returns "search" when path starts with /search', () => {
    const request = mock<Request>({ originalUrl: '/search' })

    expect(getActiveCaseListSegment(request)).toEqual('search')
  })

  it('returns "custom-list" when path starts with /custom-list', () => {
    const request = mock<Request>({ originalUrl: '/custom-list' })

    expect(getActiveCaseListSegment(request)).toEqual('custom-list')
  })
})

describe('setActiveCaseListUrl', () => {
  it('sets the case list URL to / when path is /cases', () => {
    const request = mock<Request>({
      query: {
        teamCode: 'YES',
        a: 'b',
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/cases/?teamCode=YES&a=b',
    })

    setActiveCaseListUrl(request)

    expect(request.session.caseListUrl).toEqual('/?teamCode=YES&a=b&peopleType=NFA_RISK')
  })

  it('sets the case list URL to /search when path starts with /search', () => {
    const request = mock<Request>({
      query: {
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/search',
    })

    setActiveCaseListUrl(request)

    expect(request.session.caseListUrl).toEqual('/search?peopleType=NFA_RISK')
  })

  it('sets the case list URL to /custom-list when path starts with /custom-list', () => {
    const request = mock<Request>({
      query: {
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/custom-list',
    })

    setActiveCaseListUrl(request)

    expect(request.session.caseListUrl).toEqual('/custom-list?peopleType=NFA_RISK')
  })
})
