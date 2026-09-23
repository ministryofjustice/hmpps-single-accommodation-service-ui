import { addressFactory, proposedAccommodationFactory } from '../testutils/factories'
import config from '../config'
import {
  deliusAddressHistoryUrl,
  NEW_ADDRESS_OPTION,
  proposedAddressItems,
  sortAddressesAlphabetically,
} from './currentAddress'

describe('currentAddress', () => {
  const firstAddress = proposedAccommodationFactory.build({
    address: addressFactory.minimal().build({
      buildingNumber: '1',
      thoroughfareName: 'London Street',
      postTown: 'London',
      postcode: 'SW1A 1AA',
    }),
  })
  const secondAddress = proposedAccommodationFactory.build({
    address: addressFactory.minimal().build({
      buildingNumber: '2',
      thoroughfareName: 'London Street',
      postTown: 'London',
      postcode: 'SW1A 1AA',
    }),
  })

  describe('sortAddressesAlphabetically', () => {
    it('sorts the addresses A-Z without mutating the original list', () => {
      const addresses = [secondAddress, firstAddress]

      expect(sortAddressesAlphabetically(addresses)).toEqual([firstAddress, secondAddress])
      expect(addresses).toEqual([secondAddress, firstAddress])
    })
  })

  describe('proposedAddressItems', () => {
    it('returns the addresses A-Z followed by an option to add a new address', () => {
      expect(proposedAddressItems([secondAddress, firstAddress])).toEqual([
        { value: firstAddress.id, html: '1 London Street<br />London<br />SW1A 1AA', checked: false },
        { value: secondAddress.id, html: '2 London Street<br />London<br />SW1A 1AA', checked: false },
        { divider: 'or' },
        { value: NEW_ADDRESS_OPTION, text: 'Add a new address', checked: false },
      ])
    })

    it('checks the previously selected proposed address', () => {
      expect(proposedAddressItems([secondAddress, firstAddress], secondAddress.id)).toEqual([
        expect.objectContaining({ value: firstAddress.id, checked: false }),
        expect.objectContaining({ value: secondAddress.id, checked: true }),
        { divider: 'or' },
        expect.objectContaining({ value: NEW_ADDRESS_OPTION, checked: false }),
      ])
    })

    it('checks the previously selected new address option', () => {
      expect(proposedAddressItems([secondAddress], NEW_ADDRESS_OPTION)).toEqual([
        expect.objectContaining({ value: secondAddress.id, checked: false }),
        { divider: 'or' },
        expect.objectContaining({ value: NEW_ADDRESS_OPTION, checked: true }),
      ])
    })
  })

  describe('deliusAddressHistoryUrl', () => {
    it('returns a deep link to the address history for the case in nDelius', () => {
      expect(deliusAddressHistoryUrl('X123456')).toEqual(
        `${config.deliusUrl}/NDelius-war/delius/JSP/deeplink.xhtml?component=AddressHistory&CRN=X123456`,
      )
    })
  })
})
