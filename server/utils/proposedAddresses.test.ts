import { AccommodationDetail } from '@sas/api'
import { accommodationFactory, addressFactory } from '../testutils/factories'
import { proposedAddressStatusCard } from './proposedAddresses'
import { Request } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import { mock } from 'jest-mock-extended'
import {
  summaryListRows,
  updateAddressFromBody,
  validateAddressFromSession,
  updateTypeFromBody,
  validateTypeFromSession,
  updateStatusFromBody,
  validateStatusFromSession,
} from './proposedAddresses'
import { addErrorToFlash } from './validation'
import MultiPageFormManager from './multiPageFormManager'


describe('Proposed addresses utilities', () => {
  describe('proposedAddressStatusCard', () => {
    const baseAccommodationDetails = accommodationFactory.build({
      verificationStatus: 'PASSED',
      createdAt: '2026-01-20T11:00:00.000Z',
      arrangementType: 'PRIVATE',
      arrangementSubType: 'FRIENDS_OR_FAMILY',
      arrangementSubTypeDescription: undefined,
      settledType: 'SETTLED',
      address: addressFactory.minimal().build({
        buildingNumber: '345',
        thoroughfareName: 'Foo Drive',
        dependentLocality: 'Barville',
        county: 'The North',
        postTown: 'Winklechester',
        postcode: 'ZZ1 1ZZ',
      }),
    })

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-21'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns a "checks failed" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        verificationStatus: 'FAILED',
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: "Somebody's attic",
        settledType: 'TRANSIENT',
        createdAt: '2026-01-05T10:45:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it('returns a "not checked yet" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        verificationStatus: 'NOT_CHECKED_YET',
        arrangementSubType: 'OWNED',
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })

    it.each(['NO', 'TO_BE_DECIDED', undefined])(
      'returns a "checks passed" proposed address status card object if the nextAccommodationStatus is %s',
      (nextAccommodationStatus: AccommodationDetail['nextAccommodationStatus']) => {
        const proposedAddress = accommodationFactory.build({
          ...baseAccommodationDetails,
          verificationStatus: 'PASSED',
          nextAccommodationStatus,
          arrangementSubType: 'PRIVATE_RENTED_ROOM',
          settledType: undefined,
          createdAt: '2026-01-20T09:30:00.000Z',
        })
        expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
      },
    )

    it('returns a "confirmed" proposed address status card object', () => {
      const proposedAddress = accommodationFactory.build({
        ...baseAccommodationDetails,
        verificationStatus: 'PASSED',
        nextAccommodationStatus: 'YES',
        arrangementSubType: 'PRIVATE_RENTED_ROOM',
        settledType: undefined,
        createdAt: '2026-01-20T09:30:00.000Z',
      })

      expect(proposedAddressStatusCard(proposedAddress)).toMatchSnapshot()
    })
  })
})

jest.mock('./validation', () => ({
  addErrorToFlash: jest.fn(),
}))

const mockedAddErrorToFlash = addErrorToFlash as jest.MockedFunction<typeof addErrorToFlash>
const crn = 'CRN123'
const formDataManager = mock<MultiPageFormManager<'proposedAddress'>>()
let req: Request

