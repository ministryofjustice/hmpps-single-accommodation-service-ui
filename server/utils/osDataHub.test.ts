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
      { DPA: { ORGANISATION_NAME: 'QUEEN ELIZABETH HOSPITAL' } },
      { DPA: { ORGANISATION_NAME: "ST. SIDEWELL'S C OF E" } },
    ] as OsDataHubResult[]

    it('returns no results if results are undefined', () => {
      expect(filterResultsByNameOrNumber(undefined, '19')).toEqual([])
    })

    it.each([
      ['19', [results[0], results[1], results[2], results[3], results[4], results[5]]],
      ['219', [results[1], results[3], results[5]]],
      ['3', [results[6], results[7], results[8]]],
      ['Little pigs', [results[7]]],
      ['little   pigs', [results[7]]],
      ['little. pigs.', [results[7]]],
      ['Queen elizabeth', [results[9]]],
      ['Hospital', [results[9]]],
      ['sidewells', [results[10]]],
      ["sidewell's", [results[10]]],
      ['st sidewell', [results[10]]],
      ['st. sidewells', [results[10]]],
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

    it('uses the organisation name for sub-building name', () => {
      const osDataHubOrgResult: OsDataHubResult = {
        DPA: {
          UPRN: '100000529682',
          UDPRN: '15892354',
          ADDRESS: 'QUEEN ELIZABETH HOSPITAL, GATESHEAD, NE9 6SX',
          ORGANISATION_NAME: 'QUEEN ELIZABETH HOSPITAL',
          POST_TOWN: 'GATESHEAD',
          POSTCODE: 'NE9 6SX',
          COUNTRY_CODE: 'E',
          COUNTRY_CODE_DESCRIPTION: 'This record is within England',
        },
      }

      expect(resultToAddressDetails(osDataHubOrgResult)).toEqual({
        buildingName: '',
        subBuildingName: 'Queen Elizabeth Hospital',
        buildingNumber: undefined,
        thoroughfareName: '',
        dependentLocality: '',
        postTown: 'Gateshead',
        postcode: 'NE9 6SX',
        uprn: '100000529682',
        county: undefined,
        country: 'England',
      })
    })

    it('merges organisation name with sub-building name if both are present', () => {
      const osDataHubResult: OsDataHubResult = {
        DPA: {
          UPRN: '10013040266',
          UDPRN: '8764669',
          ADDRESS:
            'EXETER & DISTRICT SCOUT HEADQUARTERS, UNIT 9, ASHTON BUSINESS CENTRE, ASHTON ROAD, MARSH BARTON TRADING ESTATE, EXETER, EX2 8LN',
          ORGANISATION_NAME: 'EXETER & DISTRICT SCOUT HEADQUARTERS',
          SUB_BUILDING_NAME: 'UNIT 9',
          BUILDING_NAME: 'ASHTON BUSINESS CENTRE',
          THOROUGHFARE_NAME: 'ASHTON ROAD',
          DEPENDENT_LOCALITY: 'MARSH BARTON TRADING ESTATE',
          POST_TOWN: 'EXETER',
          POSTCODE: 'EX2 8LN',
          COUNTRY_CODE: 'E',
          COUNTRY_CODE_DESCRIPTION: 'This record is within England',
        },
      }

      expect(resultToAddressDetails(osDataHubResult)).toEqual({
        buildingName: 'Ashton Business Centre',
        subBuildingName: 'Exeter & District Scout Headquarters, Unit 9',
        buildingNumber: undefined,
        thoroughfareName: 'Ashton Road',
        dependentLocality: 'Marsh Barton Trading Estate',
        postTown: 'Exeter',
        postcode: 'EX2 8LN',
        uprn: '10013040266',
        county: undefined,
        country: 'England',
      })
    })
  })
})
