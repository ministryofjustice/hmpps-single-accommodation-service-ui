import { AccommodationAddressDetails } from '@sas/api'

export const addressLines = (address: AccommodationAddressDetails = {}): string[] => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  return [
    `${subBuildingName || ''} ${buildingName || ''}`,
    `${buildingNumber || ''} ${thoroughfareName || ''}`,
    `${postTown || ''}`,
    `${postcode || ''}`,
  ]
    .map(part => part.trim())
    .filter(Boolean)
}

export const formatAddress = (address: AccommodationAddressDetails): string => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  return [subBuildingName, buildingName, `${buildingNumber || ''} ${thoroughfareName || ''}`, postTown, postcode]
    .filter(Boolean)
    .map(part => part.trim())
    .join(', ')
}
