import { mock } from 'jest-mock-extended'
import { Request, Response } from 'express'
import { getActivePage, getCaseListUrl, setActiveCaseListTab, setCaseListFilters } from './navigation'

describe('getActivePage', () => {
  it('returns "case-list" for the case list page', () => {
    const req = mock<Request>({
      session: { caseListUrl: '/' },
    })
    expect(getActivePage(req)).toEqual('case-list')
  })

  it('returns "search" for the search page', () => {
    const req = mock<Request>({
      session: { caseListUrl: '/search' },
    })
    expect(getActivePage(req)).toEqual('search')
  })

  it('returns "cases" for other pages', () => {
    const req = mock<Request>({
      session: { caseListUrl: '/cases/X123456' },
    })
    expect(getActivePage(req)).toEqual('case-list')
  })

  it('returns "custom-list" for the custom list page', () => {
    const req = mock<Request>({
      session: { caseListUrl: '/custom-list' },
    })
    expect(getActivePage(req)).toEqual('custom-list')
  })
  it('returns "custom-list" for the custom list pages', () => {
    const req = mock<Request>({
      session: { caseListUrl: '/custom-list/add-crns' },
    })
    expect(getActivePage(req)).toEqual('custom-list')
  })
})
describe('setActiveCaseListUrl', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('sets the case list URL to / when path is /cases', () => {
    const request = mock<Request>({})

    const res = mock<Response>()
    setActiveCaseListTab(request, res, 'case-list')

    expect(request.session.caseListUrl).toEqual('/')
    expect(getCaseListUrl(request)).toEqual('/')
  })

  it('sets the case list URL to /search when path starts with /search', () => {
    const request = mock<Request>({})

    const res = mock<Response>()
    setActiveCaseListTab(request, res, 'search')

    expect(request.session.caseListUrl).toEqual('/search')
    expect(getCaseListUrl(request)).toEqual('/search')
  })

  it('sets the case list URL to /custom-list when path starts with /custom-list', () => {
    const request = mock<Request>({})

    const res = mock<Response>()
    setActiveCaseListTab(request, res, 'custom-list')

    expect(request.session.caseListUrl).toEqual('/custom-list')
    expect(getCaseListUrl(request)).toEqual('/custom-list')
  })
})

describe('setCaseListFilters', () => {
  it('sets the case list filters to the query string when peopleType is present', () => {
    const request = mock<Request>({
      query: {
        teamCode: 'YES',
        a: 'b',
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/cases/?teamCode=YES&a=b',
    })

    setCaseListFilters(request)

    expect(request.session.caseListFilters).toEqual('teamCode=YES&a=b&peopleType=NFA_RISK')
    expect(getCaseListUrl(request)).toEqual('/?teamCode=YES&a=b&peopleType=NFA_RISK')
  })
})
