import paths from '../paths/ui'

// eslint-disable-next-line import/prefer-default-export
export const getActivePage = (path: string): string => {
  if (path === paths.cases.search.pattern) return 'search'
  return 'caseList'
}
