import { actionFactory } from '../testutils/factories'
import { renderActions } from './actions'

describe('action utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-06'))
  })

  describe('renderActions', () => {
    it('renders a list of actions', () => {
      const actions = [
        actionFactory.build({ type: 'CREATE_PLACEMENT', startDate: null }),
        actionFactory.build({ type: 'PROVIDE_INFORMATION', startDate: '2026-06-06' }),
        actionFactory.build({ type: 'START_APPROVED_PREMISE_APPLICATION', startDate: '2026-06-07' }),
        actionFactory.build({ type: 'CONTINUE_APPROVED_PREMISE_APPLICATION', startDate: '2026-07-06' }),
        actionFactory.build({ type: 'START_CAS3_REFERRAL', startDate: '2026-07-29' }),
        actionFactory.build({ type: 'REPLY_TO_CAS3_BEDSPACE_OFFER', startDate: '2026-08-06' }),
      ]

      expect(renderActions(actions)).toMatchSnapshot()
    })

    it('renders an empty list if actions is undefined', () => {
      expect(renderActions()).toEqual([])
    })
  })
})
