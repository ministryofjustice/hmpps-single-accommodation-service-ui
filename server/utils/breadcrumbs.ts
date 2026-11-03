import { CaseDto } from '@sas/api'
import { Request } from 'express'
import { getActiveCaseListSegment, getActiveCaseListUrl } from './navigation'
import { displayName } from './cases'
import paths from '../paths/ui'

const breadcrumbs = (req: Request, caseData?: CaseDto) => {
  const caseListUrl = getActiveCaseListUrl(req)
  const caseListSegment = getActiveCaseListSegment(req)
  return [
    {
      text: caseListSegment === 'cases' ? 'Case list' : 'Custom list',
      href: caseListUrl,
    },
    caseData && {
      text: displayName(caseData, { laoFlag: '' }),
      href: paths.cases.show({ caseListUrl: caseListSegment, crn: caseData.crn }),
    },
  ].filter(Boolean)
}
export default breadcrumbs
