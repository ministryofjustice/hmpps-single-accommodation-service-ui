import { referralFactory } from '../testutils/factories'
import { referralHistoryRows, referralHistoryTable } from './referrals'

describe('referrals utilities', () => {
  const referral1 = referralFactory.build({
    id: '123456',
    type: 'CAS1',
    placementStatus: 'CANCELLED',
    date: '2023-01-15',
    referredBy: { username: 'alice_smith', name: 'Alice Smith' },
  })
  const referral2 = referralFactory.build({
    id: '345678',
    type: 'CAS3',
    placementStatus: 'REJECTED',
    date: '2023-03-25',
    referredBy: { username: 'matt_jones', name: 'Matt Jones' },
  })
  const referral3 = referralFactory.build({
    id: '901234',
    type: 'DTR',
    placementStatus: 'REJECTED',
    date: '2023-04-30',
    referredBy: { username: 'alice_smith', name: 'Alice Smith' },
  })
  const referrals = [referral1, referral2, referral3]

  describe('referralHistoryRows', () => {
    it('returns formatted rows for a given list of referrals', () => {
      expect(referralHistoryRows(referrals, 'alice_smith', 'CRN123')).toMatchSnapshot()
    })
  })

  describe('referralHistoryTable macro', () => {
    it('renders the referral history table for a given list of referrals', () => {
      expect(referralHistoryTable(referrals, 'alice_smith', 'CRN123')).toMatchSnapshot()
    })

    it('renders a message and no table when there are no referrals', () => {
      expect(referralHistoryTable([], 'alice_smith', 'CRN123')).toMatchSnapshot()
    })

    it('renders a message when there is an API error', () => {
      expect(referralHistoryTable(null, 'alice_smith', 'CRN123', true)).toMatchSnapshot()
    })
  })
})
