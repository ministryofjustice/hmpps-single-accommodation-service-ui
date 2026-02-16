import { AccommodationDetail } from '@sas/api'
import { Request } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import { mock } from 'jest-mock-extended'
import {
  proposedAddressStatusCard,
  summaryListRows,
  updateAddressFromRequest,
  updateTypeFromRequest,
  updateStatusFromRequest,
  arrangementSubTypeItems,
  nextAccommodationStatusItems,
  verificationStatusItems,
  validateUpToNextAccommodation,
  validateUpToStatus,
  validateUpToType,
  validateUpToAddress,
  updateNextAccommodationFromRequest,
} from './proposedAddresses'
import { accommodationFactory, addressFactory, proposedAddressFormFactory } from '../testutils/factories'
import * as validationUtils from './validation'
import MultiPageFormManager from './multiPageFormManager'
import uiPaths from '../paths/ui'

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
        verificationStatus: 'PASSED',
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
        verificationStatus: 'FAILED',
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
  })

  describe('updateStatusFromRequest', () => {
    it('updates form data when verificationStatus provided', async () => {
      req.body = { verificationStatus: 'FAILED' }

      await updateStatusFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, { verificationStatus: 'FAILED' })
    })
  })

  describe('updateNextAccommodationFromRequest', () => {
    it('updates form data when nextAccommodationStatus provided', async () => {
      req.body = { nextAccommodationStatus: 'YES' }

      await updateNextAccommodationFromRequest(req, formDataManager)

      expect(formDataManager.update).toHaveBeenCalledWith('CRN123', req.session, { nextAccommodationStatus: 'YES' })
    })
  })

  describe('arrangementSubTypeItems', () => {
    it('marks the selected arrangement subtype as checked', () => {
      const items = arrangementSubTypeItems('FRIENDS_OR_FAMILY')

      const selected = items.find(item => item.value === 'FRIENDS_OR_FAMILY')
      const unselected = items.find(item => item.value !== 'FRIENDS_OR_FAMILY')

      expect(selected?.checked).toBe(true)
      expect(unselected?.checked).toBe(false)
    })

    it('marks none as checked when no selection provided', () => {
      const items = arrangementSubTypeItems()

      expect(items.every(item => item.checked === false)).toBe(true)
    })
  })

  describe('verificationStatusItems', () => {
    it('marks PASSED as checked', () => {
      const items = verificationStatusItems('PASSED')

      expect(items).toEqual([
        { value: 'NOT_CHECKED_YET', text: 'Not checked yet', checked: false },
        { value: 'PASSED', text: 'Passed', checked: true },
        { value: 'FAILED', text: 'Failed', checked: false },
      ])
    })

    it('marks none as checked when no selection provided', () => {
      const items = verificationStatusItems()

      expect(items.every(item => item.checked === false)).toBe(true)
    })
  })

  describe('nextAccommodationStatusItems', () => {
    it('marks TO_BE_DECIDED as checked', () => {
      const items = nextAccommodationStatusItems('TO_BE_DECIDED')

      expect(items).toEqual([
        { value: 'YES', text: 'Yes', checked: false },
        { value: 'NO', text: 'No', checked: false },
        { value: 'TO_BE_DECIDED', text: 'Still to be decided', checked: true },
      ])
    })

    it('marks none as checked when no selection provided', () => {
      const items = nextAccommodationStatusItems()

      expect(items.every(item => item.checked === false)).toBe(true)
    })
  })

  describe('validateUpTo*', () => {
    const validAddress = {
      buildingName: '1 Street',
      subBuildingName: '3 Lane',
      postTown: 'Town',
      county: 'Some County',
      postcode: 'AB1 2CD',
      country: 'UK',
    }

    const validUpToAddress = (): ProposedAddressFormData =>
      ({
        address: validAddress,
      }) as ProposedAddressFormData

    const validUpToType = (): ProposedAddressFormData =>
      ({
        ...validUpToAddress(),
        arrangementSubType: 'FRIENDS_OR_FAMILY',
        arrangementSubTypeDescription: undefined,
        settledType: 'SETTLED',
      }) as ProposedAddressFormData

    const validUpToStatusNotPassed = (): ProposedAddressFormData =>
      ({
        ...validUpToType(),
        verificationStatus: 'NOT_CHECKED_YET',
      }) as ProposedAddressFormData

    const validUpToStatusPassed = (): ProposedAddressFormData =>
      ({
        ...validUpToType(),
        verificationStatus: 'PASSED',
      }) as ProposedAddressFormData

    beforeEach(() => {
      jest.restoreAllMocks()
    })

    describe('validateUpToAddress', () => {
      it.each([
        {
          name: 'redirects to details when address invalid',
          data: { address: { ...validAddress, buildingName: '' } },
          expected: uiPaths.proposedAddresses.details({ crn }),
        },
        {
          name: 'returns undefined when address valid',
          data: validUpToAddress(),
          expected: undefined,
        },
      ])('$name', ({ data, expected }) => {
        expect(validateUpToAddress(req, data as ProposedAddressFormData)).toBe(expected)
      })

      it('flashes errors when address invalid', () => {
        const validateAndFlashErrorsSpy = jest.spyOn(validationUtils, 'validateAndFlashErrors')

        validateUpToAddress(req, {
          address: { ...validAddress, buildingName: '', postTown: '', postcode: '', country: '' },
        } as ProposedAddressFormData)

        expect(validateAndFlashErrorsSpy).toHaveBeenCalledWith(
          req,
          expect.objectContaining({
            addressLine1: 'Enter address line 1, typically the building and street',
            addressTown: 'Enter town or city',
            addressPostcode: 'Enter postcode',
            addressCountry: 'Enter country',
          }),
        )
      })
    })

    describe('validateUpToType', () => {
      it.each([
        {
          name: 'redirects to details when address invalid',
          data: { address: { ...validAddress, postcode: '' } } as ProposedAddressFormData,
          expected: uiPaths.proposedAddresses.details({ crn }),
        },
        {
          name: 'redirects to type when type missing',
          data: validUpToAddress(),
          expected: uiPaths.proposedAddresses.type({ crn }),
        },
        {
          name: 'redirects to type when settledType missing',
          data: { ...validUpToAddress(), arrangementSubType: 'FRIENDS_OR_FAMILY' } as ProposedAddressFormData,
          expected: uiPaths.proposedAddresses.type({ crn }),
        },
        {
          name: 'redirects to type when OTHER selected without description',
          data: {
            ...validUpToAddress(),
            arrangementSubType: 'OTHER',
            settledType: 'SETTLED',
            arrangementSubTypeDescription: undefined,
          } as ProposedAddressFormData,
          expected: uiPaths.proposedAddresses.type({ crn }),
        },
        {
          name: 'returns undefined when address + type valid',
          data: validUpToType(),
          expected: undefined,
        },
      ])('$name', ({ data, expected }) => {
        expect(validateUpToType(req, data)).toBe(expected)
      })

      it('flashes errors when arrangement type and settled type are missing', () => {
        const validateAndFlashErrorsSpy = jest.spyOn(validationUtils, 'validateAndFlashErrors')

        validateUpToType(req, { ...validUpToAddress(), arrangementSubType: undefined, settledType: undefined })

        expect(validateAndFlashErrorsSpy).toHaveBeenCalledWith(
          req,
          expect.objectContaining({
            arrangementSubType: 'Select an arrangement type',
            settledType: 'Select a settled type',
          }),
        )
      })

      it('flashes errors when OTHER arrangement type selected without description', () => {
        const validateAndFlashErrorsSpy = jest.spyOn(validationUtils, 'validateAndFlashErrors')

        validateUpToType(req, {
          ...validUpToAddress(),
          arrangementSubType: 'OTHER',
          settledType: 'SETTLED',
          arrangementSubTypeDescription: undefined,
        })

        expect(validateAndFlashErrorsSpy).toHaveBeenCalledWith(
          req,
          expect.objectContaining({
            arrangementSubTypeDescription: 'Enter the other arrangement type',
          }),
        )
      })
    })

    describe('validateUpToStatus', () => {
      it.each([
        {
          name: 'redirects to details when address invalid',
          data: { address: { ...validAddress, country: '' } } as ProposedAddressFormData,
          expected: uiPaths.proposedAddresses.details({ crn }),
        },
        {
          name: 'redirects to type when type invalid',
          data: validUpToAddress(),
          expected: uiPaths.proposedAddresses.type({ crn }),
        },
        {
          name: 'redirects to status when verification status missing',
          data: validUpToType(),
          expected: uiPaths.proposedAddresses.status({ crn }),
        },
        {
          name: 'returns undefined when address + type + status valid',
          data: validUpToStatusNotPassed(),
          expected: undefined,
        },
      ])('$name', ({ data, expected }) => {
        expect(validateUpToStatus(req, data)).toBe(expected)
      })

      it('flashes errors when verification status missing', () => {
        const validateAndFlashErrorsSpy = jest.spyOn(validationUtils, 'validateAndFlashErrors')
        validateUpToStatus(req, validUpToType())

        expect(validateAndFlashErrorsSpy).toHaveBeenCalledWith(
          req,
          expect.objectContaining({
            verificationStatus: 'Select a status',
          }),
        )
      })
    })

    describe('validateUpToNextAccommodation', () => {
      it.each([
        {
          name: 'redirects to details when address invalid',
          data: { address: { ...validAddress, buildingName: '' } } as ProposedAddressFormData,
          expected: uiPaths.proposedAddresses.details({ crn }),
        },
        {
          name: 'redirects to type when type invalid',
          data: validUpToAddress(),
          expected: uiPaths.proposedAddresses.type({ crn }),
        },
        {
          name: 'redirects to status when status invalid',
          data: validUpToType(),
          expected: uiPaths.proposedAddresses.status({ crn }),
        },
        {
          name: 'redirects to next accommodation when status PASSED but next accommodation missing',
          data: validUpToStatusPassed(),
          expected: uiPaths.proposedAddresses.nextAccommodation({ crn }),
        },
        {
          name: 'returns undefined when status NOT_CHECKED_YET',
          data: validUpToStatusNotPassed(),
          expected: undefined,
        },
        {
          name: 'returns undefined when status PASSED and next accommodation provided',
          data: { ...validUpToStatusPassed(), nextAccommodationStatus: 'YES' } as ProposedAddressFormData,
          expected: undefined,
        },
      ])('$name', ({ data, expected }) => {
        expect(validateUpToNextAccommodation(req, data)).toBe(expected)
      })

      it('flashes errors when status is PASSED but next accommodation status missing', () => {
        const validateAndFlashErrorsSpy = jest.spyOn(validationUtils, 'validateAndFlashErrors')

        validateUpToNextAccommodation(req, { ...validUpToStatusPassed(), nextAccommodationStatus: undefined })

        expect(validateAndFlashErrorsSpy).toHaveBeenCalledWith(
          req,
          expect.objectContaining({
            nextAccommodationStatus: 'Select if this is the next address',
          }),
        )
      })
    })
  })
})
