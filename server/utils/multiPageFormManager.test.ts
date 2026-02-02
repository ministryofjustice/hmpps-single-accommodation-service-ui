import { mock } from 'jest-mock-extended'
import { Request } from 'express'
import MultiPageFormManager from './multiPageFormManager'

describe('multiPageFormManager', () => {
  let formData: MultiPageFormManager<'proposedAddress'>
  let mockSession: Request['session']
  const crn = 'CRN123'

  beforeEach(() => {
    formData = new MultiPageFormManager('proposedAddress')

    mockSession = mock<Request['session']>()
    mockSession.multiPageFormData = {
      proposedAddress: {
        [crn]: {
          arrangementSubType: 'FRIENDS_OR_FAMILY',
          settledType: 'SETTLED',
        },
      },
    }
    mockSession.save = jest.fn().mockImplementation(callback => (callback ? callback() : undefined))
  })

  it('returns the session data for the given item', () => {
    expect(formData.get(crn, mockSession)).toEqual(mockSession.multiPageFormData.proposedAddress[crn])
  })

  it('returns undefined if the given item does not exist', () => {
    expect(formData.get('wrong-crn', mockSession)).toEqual(undefined)
  })

  it('updates the data provided against the correct id and forces a session save', async () => {
    const updated = await formData.update(crn, mockSession, { arrangementSubType: 'FRIENDS_OR_FAMILY' })

    expect(updated).toEqual(expect.objectContaining({ arrangementSubType: 'FRIENDS_OR_FAMILY' }))
    expect(mockSession.save).toHaveBeenCalled()
    expect(formData.get(crn, mockSession)).toEqual(expect.objectContaining({ arrangementSubType: 'FRIENDS_OR_FAMILY' }))
  })

  it('removes the data for the provided id only and forces a session save', async () => {
    await formData.remove(crn, mockSession)

    expect(formData.get(crn, mockSession)).toEqual(undefined)
    expect(mockSession.save).toHaveBeenCalled()
  })
})
