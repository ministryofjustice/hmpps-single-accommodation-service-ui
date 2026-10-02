import { ProposedAccommodationDto } from '@sas/api'
import { DividerItem, RadioItem } from '@sas/ui'
import { addressLines } from './addresses'
import config from '../config'

export const NEW_ADDRESS_OPTION = 'new'

export const proposedAddressItems = (
  addresses: ProposedAccommodationDto[],
  selectedValue?: string,
): Array<RadioItem | DividerItem> => [
  ...addresses.map(address => ({
    value: address.id,
    html: addressLines(address.address).join('<br />'),
    checked: selectedValue === address.id,
  })),
  { divider: 'or' },
  { value: NEW_ADDRESS_OPTION, text: 'Add a new address', checked: selectedValue === NEW_ADDRESS_OPTION },
]

export const deliusAddressAndAccommodationUrl = (crn: string): string =>
  `${config.deliusUrl}/NDelius-war/delius/JSP/deeplink.xhtml?component=AddressandAccommodation&CRN=${encodeURIComponent(crn)}`
