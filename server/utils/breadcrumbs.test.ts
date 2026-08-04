import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import { breadcrumbs } from './breadcrumbs'
import { caseFactory } from '../testutils/factories'

describe('breadcrumbs', () => {
  let request: Request
  const caseListUrl = '/case-list'

  beforeEach(() => {
    request = mock<Request>({ session: { caseListUrl } })
  })

  it('renders a single breadcrumb item for the case list page', () => {
    expect(breadcrumbs(request)).toEqual([{ text: 'Case list', href: '/case-list' }])
  })

  it('renders breadcrumb items for the case list page and the profile page if case data is provided', () => {
    const caseData = caseFactory.build({
      crn: 'A123321',
      forename: 'John',
      surname: 'Smith',
      limitedAccess: true,
    })

    expect(breadcrumbs(request, caseData)).toEqual([
      { text: 'Case list', href: '/case-list' },
      { text: 'John Smith', href: '/cases/A123321' },
    ])
  })
})
