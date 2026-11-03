import { CaseDto } from '@sas/api'
import { Request } from 'express'
import { getActiveCaseListSegment, getActiveCaseListUrl } from './navigation'
import { displayName } from './cases'
import paths from '../paths/ui'

// eslint-disable-next-line import/prefer-default-export
export const breadcrumbs = (req: Request, caseData?: CaseDto) =>{
  const caseListUrl = getActiveCaseListUrl(req)
  const caseListSegment = getActiveCaseListSegment(req)
  //todo need to upadte this.
  return [
    {
      text: caseListSegment == 'cases' ? 'Case list' : 'Custom list',
      href: caseListUrl,
    },
    caseData && {
      text: displayName(caseData, { laoFlag: '' }),
      href: paths.cases.show({ caseListUrl: caseListSegment, crn: caseData.crn }),
    },
  ].filter(Boolean)
}
