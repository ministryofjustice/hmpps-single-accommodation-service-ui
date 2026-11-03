import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import breadcrumbs from './breadcrumbs'
import { caseFactory } from '../testutils/factories'
import * as navigationUtils from './navigation'

describe('breadcrumbs', () => {
  const caseData = caseFactory.build({
    crn: 'A123321',
    forename: 'John',
    surname: 'Smith',
    limitedAccess: true,
  })
  let caseListUrl = jest.spyOn(navigationUtils, 'getActiveCaseListSegment')

  beforeEach(() => {
    jest.clearAllMocks()
    caseListUrl = jest.spyOn(navigationUtils, 'getActiveCaseListSegment')
  })

  describe('case list', () => {
    beforeEach(() => {
      caseListUrl.mockReturnValue('cases')
    })
    it('renders a single breadcrumb item for the case list page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/case-list' }, originalUrl: '/' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Case list', href: '/case-list' }])
    })

    it('renders breadcrumb items for the case list page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/case-list' }, originalUrl: '/cases/A123321' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Case list', href: '/case-list' },
        { text: 'John Smith', href: '/cases/A123321' },
      ])
    })
  })

  describe('custom list', () => {
    beforeEach(() => {
      caseListUrl.mockReturnValue('custom-list')
    })

    it('renders a single breadcrumb item for the custom list page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/custom-list' }, originalUrl: '/custom-list' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Custom list', href: '/custom-list' }])
    })

    it('renders breadcrumb items for the custom list page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/custom-list' }, originalUrl: '/custom-list' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Custom list', href: '/custom-list' },
        { text: 'John Smith', href: '/custom-list/A123321' },
      ])
    })
  })

  describe('search', () => {
    beforeEach(() => {
      caseListUrl.mockReturnValue('search')
    })

    it('renders a single breadcrumb item for the search page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/search' }, originalUrl: '/search' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Search', href: '/search' }])
    })

    it('renders breadcrumb items for the search page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/search' }, originalUrl: '/search' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Search', href: '/search' },
        { text: 'John Smith', href: '/search/A123321' },
      ])
    })
  })
})
