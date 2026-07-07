import { referralFactory } from '../testutils/factories'
import { referralHistoryRows, referralHistoryTable, getReferralStatus } from './referrals'

describe('referrals utilities', () => {
  const referral1 = referralFactory.build({
    id: '123456',
    type: 'CAS1',
    placementStatus: 'CANCELLED',
    date: '2023-01-15',
    uiUrl: 'https://example.com/cas1/123456',
    referredBy: { username: 'alice_smith', name: 'Alice Smith' },
  })
  const referral2 = referralFactory.build({
    id: '789012',
    type: 'DTR',
    status: 'WITHDRAWN',
    date: '2023-02-20',
    referredBy: { username: 'joe_bloggs', name: 'Joe Bloggs' },
  })
  const referral3 = referralFactory.build({
    id: '345678',
    type: 'CAS3',
    placementStatus: 'REJECTED',
    date: '2023-03-25',
    uiUrl: null,
    referredBy: { username: 'matt_jones', name: 'Matt Jones' },
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

  describe('getReferralStatus', () => {
    it('returns DTR status', () => {
      const referral = referralFactory.build({ type: 'DTR', status: 'WITHDRAWN' })
      expect(getReferralStatus(referral)).toBe('WITHDRAWN')
    })

    it('returns placementStatus for CAS1 when present', () => {
      const referral = referralFactory.build({
        type: 'CAS1',
        status: 'ACCEPTED',
        placementStatus: 'departed',
      })
      expect(getReferralStatus(referral)).toBe('DEPARTED')
    })

    it('returns CAS1 status when placementStatus is null', () => {
      const referral = referralFactory.build({
        type: 'CAS1',
        status: 'REJECTED',
        placementStatus: null,
      })
      expect(getReferralStatus(referral)).toBe('REJECTED')
    })

    it('returns EXPIRED for CAS1 when status is EXPIRED', () => {
      const referral = referralFactory.build({
        type: 'CAS1',
        status: 'EXPIRED',
        placementStatus: 'DEPARTED',
      })
      expect(getReferralStatus(referral)).toBe('EXPIRED')
    })

    it('returns NOT_ARRIVED for CAS1 when placementStatus is NOTARRIVED', () => {
      const referral = referralFactory.build({
        type: 'CAS1',
        status: 'ACCEPTED',
        placementStatus: 'notarrived',
      })
      expect(getReferralStatus(referral)).toBe('NOT_ARRIVED')
    })

    it('returns requestForPlacementStatus for CAS1 when placementStatus is null', () => {
      const referral = referralFactory.build({
        type: 'CAS1',
        status: 'ACCEPTED',
        placementStatus: null,
        requestForPlacementStatus: 'request_rejected',
      })
      expect(getReferralStatus(referral)).toBe('REQUEST_REJECTED')
    })

    it('returns REJECTED for CAS3 with rejectionReason', () => {
      const referral = referralFactory.build({
        type: 'CAS3',
        status: 'REJECTED',
        referralRejectionReason: 'No suitable accommodation',
        placementStatus: null,
      })
      expect(getReferralStatus(referral)).toBe('REJECTED')
    })

    it('returns ARCHIVED for CAS3 without rejectionReason', () => {
      const referral = referralFactory.build({
        type: 'CAS3',
        status: 'REJECTED',
        referralRejectionReason: null,
        placementStatus: null,
      })
      expect(getReferralStatus(referral)).toBe('ARCHIVED')
    })

    it('returns placementStatus for CAS3 when status is not REJECTED', () => {
      const referral = referralFactory.build({
        type: 'CAS3',
        status: 'PENDING',
        placementStatus: 'cancelled',
      })
      expect(getReferralStatus(referral)).toBe('CANCELLED')
    })
  })
})
