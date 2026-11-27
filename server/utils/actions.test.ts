import { EligibilityV2Dto, ServiceResultV2 } from '@sas/api'
import { formatAction, renderActions } from './actions'
import config from '../config'

describe('action utilities', () => {
  let originalCas2Enabled: boolean

  beforeEach(() => {
    originalCas2Enabled = config.flags.cas2Enabled
    jest.useFakeTimers().setSystemTime(new Date('2026-06-06'))
  })

  afterEach(() => {
    config.flags.cas2Enabled = originalCas2Enabled
    jest.useRealTimers()
  })

  describe('formatAction', () => {
    it.each([
      [null, 'Create an approved premises (CAS1) placement request'],
      [
        '2026-06-06',
        'Create an approved premises (CAS1) placement request <time datetime="2026-06-06" title="6 June 2026">today</time>',
      ],
      [
        '2026-07-06',
        'Create an approved premises (CAS1) placement request <time datetime="2026-07-06" title="6 July 2026">in 30 days</time>',
      ],
    ])('formats an action with start date %s', (date, expected) => {
      expect(formatAction('CREATE_PLACEMENT', date)).toBe(expected)
    })
  })

  describe('renderActions with eligibility', () => {
    const result = (
      serviceStatus: ServiceResultV2['serviceStatus'],
      actionPosition = -1,
    ): { serviceResult: ServiceResultV2; actionPosition: number } => ({
      serviceResult: { serviceStatus, failureReasons: [] },
      actionPosition,
    })
    const eligibility = (): EligibilityV2Dto => ({
      crn: 'X123456',
      ppc: result('PPC_NOT_REQUIRED'),
      cas1: result('CAS1_SUBMITTED'),
      cas2: result('CAS2_SUBMITTED'),
      cas3: result('CAS3_SUBMITTED'),
      dtr: result('DTR_NOT_REQUIRED'),
      crs: result('CRS_NOT_REQUIRED'),
      pa: result('PA_COMPLETED'),
    })
    beforeEach(() => {
      config.flags.cas2Enabled = false
    })

    it('returns no actions when eligibility is unavailable', () => {
      expect(renderActions()).toEqual([])
    })

    it('orders actions by position and renders the action start date', () => {
      const data = eligibility()
      data.ppc = result('PPC_NOT_STARTED', 2)
      data.cas1 = result('CAS1_UPCOMING', 0)
      data.cas1.serviceResult.actionStartDate = '2026-06-07'
      data.dtr = result('DTR_NOT_STARTED', 1)

      expect(renderActions(data)).toEqual([
        'Start an approved premises (CAS1) application <time datetime="2026-06-07" title="7 June 2026">in 1 day</time>',
        'Add DTR referral details',
        'Start PPC',
      ])
    })

    it('excludes CAS2 actions when the feature flag is disabled', () => {
      const data = eligibility()
      data.cas2 = result('CAS2_PLACE_OFFERED', 0)
      expect(renderActions(data)).toEqual([])
      config.flags.cas2Enabled = true
      expect(renderActions(data)).toEqual(['Reply to CAS2 place offer'])
    })

    it('does not render a status without an action position', () => {
      const data = eligibility()
      data.ppc = result('PPC_NOT_STARTED')
      expect(renderActions(data)).toEqual([])
    })

    const testCases: {
      service: keyof Omit<EligibilityV2Dto, 'crn'>
      statuses: ServiceResultV2['serviceStatus'][]
      action: string
    }[] = [
      { service: 'ppc', statuses: ['PPC_NOT_STARTED'], action: 'Start PPC' },
      {
        service: 'cas1',
        statuses: ['CAS1_UPCOMING', 'CAS1_NOT_STARTED', 'CAS1_APPLICATION_REJECTED'],
        action: 'Start an approved premises (CAS1) application',
      },
      {
        service: 'cas1',
        statuses: ['CAS1_NOT_SUBMITTED'],
        action: 'Continue an approved premises (CAS1) application',
      },
      {
        service: 'cas1',
        statuses: ['CAS1_INFO_REQUESTED'],
        action: 'Provide further information on an approved premises (CAS1) application',
      },
      {
        service: 'cas1',
        statuses: [
          'CAS1_NOT_ARRIVED',
          'CAS1_PLACEMENT_CANCELLED',
          'CAS1_PLACEMENT_REQUEST_NOT_STARTED',
          'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED',
          'CAS1_PLACEMENT_REQUEST_WITHDRAWN',
          'CAS1_PLACEMENT_REQUEST_REJECTED',
        ],
        action: 'Create an approved premises (CAS1) placement request',
      },
      { service: 'cas2', statuses: ['CAS2_NOT_STARTED', 'CAS2_UPCOMING'], action: 'Start a CAS2 referral' },
      { service: 'cas2', statuses: ['CAS2_NOT_SUBMITTED'], action: 'Continue a CAS2 referral' },
      {
        service: 'cas2',
        statuses: ['CAS2_MORE_INFORMATION_NEEDED'],
        action: 'Provide more information for the CAS2 referral',
      },
      { service: 'cas2', statuses: ['CAS2_PLACE_OFFERED'], action: 'Reply to CAS2 place offer' },
      {
        service: 'cas3',
        statuses: ['CAS3_UPCOMING', 'CAS3_NOT_STARTED', 'CAS3_NOT_STARTED_NEW', 'CAS3_REJECTED'],
        action: 'Start a CAS3 referral',
      },
      { service: 'cas3', statuses: ['CAS3_NOT_SUBMITTED'], action: 'Continue CAS3 referral' },
      { service: 'cas3', statuses: ['CAS3_BEDSPACE_OFFERED'], action: 'Reply to CAS3 bedspace offer' },
      {
        service: 'crs',
        statuses: ['CRS_NOT_STARTED_REFERRAL', 'CRS_UPCOMING_REFERRAL'],
        action: 'Submit a CRS referral',
      },
      {
        service: 'crs',
        statuses: ['CRS_NOT_STARTED_ACCOMMODATION_REFERRAL', 'CRS_UPCOMING_ACCOMMODATION_REFERRAL'],
        action: 'Submit a CRS accommodation referral',
      },
      { service: 'dtr', statuses: ['DTR_SUBMITTED'], action: 'Add DTR referral outcome' },
      { service: 'dtr', statuses: ['DTR_UPCOMING'], action: 'Submit a DTR referral' },
      { service: 'dtr', statuses: ['DTR_NOT_STARTED'], action: 'Add DTR referral details' },
      { service: 'pa', statuses: ['PA_NOT_STARTED'], action: 'Add and confirm proposed address' },
    ]

    it.each(
      testCases.flatMap(({ service, statuses, action }) => statuses.map(status => ({ service, status, action }))),
    )('renders the action for $status', ({ service, status, action }) => {
      const data = eligibility()
      data[service] = result(status, 0)
      config.flags.cas2Enabled = true
      expect(renderActions(data)).toEqual([action])
    })
  })
})
