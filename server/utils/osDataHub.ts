import { AccommodationAddressDetails } from '@sas/api'
import { convertToTitleCase } from './utils'

// See: https://docs.os.uk/os-apis/accessing-os-apis/os-places-api/technical-specification/postcode
export type OsDataHubResult = {
  DPA: {
    ORGANISATION_NAME?: string
    DEPARTMENT_NAME?: string
    BUILDING_NUMBER?: string
    BUILDING_NAME?: string
    SUB_BUILDING_NAME?: string
    DEPENDENT_THOROUGHFARE_NAME?: string
    THOROUGHFARE_NAME?: string
    DOUBLE_DEPENDENT_LOCALITY?: string
    DEPENDENT_LOCALITY?: string
    POST_TOWN: string
    POSTCODE: string
    COUNTRY_CODE: string
    COUNTRY_CODE_DESCRIPTION: string
    ADDRESS: string
    UPRN: string
    UDPRN: string
  }
}

export type OsDataHubResponse = {
  header: unknown
  results: OsDataHubResult[]
}

export const filterResultsByNameOrNumber = (results: OsDataHubResult[], nameOrNumber?: string) => {
  if (!nameOrNumber) return results

  const sanitisedNameOrNumber = nameOrNumber.toUpperCase()

  return results.filter(result =>
    ['BUILDING_NUMBER', 'BUILDING_NAME', 'SUB_BUILDING_NAME'].some(key =>
      result.DPA[key as keyof OsDataHubResult['DPA']]?.includes(sanitisedNameOrNumber),
    ),
  )
}

export const resultToAddressDetails = (result: OsDataHubResult): AccommodationAddressDetails => ({
  postcode: result.DPA.POSTCODE,
  subBuildingName: convertToTitleCase(result.DPA.SUB_BUILDING_NAME),
  buildingName: convertToTitleCase(result.DPA.BUILDING_NAME),
  buildingNumber: result.DPA.BUILDING_NUMBER,
  thoroughfareName: convertToTitleCase(result.DPA.THOROUGHFARE_NAME),
  dependentLocality: convertToTitleCase(result.DPA.DEPENDENT_LOCALITY),
  postTown: convertToTitleCase(result.DPA.POST_TOWN),
  county: undefined,
  // FIXME: Handle country code correctly -- should this be set to 'United Kingdom'? Or handle the
  //  'England'/'Wales'/'Scotland'/'Northern Ireland' code returned by the OS API?
  country: result.DPA.COUNTRY_CODE,
  uprn: result.DPA.UPRN,
})
