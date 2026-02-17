import { AccommodationAddressDetails } from '@sas/api'

export const addressLines = (
  address: AccommodationAddressDetails = {},
  type: 'simple' | 'full' = 'simple',
): string[] => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  return [
    `${subBuildingName || ''} ${buildingName || ''}`,
    `${buildingNumber || ''} ${thoroughfareName || ''}`,
    `${postTown || ''}`,
    type === 'full' ? `${address.county || ''}` : '',
    `${postcode || ''}`,
    type === 'full' ? `${address.country || ''}` : '',
  ]
    .map(part => part.trim())
    .filter(Boolean)
}

export const formatAddress = (address: AccommodationAddressDetails): string => addressLines(address).join(', ')
