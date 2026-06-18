import { CaseAction } from '@sas/api'

export const actionsMap: Record<CaseAction['type'], string> = {
  ADD_AND_CONFIRM_PROPOSED_ADDRESS: 'Add and confirm proposed address',
  ADD_DTR_OUTCOME: 'Add DTR referral outcome',
  ADD_DTR_REFERRAL_DETAILS: 'Add DTR referral details',
  CONTINUE_APPROVED_PREMISE_APPLICATION: 'Continue an approved premises (CAS1) application',
  CREATE_PLACEMENT: 'Create an approved premises (CAS1) placement request',
  PROVIDE_INFORMATION: 'Provide further information on an approved premises (CAS1) application',
  REPLY_TO_CAS3_BEDSPACE_OFFER: 'Reply to CAS3 bedspace offer',
  START_APPROVED_PREMISE_APPLICATION: 'Start an approved premises (CAS1) application',
  START_CAS3_REFERRAL: 'Start a CAS3 referral',
  SUBMIT_CRS_ACCOMMODATION_REFERRAL: 'Submit a CRS accommodation referral',
  SUBMIT_CRS_REFERRAL: 'Submit a CRS referral',
  SUBMIT_DTR_REFERRAL: 'Submit a DTR referral',
}

export const renderActions = (actions: CaseAction[]): string[] => actions.map(action => actionsMap[action.type])
