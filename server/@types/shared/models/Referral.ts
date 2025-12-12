import { CasReferralStatus } from './CasReferralStatus'
import { CasType } from './CasType'

export type Referral = {
  id: string
  type: CasType
  status: CasReferralStatus
  date: string
}
