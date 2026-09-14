import { actionFactory } from '../testutils/factories'
import { renderActions } from './actions'
import config from '../config'

describe('action utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-06'))
  })

  describe('renderActions', () => {
    beforeEach(() => {
      config.flags.cas2Enabled = false
    })

    it('renders a list of actions', () => {
      const actions = [
        actionFactory.build({ type: 'CREATE_PLACEMENT', service: 'CAS1', startDate: null }),
        actionFactory.build({ type: 'PROVIDE_INFORMATION', service: 'CAS1', startDate: '2026-06-06' }),
        actionFactory.build({ type: 'START_APPROVED_PREMISE_APPLICATION', service: 'CAS1', startDate: '2026-06-07' }),
        actionFactory.build({
          type: 'CONTINUE_APPROVED_PREMISE_APPLICATION',
          service: 'CAS1',
          startDate: '2026-07-06',
        }),
        actionFactory.build({ type: 'START_CAS3_REFERRAL', service: 'CAS3', startDate: '2026-07-29' }),
        actionFactory.build({ type: 'REPLY_TO_CAS3_BEDSPACE_OFFER', service: 'CAS3', startDate: '2026-08-06' }),
      ]

      expect(renderActions(actions)).toMatchSnapshot()
    })

    it('renders an empty list if actions is undefined', () => {
      expect(renderActions()).toEqual([])
    })

    it('filters out CAS2 actions', () => {
      const actions = [
        actionFactory.build({ type: 'START_CAS2_APPLICATION', service: 'CAS2', startDate: '2026-06-07' }),
        actionFactory.build({ type: 'START_APPROVED_PREMISE_APPLICATION', service: 'CAS1', startDate: '2026-06-07' }),
      ]

      expect(renderActions(actions)).toEqual([expect.stringContaining('approved premises')])
    })

    describe('when the cas2 flag is enabled', () => {
      beforeEach(() => {
        config.flags.cas2Enabled = true
      })

      afterEach(() => {
        jest.restoreAllMocks()
      })

      it('includes CAS2 actions', () => {
        const actions = [
          actionFactory.build({ type: 'START_CAS2_APPLICATION', service: 'CAS2', startDate: '2026-06-07' }),
          actionFactory.build({ type: 'START_APPROVED_PREMISE_APPLICATION', service: 'CAS1', startDate: '2026-06-07' }),
        ]

        expect(renderActions(actions)).toHaveLength(2)
      })
    })
  })
})
