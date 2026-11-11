export type CasCard = {
  status: string
  crn: string
  submissionInfo?: boolean
  action?: string
  actionLink?: 'redirect' | 'application' | 'referral'
  bedspaceOffered?: boolean
  declineReason?: string
  ineligibleInfo?: string
  expectedArrivalInfo?: boolean
  arrivalInfo?: boolean
  notArrivedInfo?: boolean
  placementRequestSubmittedInfo?: boolean
  bookingInfo?: boolean
  declineReasonLabel?: string
  cancellationReason?: string
}
