import { mock } from 'jest-mock-extended'
import { Request } from 'express'
import { getActivePage, setActiveCaseListUrl } from './navigation'

describe('getActivePage', () => {
  it('returns "case-list" for the case list page', () => {
    expect(getActivePage('/')).toEqual('case-list')
  })

  it('returns "search" for the search page', () => {
    expect(getActivePage('/search')).toEqual('search')
  })

  it('returns "cases" for other pages', () => {
    expect(getActivePage('/cases/X123456')).toEqual('case-list')
  })

  it('returns "custom-list" for the custom list page', () => {
    expect(getActivePage('/custom-list')).toEqual('custom-list')
  })
  it('returns "custom-list" for the custom list pages', () => {
    expect(getActivePage('/custom-list/add-crns')).toEqual('custom-list')
  })
})
describe('setActiveCaseListUrl', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sets the case list URL to / when path is /cases', () => {
    const request = mock<Request>({
      query: {
        teamCode: 'YES',
        a: 'b',
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/cases/?teamCode=YES&a=b',
    })

    setActiveCaseListUrl(request, 'cases')

    expect(request.session.caseListUrl).toEqual('/?teamCode=YES&a=b&peopleType=NFA_RISK')
  })

  it('sets the case list URL to /search when path starts with /search', () => {
    const request = mock<Request>({
      query: {
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/search',
    })

    setActiveCaseListUrl(request, 'search')

    expect(request.session.caseListUrl).toEqual('/search?peopleType=NFA_RISK')
  })

  it('sets the case list URL to /custom-list when path starts with /custom-list', () => {
    const request = mock<Request>({
      query: {
        peopleType: 'NFA_RISK',
      },
      originalUrl: '/custom-list',
    })

    setActiveCaseListUrl(request, 'custom-list')

    expect(request.session.caseListUrl).toEqual('/custom-list?peopleType=NFA_RISK')
  })
})
