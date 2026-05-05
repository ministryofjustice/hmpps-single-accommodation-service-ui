import { EligibilityDto, Cas1ServiceResult, Cas3ServiceResult, DtrServiceResult } from '@sas/api'
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import crn from '../crn'
import serviceResultFactory from './serviceResult'
import dtrSubmissionFactory from './dutyToReferSubmission'

const caseActions = [
  'Confirm next address',
  'Add DTR outcome',
  'Add proposed address',
  'Start CAS3 referral',
  'Submit a CRS referral',
  'Consider home visit',
]

export default Factory.define<EligibilityDto>(() => {
  const allServiceResults: { cas1: Cas1ServiceResult; cas3: Cas3ServiceResult; dtr: DtrServiceResult } = {
    cas1: { serviceResult: serviceResultFactory.notEligible().build() },
    cas3: { serviceResult: serviceResultFactory.notEligible().build() },
    dtr: { serviceResult: serviceResultFactory.notStarted().build() },
  }

  const eligibleService = faker.helpers.arrayElement(Object.keys(allServiceResults)) as keyof typeof allServiceResults

  if (eligibleService === 'dtr') {
    const serviceResult = serviceResultFactory.dtr().build()
    allServiceResults.dtr = {
      serviceResult,
      ...(serviceResult.serviceStatus !== 'NOT_STARTED' && { submission: dtrSubmissionFactory.build() }),
    }
  } else {
    allServiceResults[eligibleService] = { serviceResult: serviceResultFactory.build() }
  }

  return {
    crn: crn(),
    caseActions: faker.helpers.arrayElements(caseActions, { min: 1, max: 3 }),
    ...allServiceResults,
  }
})
