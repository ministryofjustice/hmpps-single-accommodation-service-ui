import { referralFactory } from '../testutils/factories'
import { referralHistoryRows, referralHistoryTable } from './referrals'

describe('referrals utilities', () => {
  const referral1 = referralFactory.build({
    id: '123456',
    type: 'CAS1',
    status: 'ACCEPTED',
    date: '2023-01-15',
  })
  const referral2 = referralFactory.build({
    id: '789012',
    type: 'DTR',
    status: 'WITHDRAWN',
    date: '2023-02-20',
  })
  const referral3 = referralFactory.build({
    id: '345678',
    type: 'CAS3',
    status: 'REJECTED',
    date: '2023-03-25',
  })
  const referrals = [referral1, referral2, referral3]

  describe('referralHistoryRows', () => {
    it('returns formatted rows for a given list of referrals', () => {
      expect(referralHistoryRows(referrals)).toMatchSnapshot()
    })
  })

  describe('referralHistoryTable macro', () => {
    it('renders the referral history table for a given list of referrals', () => {
      expect(referralHistoryTable(referrals)).toMatchSnapshot()
    })

    it('renders a message and no table when there are no referrals', () => {
      expect(referralHistoryTable([])).toMatchSnapshot()
    })

    it('renders a message when there is an API error', () => {
      expect(referralHistoryTable(null, true)).toMatchSnapshot()
    })
  })
})
