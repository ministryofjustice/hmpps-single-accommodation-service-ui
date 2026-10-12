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

  it('returns "customList" for the custom list page', () => {
    expect(getActivePage('/custom-list')).toEqual('customList')
  })
  it('returns "customList" for the custom list pages', () => {
    expect(getActivePage('/custom-list/add-crns')).toEqual('customList')
  })
})
