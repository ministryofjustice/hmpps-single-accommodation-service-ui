import { getActivePage } from './navigation'

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
})
