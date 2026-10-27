export type CasCard = {
  status: string
  crn: string
  submissionInfo?: boolean
  action: string
  actionLink: 'redirect' | 'application'
  declineReason?: string
  expectedArrivalInfo?: boolean
  arrivalInfo?: boolean
}
