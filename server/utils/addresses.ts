import { AccommodationAddressDetails, Cas3PremisesSummaryDto } from '@sas/api'

export const addressLines = (
  address: AccommodationAddressDetails = {},
  type: 'simple' | 'full' = 'simple',
): string[] => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  let line1 = `${subBuildingName || ''} ${buildingName || ''}`
  let line2 = `${buildingNumber || ''} ${thoroughfareName || ''}`

  if (buildingName?.match(/^\d+([A-Za-z]|-\d+)$/)) {
    line1 = `${subBuildingName || ''}`
    line2 = `${buildingName || ''} ${thoroughfareName || ''}`
  }

  return [
    line1,
    line2,
    `${postTown || ''}`,
    type === 'full' ? `${address.county || ''}` : '',
    `${postcode || ''}`,
    type === 'full' ? `${address.country || ''}` : '',
  ]
    .map(part => part.trim())
    .filter(Boolean)
}

export const formatAddress = (address: AccommodationAddressDetails, separator = ', '): string =>
  addressLines(address).join(separator)

export const cas3PremisesToAccommodationAddress = (
  premises?: Cas3PremisesSummaryDto | null,
): AccommodationAddressDetails | undefined => {
  if (!premises) return undefined

  return {
    buildingName: premises.addressLine1,
    subBuildingName: premises.addressLine2,
    postTown: premises.town,
    postcode: premises.postcode,
  }
}
