import { filterResultsByNameOrNumber, OsDataHubResult, resultToAddressDetails } from './osDataHub'

describe('OS DataHub utils', () => {
  describe('filterDataHubResultsByNameOrNumber', () => {
    const results = [
      { DPA: { BUILDING_NAME: '19A' } },
      { DPA: { BUILDING_NAME: '219A' } },
      { DPA: { SUB_BUILDING_NAME: 'FLAT 19' } },
      { DPA: { SUB_BUILDING_NAME: 'FLAT 219' } },
      { DPA: { BUILDING_NUMBER: '19' } },
      { DPA: { BUILDING_NUMBER: '219' } },
      { DPA: { BUILDING_NUMBER: '3' } },
      { DPA: { BUILDING_NAME: '3 LITTLE PIGS' } },
      { DPA: { SUB_BUILDING_NAME: 'SOMETHING 333' } },
    ] as OsDataHubResult[]

    it.each([
      ['19', [results[0], results[1], results[2], results[3], results[4], results[5]]],
      ['219', [results[1], results[3], results[5]]],
      ['3', [results[6], results[7], results[8]]],
      ['Little pigs', [results[7]]],
      [undefined, results],
    ])(`returns results for name or number "%s"`, (nameOrNumber, expected) => {
      expect(filterResultsByNameOrNumber(results, nameOrNumber)).toEqual(expected)
    })
  })

  describe('osDataHubResultToAddressDetails', () => {
    it('returns an address details object with the correct fields', () => {
      const osDataHubResult: OsDataHubResult = {
        DPA: {
          UPRN: '77077677',
          UDPRN: '14497516',
          ADDRESS: 'FLAT 2, THE MILL, 21, KEPPEL ROAD, MANCHESTER, M21 0BP',
          SUB_BUILDING_NAME: 'FLAT 2',
          BUILDING_NAME: 'THE MILL',
          BUILDING_NUMBER: '21',
          THOROUGHFARE_NAME: 'KEPPEL ROAD',
          DEPENDENT_LOCALITY: 'CHORLTON',
          POST_TOWN: 'MANCHESTER',
          POSTCODE: 'M21 0BP',
          COUNTRY_CODE: 'E',
          COUNTRY_CODE_DESCRIPTION: 'This record is within England',
        },
      }

      expect(resultToAddressDetails(osDataHubResult)).toEqual({
        buildingName: 'The Mill',
        subBuildingName: 'Flat 2',
        buildingNumber: '21',
        thoroughfareName: 'Keppel Road',
        dependentLocality: 'Chorlton',
        postTown: 'Manchester',
        postcode: 'M21 0BP',
        uprn: '77077677',
        county: undefined,
        country: 'England',
      })
    })
  })
})
