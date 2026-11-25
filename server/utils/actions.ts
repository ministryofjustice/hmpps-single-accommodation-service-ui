import { CaseAction, EligibilityV2Dto, ServiceResultV2 } from '@sas/api'
import { formatDate } from './dates'
import config from '../config'

export const actionsMap: Record<CaseAction['type'], string> = {
  START_PPC: 'Start PPC',
  ADD_AND_CONFIRM_PROPOSED_ADDRESS: 'Add and confirm proposed address',
  ADD_DTR_OUTCOME: 'Add DTR referral outcome',
  ADD_DTR_REFERRAL_DETAILS: 'Add DTR referral details',
  CONTINUE_APPROVED_PREMISE_APPLICATION: 'Continue an approved premises (CAS1) application',
  START_CAS2_REFERRAL: 'Start a CAS2 referral',
  CONTINUE_A_CAS2_REFERRAL: 'Continue a CAS2 referral',
  PROVIDE_MORE_INFORMATION_FOR_CAS2_REFERRAL: 'Provide more information for the CAS2 referral',
  REPLY_TO_CAS2_PLACE_OFFER: 'Reply to CAS2 place offer',
  CREATE_PLACEMENT: 'Create an approved premises (CAS1) placement request',
  PROVIDE_INFORMATION: 'Provide further information on an approved premises (CAS1) application',
  REPLY_TO_CAS3_BEDSPACE_OFFER: 'Reply to CAS3 bedspace offer',
  START_APPROVED_PREMISE_APPLICATION: 'Start an approved premises (CAS1) application',
  START_CAS3_REFERRAL: 'Start a CAS3 referral',
  CONTINUE_CAS3_REFERRAL: 'Continue CAS3 referral',
  SUBMIT_CRS_ACCOMMODATION_REFERRAL: 'Submit a CRS accommodation referral',
  SUBMIT_CRS_REFERRAL: 'Submit a CRS referral',
  SUBMIT_DTR_REFERRAL: 'Submit a DTR referral',
}

const statusActions: Partial<Record<ServiceResultV2['serviceStatus'], CaseAction['type']>> = {
  PPC_NOT_STARTED: 'START_PPC',
  CAS1_UPCOMING: 'START_APPROVED_PREMISE_APPLICATION',
  CAS1_NOT_STARTED: 'START_APPROVED_PREMISE_APPLICATION',
  CAS1_NOT_SUBMITTED: 'CONTINUE_APPROVED_PREMISE_APPLICATION',
  CAS1_INFO_REQUESTED: 'PROVIDE_INFORMATION',
  CAS1_NOT_ARRIVED: 'CREATE_PLACEMENT',
  CAS1_PLACEMENT_CANCELLED: 'CREATE_PLACEMENT',
  CAS1_PLACEMENT_REQUEST_NOT_STARTED: 'CREATE_PLACEMENT',
  CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED: 'CREATE_PLACEMENT',
  CAS1_PLACEMENT_REQUEST_WITHDRAWN: 'CREATE_PLACEMENT',
  CAS1_PLACEMENT_REQUEST_REJECTED: 'CREATE_PLACEMENT',
  CAS1_APPLICATION_REJECTED: 'START_APPROVED_PREMISE_APPLICATION',
  CAS2_NOT_STARTED: 'START_CAS2_REFERRAL',
  CAS2_NOT_SUBMITTED: 'CONTINUE_A_CAS2_REFERRAL',
  CAS2_UPCOMING: 'START_CAS2_REFERRAL',
  CAS2_MORE_INFORMATION_NEEDED: 'PROVIDE_MORE_INFORMATION_FOR_CAS2_REFERRAL',
  CAS2_PLACE_OFFERED: 'REPLY_TO_CAS2_PLACE_OFFER',
  CAS3_UPCOMING: 'START_CAS3_REFERRAL',
  CAS3_NOT_STARTED: 'START_CAS3_REFERRAL',
  CAS3_NOT_STARTED_NEW: 'START_CAS3_REFERRAL',
  CAS3_NOT_SUBMITTED: 'CONTINUE_CAS3_REFERRAL',
  CAS3_REJECTED: 'START_CAS3_REFERRAL',
  CAS3_BEDSPACE_OFFERED: 'REPLY_TO_CAS3_BEDSPACE_OFFER',
  CRS_NOT_STARTED_REFERRAL: 'SUBMIT_CRS_REFERRAL',
  CRS_NOT_STARTED_ACCOMMODATION_REFERRAL: 'SUBMIT_CRS_ACCOMMODATION_REFERRAL',
  CRS_UPCOMING_ACCOMMODATION_REFERRAL: 'SUBMIT_CRS_ACCOMMODATION_REFERRAL',
  CRS_UPCOMING_REFERRAL: 'SUBMIT_CRS_REFERRAL',
  DTR_SUBMITTED: 'ADD_DTR_OUTCOME',
  DTR_UPCOMING: 'SUBMIT_DTR_REFERRAL',
  DTR_NOT_STARTED: 'ADD_DTR_REFERRAL_DETAILS',
  PA_NOT_STARTED: 'ADD_AND_CONFIRM_PROPOSED_ADDRESS',
}

export const formatAction = (type: CaseAction['type'], startDate?: string | null): string =>
  `${actionsMap[type]}${startDate ? ` <time datetime="${startDate}" title="${formatDate(startDate)}">${formatDate(startDate, 'days ago/in')}</time>` : ''}`

export const renderActions = (eligibility?: EligibilityV2Dto): string[] => {
  if (!eligibility) return []

  const services = [
    { service: 'PPC', ...eligibility.ppc },
    { service: 'DTR', ...eligibility.dtr },
    { service: 'CRS', ...eligibility.crs },
    { service: 'CAS1', ...eligibility.cas1 },
    { service: 'CAS2', ...eligibility.cas2 },
    { service: 'CAS3', ...eligibility.cas3 },
    { service: 'PA', ...eligibility.pa },
  ] satisfies Array<{ service: CaseAction['service']; serviceResult: ServiceResultV2; actionPosition: number }>

  return services
    .filter(({ actionPosition, service }) => actionPosition !== -1 && (config.flags.cas2Enabled || service !== 'CAS2'))
    .sort((a, b) => a.actionPosition - b.actionPosition)
    .flatMap(({ serviceResult }) => {
      const type = statusActions[serviceResult.serviceStatus]
      return type ? [formatAction(type, serviceResult.actionStartDate)] : []
    })
}
