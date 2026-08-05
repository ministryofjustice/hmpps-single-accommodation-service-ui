import { CaseDto } from '@sas/api'
import { Request } from 'express'
import { getCaseListUrl } from './backlinks'
import { displayName } from './cases'
import paths from '../paths/ui'

// eslint-disable-next-line import/prefer-default-export
export const breadcrumbs = (req: Request, caseData?: CaseDto) =>
  [
    {
      text: 'Case list',
      href: getCaseListUrl(req),
    },
    caseData && {
      text: displayName(caseData, { laoFlag: '' }),
      href: paths.cases.show({ crn: caseData.crn }),
    },
  ].filter(Boolean)