describe('proposedAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    req = mock<Request>({
      params: { crn },
      body: {},
      session: {},
    })
  })

  describe('summaryListRows', () => {
    it('formats address, arrangement and status', () => {
      const data = {
        address: {
          line1: '10 Moonlight Road',
          line2: '',
          city: 'London',
          region: 'Greater London',
          postcode: 'NW1 6XE',
          country: 'UK',
        },
        housingArrangementType: 'FRIEND_OR_FAMILY',
        settledType: 'SETTLED',
        status: 'PASSED',
      } as ProposedAddressFormData

      const rows = summaryListRows(data, 'CRN123', 'James Taylor')

      const addressHtml = rows[0].value.html ?? rows[0].value
      const arrangementHtml = rows[1].value.html ?? rows[1].value

      expect(addressHtml).toBe('10 Moonlight Road<br />London<br />Greater London<br />NW1 6XE<br />UK')
      expect(arrangementHtml).toBe('Friend or family (not tenant or owner)')
      expect(rows[0].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/details')
      expect(rows[1].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/type')
      expect(rows[2].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/type')
      expect(rows[3].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/status')
    })

    it('formats arrangement when other type select', () => {
      const data = {
        housingArrangementType: 'OTHER',
        housingArrangementTypeDescription: 'Hostel',
      } as ProposedAddressFormData

      const rows = summaryListRows(data, 'CRN123', 'James Taylor')

      const arrangementHtml = rows[1].value.html ?? rows[1].value

      expect(arrangementHtml).toBe('Other<br />Hostel')
      expect(rows[2].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/type')
    })
  })

  describe('updateAddressFromBody', () => {
    it('updates form data when address exists', async () => {
      req.body = {
        addressLine1: 'Line 1',
        addressTown: 'Town',
        addressPostcode: 'PC1 1PC',
        addressCountry: 'UK',
      }

      await updateAddressFromBody(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        address: {
          line1: 'Line 1',
          line2: '',
          city: 'Town',
          region: '',
          postcode: 'PC1 1PC',
          country: 'UK',
        },
      })
    })

    it('updates address with empty default values for missing fields', async () => {
      req.body = {
        addressLine2: 'Line 2',
      }
      await updateAddressFromBody(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        address: {
          line1: '',
          line2: 'Line 2',
          city: '',
          region: '',
          postcode: '',
          country: '',
        },
      })
    })

    it('does not update when body is empty', async () => {
      req.body = {}
      await updateAddressFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateAddressFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateAddressFromSession', () => {
    it('returns true for valid address and does not add errors', () => {
      const sessionData = {
        address: {
          line1: 'Line 1',
          line2: 'Line 2',
          city: 'Town',
          region: 'Region',
          postcode: 'AB1 2CD',
          country: 'UK',
        },
      } as ProposedAddressFormData

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedAddErrorToFlash).not.toHaveBeenCalled()
    })

    it('adds errors for blank fields', () => {
      req.body = {}
      const sessionData = { address: {} } as ProposedAddressFormData

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressLine1', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressPostcode', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressTown', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressCountry', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledTimes(4)
    })

    it('adds errors for fields exceeding length limits', () => {
      const sessionData = {
        address: {
          line1: 'x'.repeat(201),
          line2: 'x'.repeat(201),
          city: 'x'.repeat(101),
          region: 'x'.repeat(101),
          postcode: 'x'.repeat(21),
          country: 'x'.repeat(101),
        },
      } as ProposedAddressFormData

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressLine1', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressLine2', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressTown', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressCounty', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressPostcode', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'addressCountry', expect.any(String))
      expect(mockedAddErrorToFlash).toHaveBeenCalledTimes(6)
    })
  })

  describe('updateTypeFromBody', () => {
    it('updates form data when type exists', async () => {
      req.body = {
        housingArrangementType: 'OTHER',
        housingArrangementTypeDescription: 'Some description',
        settledType: 'TRANSIENT',
      }

      await updateTypeFromBody(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        housingArrangementType: 'OTHER',
        housingArrangementTypeDescription: 'Some description',
        settledType: 'TRANSIENT',
      })
    })

    it('updates arrangement with empty default values for missing fields', async () => {
      req.body = {
        housingArrangementType: 'FAILED',
      }
      await updateTypeFromBody(req, formDataManager)
      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        housingArrangementType: 'FAILED',
        housingArrangementTypeDescription: '',
        settledType: '',
      })
    })

    it('does not update when no type provided', async () => {
      req.body = {}
      await updateTypeFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateTypeFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateTypeFromSession', () => {
    it('returns false and adds errors when arrangement type missing', () => {
      const sessionData = { settledType: 'SETTLED' } as ProposedAddressFormData

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'housingArrangementType', expect.any(String))
    })

    it('requires description when type is other', () => {
      const sessionData = { housingArrangementType: 'OTHER', settledType: 'SETTLED' } as ProposedAddressFormData

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'housingArrangementTypeDescription', expect.any(String))
    })

    it('requires settled type', () => {
      const sessionData = { housingArrangementType: 'FRIEND_OR_FAMILY', settledType: '' } as ProposedAddressFormData

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'settledType', expect.any(String))
    })

    it('returns true for valid data', () => {
      const sessionData = {
        housingArrangementType: 'FRIEND_OR_FAMILY',
        settledType: 'SETTLED',
      } as ProposedAddressFormData

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedAddErrorToFlash).not.toHaveBeenCalled()
    })
  })

  describe('updateStatusFromBody', () => {
    it('updates form data when status provided', async () => {
      req.body = { status: 'FAILED' }

      await updateStatusFromBody(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, { status: 'FAILED' })
    })

    it('does not update when status missing', async () => {
      req.body = {}

      await updateStatusFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateStatusFromBody(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateStatusFromSession', () => {
    it('returns false and adds error when status missing', () => {
      const sessionData = {} as ProposedAddressFormData

      const result = validateStatusFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedAddErrorToFlash).toHaveBeenCalledWith(req, 'status', expect.any(String))
    })

    it('returns true when status present', () => {
      const sessionData = { status: 'pending' } as ProposedAddressFormData

      const result = validateStatusFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedAddErrorToFlash).not.toHaveBeenCalled()
    })
  })
})
