import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import breadcrumbs from './breadcrumbs'
import { caseFactory } from '../testutils/factories'
import * as navUtils from './navigation'

describe('breadcrumbs', () => {
  const caseData = caseFactory.build({
    crn: 'A123321',
    forename: 'John',
    surname: 'Smith',
    limitedAccess: true,
  })

  const testConfigs = [
    { url: '/', label: 'Case list' },
    { url: '/custom-list', label: 'Custom list' },
    { url: '/search', label: 'Search' },
  ]
  describe.each(testConfigs)('$label', ({ url, label }) => {
    it('renders a single breadcrumb item', () => {
      jest.spyOn(navUtils, 'getCaseListUrl').mockReturnValue(url)
      const request = mock<Request>({ session: { activeCaseListTab: url }, path: url })
      expect(breadcrumbs(request)).toEqual([{ text: label, href: url }])
    })

    it('renders breadcrumb items with case data', () => {
      jest.spyOn(navUtils, 'getCaseListUrl').mockReturnValue(url)
      const request = mock<Request>({ session: { activeCaseListTab: url }, path: url })
      expect(breadcrumbs(request, caseData)).toEqual([
        { text: label, href: url },
        { text: 'John Smith', href: `/cases/A123321` },
      ])
    })
  })
})
