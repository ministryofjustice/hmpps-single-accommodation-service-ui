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
        'with sub-building name',
        {
          subBuildingName: 'Flat 4',
          buildingName: 'Fake House',
          thoroughfareName: 'Grand Street',
          postTown: 'Manchester',
          postcode: 'M21 0BF',
        },
        ['Flat 4 Fake House', 'Grand Street', 'Manchester', 'M21 0BF'],
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
        'Flat 4, Fake House, Grand Street, Manchester, M21 0BF',
      ],
    ])('returns an address %s in short format', (_, params: Partial<AccommodationAddressDetails>, expected) => {
      const address = addressFactory.minimal().build(params)

      expect(formatAddress(address)).toEqual(expected)
    })
  })
})
