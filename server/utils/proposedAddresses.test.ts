import { AccommodationDetail } from '@sas/api'
import { Request } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import { mock } from 'jest-mock-extended'
import {
  proposedAddressStatusCard,
  summaryListRows,
  updateAddressFromRequest,
  validateAddressFromSession,
  updateTypeFromRequest,
  validateTypeFromSession,
  updateStatusFromRequest,
  validateStatusFromSession,
} from './proposedAddresses'
import { accommodationFactory, addressFactory, proposedAddressFormFactory } from '../testutils/factories'
import { validateAndFlashErrors } from './validation'
import MultiPageFormManager from './multiPageFormManager'

jest.mock('./validation', () => ({
  validateAndFlashErrors: jest.fn(),
}))

const mockedValidateAndFlashErrors = validateAndFlashErrors as jest.MockedFunction<typeof validateAndFlashErrors>

const crn = 'CRN123'
const formDataManager = mock<MultiPageFormManager<'proposedAddress'>>()
let req: Request

describe('Proposed addresses utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    req = mock<Request>({
      params: { crn },
      body: {},
      session: {},
    })
  })

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

  describe('summaryListRows', () => {
    it('formats address, arrangement and status', () => {
      const data = {
        address: {
          buildingName: '10 Moonlight Road',
          subBuildingName: '',
          postTown: 'London',
          county: 'Greater London',
          postcode: 'NW1 6XE',
          country: 'UK',
        },
        arrangementSubType: 'FRIENDS_OR_FAMILY',
        settledType: 'SETTLED',
        status: 'PASSED',
      } as ProposedAddressFormData

      const rows = summaryListRows(data, 'CRN123', 'James Taylor')

      const addressHtml = rows[0].value.html ?? rows[0].value
      const arrangementHtml = rows[1].value.html ?? rows[1].value

      expect(addressHtml).toBe('10 Moonlight Road<br />London<br />Greater London<br />NW1 6XE<br />UK')
      expect(arrangementHtml).toBe('Friends or family (not tenant or owner)')
      expect(rows[0].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/details')
      expect(rows[1].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/type')
      expect(rows[2].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/type')
      expect(rows[3].actions?.items[0].href).toBe('/cases/CRN123/proposed-addresses/status')
    })

    it('formats arrangement when other type selected', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: 'Hostel',
      })
      const rows = summaryListRows(sessionData, 'CRN123', 'James Taylor')

      const arrangementHtml = rows[1].value.html ?? rows[1].value

      expect(arrangementHtml).toMatchSnapshot()
    })

    it('formats status when checks failed with reason', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        status: 'FAILED',
      })
      const rows = summaryListRows(sessionData, 'CRN123', 'James Taylor')

      const statusHtml = rows[3].value.html ?? rows[3].value

      expect(statusHtml).toMatchSnapshot()
    })
  })

  describe('updateAddressFromRequest', () => {
    it('updates form data when address exists', async () => {
      req.body = {
        addressLine1: 'Line 1',
        addressTown: 'Town',
        addressPostcode: 'PC1 1PC',
        addressCountry: 'UK',
      }

      await updateAddressFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        address: {
          buildingName: 'Line 1',
          subBuildingName: undefined,
          postTown: 'Town',
          county: undefined,
          postcode: 'PC1 1PC',
          country: 'UK',
        },
      })
    })

    it('updates address with empty default values for missing fields', async () => {
      req.body = {
        addressLine2: 'Line 2',
      }
      await updateAddressFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        address: {
          buildingName: '',
          subBuildingName: 'Line 2',
          postTown: '',
          county: undefined,
          postcode: '',
          country: '',
        },
      })
    })

    it('does not update when body is empty', async () => {
      req.body = {}
      await updateAddressFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateAddressFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateAddressFromSession', () => {
    it('returns true for valid address', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build()
      mockedValidateAndFlashErrors.mockReturnValue(true)

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {})
    })

    it('adds errors for blank fields', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        address: null,
      })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {
        addressLine1: 'Enter address line 1, typically the building and street',
        addressPostcode: 'Enter postcode',
        addressTown: 'Enter town or city',
        addressCountry: 'Enter country',
      })
    })

    it('adds errors for fields exceeding length limits', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        address: {
          buildingName: 'x'.repeat(201),
          subBuildingName: 'x'.repeat(201),
          postTown: 'x'.repeat(101),
          county: 'x'.repeat(101),
          postcode: 'x'.repeat(21),
          country: 'x'.repeat(101),
        },
      })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateAddressFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {
        addressLine1: 'Address line 1 must be 200 characters or less',
        addressLine2: 'Address line 2 must be 200 characters or less',
        addressTown: 'Town or city must be 100 characters or less',
        addressCounty: 'County must be 100 characters or less',
        addressPostcode: 'Postal code or zip code must be 20 characters or less',
        addressCountry: 'Country must be 100 characters or less',
      })
    })
  })

  describe('updateTypeFromRequest', () => {
    it('updates form data when type exists', async () => {
      req.body = {
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: 'Some description',
        settledType: 'TRANSIENT',
      }

      await updateTypeFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: 'Some description',
        settledType: 'TRANSIENT',
      })
    })

    it('updates arrangement with empty default values for missing fields', async () => {
      req.body = {
        arrangementSubType: 'FAILED',
        settledType: '',
      }
      await updateTypeFromRequest(req, formDataManager)
      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, {
        arrangementSubType: 'FAILED',
        arrangementSubTypeDescription: undefined,
        settledType: '',
      })
    })

    it('does not update when no type provided', async () => {
      req.body = {}
      await updateTypeFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateTypeFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateTypeFromSession', () => {
    it('returns false and adds errors when arrangement type missing', () => {
      const sessionData = proposedAddressFormFactory
        .manualAddress()
        .build({ settledType: 'SETTLED', arrangementSubType: undefined })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {
        arrangementSubType: 'Select an arrangement type',
      })
    })

    it('requires description when type is other', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        arrangementSubType: 'OTHER',
        arrangementSubTypeDescription: '',
      })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {
        arrangementSubTypeDescription: 'Enter the other arrangement type',
      })
    })

    it('requires settled type', () => {
      const sessionData = proposedAddressFormFactory
        .manualAddress()
        .build({ arrangementSubType: 'FRIENDS_OR_FAMILY', settledType: undefined })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, { settledType: 'Select a settled type' })
    })

    it('returns true for valid data', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({
        arrangementSubType: 'FRIENDS_OR_FAMILY',
        settledType: 'SETTLED',
      })
      mockedValidateAndFlashErrors.mockReturnValue(true)

      const result = validateTypeFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {})
    })
  })

  describe('updateStatusFromRequest', () => {
    it('updates form data when status provided', async () => {
      req.body = { status: 'FAILED' }

      await updateStatusFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, { status: 'FAILED' })
    })

    it('does not update when status missing', async () => {
      req.body = {}

      await updateStatusFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })

    it('does not update when body is undefined', async () => {
      req.body = undefined
      await updateStatusFromRequest(req, formDataManager)

      expect(formDataManager.update).not.toHaveBeenCalled()
    })
  })

  describe('validateStatusFromSession', () => {
    it('returns false and adds error when status missing', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({ status: undefined })
      mockedValidateAndFlashErrors.mockReturnValue(false)

      const result = validateStatusFromSession(req, sessionData)

      expect(result).toBe(false)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, { status: 'Select a status' })
    })

    it('returns true when status present', () => {
      const sessionData = proposedAddressFormFactory.manualAddress().build({ status: 'PASSED' })
      mockedValidateAndFlashErrors.mockReturnValue(true)

      const result = validateStatusFromSession(req, sessionData)

      expect(result).toBe(true)
      expect(mockedValidateAndFlashErrors).toHaveBeenCalledWith(req, {})
    })
  })
})
