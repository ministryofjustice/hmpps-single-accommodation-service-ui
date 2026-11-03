import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import breadcrumbs from './breadcrumbs'
import { caseFactory } from '../testutils/factories'

describe('breadcrumbs', () => {
  const caseData = caseFactory.build({
    crn: 'A123321',
    forename: 'John',
    surname: 'Smith',
    limitedAccess: true,
  })

  describe('case list', () => {
    it('renders a single breadcrumb item for the case list page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/case-list' }, path: '/' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Case list', href: '/case-list' }])
    })

    it('renders breadcrumb items for the case list page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/case-list' }, path: '/cases/A123321' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Case list', href: '/case-list' },
        { text: 'John Smith', href: '/cases/A123321' },
      ])
    })
  })

  describe('custom list', () => {
    it('renders a single breadcrumb item for the custom list page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/custom-list' }, path: '/custom-list' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Custom list', href: '/custom-list' }])
    })

    it('renders breadcrumb items for the custom list page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/custom-list' }, path: '/custom-list' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Custom list', href: '/custom-list' },
        { text: 'John Smith', href: '/custom-list/A123321' },
      ])
    })
  })

  describe('search', () => {
    it('renders a single breadcrumb item for the search page', () => {
      const request = mock<Request>({ session: { caseListUrl: '/search' }, path: '/search' })
      expect(breadcrumbs(request)).toEqual([{ text: 'Custom list', href: '/search' }])
    })

    it('renders breadcrumb items for the search page and the profile page if case data is provided', () => {
      const request = mock<Request>({ session: { caseListUrl: '/search' }, path: '/search' })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: 'Custom list', href: '/search' },
        { text: 'John Smith', href: '/search/A123321' },
      ])
    })
  })
})
