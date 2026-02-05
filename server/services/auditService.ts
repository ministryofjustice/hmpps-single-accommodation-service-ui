import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  CASES_LIST = 'CASES_LIST',
  CASE_PROFILE_TRACKER = 'CASE_PROFILE_TRACKER',

  ADD_PROPOSED_ADDRESS_DETAILS = 'ADD_PROPOSED_ADDRESS_DETAILS',
  ADD_PROPOSED_ADDRESS_TYPE = 'ADD_PROPOSED_ADDRESS_TYPE',
  ADD_PROPOSED_ADDRESS_STATUS = 'ADD_PROPOSED_ADDRESS_STATUS',
  ADD_PROPOSED_ADDRESS_CONFIRMATION = 'ADD_PROPOSED_ADDRESS_CONFIRMATION',
  ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS = 'ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS',
}

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
