import { AccommodationAddressDetails } from '@sas/api'
import { addressFactory } from '../testutils/factories'

import { addressLines, formatAddress } from './addresses'

describe('addresses utilities', () => {
  describe('addressLines', () => {
    it.each([
      [
        'with building number',
        {
          buildingNumber: '123',
          thoroughfareName: 'Fake Street',
          county: 'Yorkshire',
          postTown: 'London',
          postcode: 'FA1 2BA',
        },
        ['123 Fake Street', 'London', 'FA1 2BA'],
      ],
      [
        'with building name',
        { buildingName: 'Fake House', thoroughfareName: 'Fake Street', postTown: 'London', postcode: 'FA1 2BA' },
        ['Fake House', 'Fake Street', 'London', 'FA1 2BA'],
      ],
      [
        'with sub-building name and building name',
        {
          subBuildingName: 'Flat 4',
          buildingName: 'Fake House',
          thoroughfareName: 'Grand Street',
          postTown: 'Manchester',
          postcode: 'M21 0BF',
        },
        ['Flat 4 Fake House', 'Grand Street', 'Manchester', 'M21 0BF'],
      ],
      [
        'with building name as number derivative',
        {
          buildingName: '104A',
          thoroughfareName: 'Lancelot Road',
          postTown: 'Exeter',
          postcode: 'EX4 9BX',
        },
        ['104A Lancelot Road', 'Exeter', 'EX4 9BX'],
      ],
      [
        'with building name as range of numbers',
        {
          buildingName: '69-73',
          thoroughfareName: 'Sidwell Street',
          postTown: 'Exeter',
          postcode: 'EX4 6PH',
        },
        ['69-73 Sidwell Street', 'Exeter', 'EX4 6PH'],
      ],
    ])(
      'returns relevant lines for an address %s',
      (_, addressParts: Partial<AccommodationAddressDetails>, expected) => {
        const address = addressFactory.minimal().build(addressParts)
        expect(addressLines(address)).toEqual(expected)
      },
    )

    it('returns and empty array when no address parts are present', () => {
      expect(addressLines()).toEqual([])
    })
  })

  describe('formatAddress', () => {
    it.each([
      [
        'with building number',
        {
          buildingNumber: '123',
          thoroughfareName: 'Fake Street',
          county: 'Yorkshire',
          postTown: 'London',
          postcode: 'FA1 2BA',
        },
        '123 Fake Street, London, FA1 2BA',
      ],
      [
        'with building name',
        { buildingName: 'Fake House', thoroughfareName: 'Fake Street', postTown: 'London', postcode: 'FA1 2BA' },
        'Fake House, Fake Street, London, FA1 2BA',
      ],
      [
        'with sub-building name',
        {
          subBuildingName: 'Flat 4',
          buildingName: 'Fake House',
          thoroughfareName: 'Grand Street',
          postTown: 'Manchester',
          postcode: 'M21 0BF',
        },
        'Flat 4 Fake House, Grand Street, Manchester, M21 0BF',
      ],
      ['with only town and postcode', { postTown: 'London', postcode: 'FA1 2BA' }, 'London, FA1 2BA'],
    ])('returns an address %s in short format', (_, params: Partial<AccommodationAddressDetails>, expected) => {
      const address = addressFactory.minimal().build(params)

      expect(formatAddress(address)).toEqual(expected)
    })

    it('returns an empty string for an undefined address', () => {
      expect(formatAddress(undefined)).toEqual('')
    })
  })
})
