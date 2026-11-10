import { CaseDto } from '@sas/api'
import { Request } from 'express'
import { displayName } from './cases'
import paths from '../paths/ui'
import { getActivePage } from './navigation'

const breadcrumbs = (req: Request, caseData?: CaseDto) => {
  const caseListUrl = req?.session?.caseListUrl || paths.cases.index({})
  const activePage = getActivePage(caseListUrl)
  return [
    {
      text: { 'case-list': 'Case list', 'custom-list': 'Custom list', search: 'Search' }[activePage],
      href: caseListUrl,
    },
    caseData && {
      text: displayName(caseData, { laoFlag: '' }),
      href: paths.cases.show({ crn: caseData.crn }),
    },
  ].filter(Boolean)
}
export default breadcrumbs
