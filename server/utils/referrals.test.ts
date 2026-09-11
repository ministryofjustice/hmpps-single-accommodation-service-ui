import { referralFactory } from '../testutils/factories'
import { referralHistoryRows, referralHistoryTable } from './referrals'
import config from '../config'

describe('referrals utilities', () => {
  beforeEach(() => {
    config.flags.cas2Enabled = false
  })

  const referral1 = referralFactory.build({
    id: '123456',
    type: 'CAS1',
    status: 'CANCELLED',
    date: '2023-01-15',
    uiUrl: 'https://example.com/cas1/123456',
    referredBy: { username: 'alice_smith', name: 'Alice Smith' },
  })
  const referral2 = referralFactory.build({
    id: '789012',
    type: 'DTR',
    status: 'WITHDRAWN',
    placementStatus: 'PRIORITY_NEED',
    referralRejectionReason: 'NEW_REFERRAL',
    date: '2023-02-20',
    referredBy: { username: 'joe_bloggs', name: 'Joe Bloggs' },
  })
  const referral3 = referralFactory.build({
    id: '345678',
    type: 'CAS3',
    status: 'ARCHIVED',
    date: '2023-03-25',
    uiUrl: null,
    referredBy: { username: 'matt_jones', name: 'Matt Jones' },
  })
  const referral4 = referralFactory.build({
    id: '901234',
    type: 'CAS1',
    status: 'REQUEST_WITHDRAWN',
    date: '2023-04-30',
    uiUrl: 'https://example.com/cas1/901234',
    withdrawalReason: 'ChangeInCircumstances',
    referralRejectionReason: 'Some rejection reason',
    referralRejectionReasonDetail: 'Some rejection reason detail',
    referredBy: { username: 'alice_smith', name: 'Alice Smith' },
  })
  const referrals = [referral1, referral2, referral3, referral4]

  describe('referralHistoryRows', () => {
    it('returns formatted rows for a given list of referrals', () => {
      expect(referralHistoryRows(referrals, 'alice_smith', 'CRN123')).toMatchSnapshot()
    })

    it('filters out CAS2 referrals when the feature flag is disabled', () => {
      const cas2Referral = referralFactory.build({ type: 'CAS2' })

      expect(referralHistoryRows([...referrals, cas2Referral], 'alice_smith', 'CRN123')).toHaveLength(4)
    })

    describe('when the cas2 flag is enabled', () => {
      beforeEach(() => {
        config.flags.cas2Enabled = true
      })

      it('includes CAS2 referrals', () => {
        const cas2Referral = referralFactory.build({ type: 'CAS2' })

        expect(referralHistoryRows([...referrals, cas2Referral], 'alice_smith', 'CRN123')).toHaveLength(5)
      })
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
