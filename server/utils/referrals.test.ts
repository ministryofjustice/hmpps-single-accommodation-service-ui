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
    type: 'CAS2',
    status: 'PENDING',
    date: '2023-02-20',
  })
  const referral3 = referralFactory.build({
    id: '345678',
    type: 'CAS3',
    status: 'REJECTED',
    date: '2023-03-25',
  })
  const referral4 = referralFactory.build({
    id: '901234',
    type: 'CAS2v2',
    status: 'ACCEPTED',
    date: '2023-04-30',
  })
  const referrals = [referral1, referral2, referral3, referral4]

  describe('referralHistoryRows', () => {
    it('returns formatted rows for a given list of referrals', () => {
      expect(referralHistoryRows(referrals)).toMatchSnapshot()
    })
  })

  describe('referralHistoryTable', () => {
    it('returns referral history table for a given list of referrals', () => {
      expect(referralHistoryTable(referrals)).toMatchSnapshot()
    })

    it('returns an empty table when there are no referrals', () => {
      expect(referralHistoryTable([])).toMatchSnapshot()
    })
  })
})
