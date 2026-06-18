import { CaseAction } from '@sas/api'

// eslint-disable-next-line import/prefer-default-export
export const actionsMap: Record<CaseAction['type'], string> = {
  ADD_AND_CONFIRM_PROPOSED_ADDRESS: '',
  ADD_DTR_OUTCOME: '',
  ADD_DTR_REFERRAL_DETAILS: '',
  CONTINUE_APPROVED_PREMISE_APPLICATION: '',
  CREATE_PLACEMENT: '',
  PROVIDE_INFORMATION: '',
  REPLY_TO_CAS3_BEDSPACE_OFFER: '',
  START_APPROVED_PREMISE_APPLICATION: '',
  START_CAS3_REFERRAL: '',
  SUBMIT_CRS_ACCOMMODATION_REFERRAL: '',
  SUBMIT_CRS_REFERRAL: '',
  SUBMIT_DTR_REFERRAL: '',
}
