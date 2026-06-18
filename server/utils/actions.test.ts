import { actionFactory } from '../testutils/factories'
import { renderActions } from './actions'

describe('action utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09'))
  })

  describe('renderActions', () => {
    it('renders a list of actions', () => {
      const actions = [
        actionFactory.build({ type: 'SUBMIT_CRS_REFERRAL', startDate: null }),
        actionFactory.build({ type: 'CREATE_PLACEMENT', startDate: '2026-06-06' }),
        actionFactory.build({ type: 'ADD_DTR_REFERRAL_DETAILS', startDate: '2026-10-06' }),
      ]

      expect(renderActions(actions)).toMatchSnapshot()
    })
  })
})
