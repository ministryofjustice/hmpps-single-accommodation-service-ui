import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/en_GB'
import { AddressDetailsDto } from '@sas/api'

class AddressDetailsFactory extends Factory<AddressDetailsDto> {
  minimal() {
    return this.params({
      subBuildingName: undefined,
      buildingName: undefined,
      buildingNumber: undefined,
      dependentLocality: undefined,
      county: undefined,
      country: undefined,
      uprn: undefined,
    })
  }
}

export default AddressDetailsFactory.define(() => {
  const subBuildingName = faker.helpers.maybe(() => faker.location.secondaryAddress(), {
    probability: 0.2,
  })
  const buildingName = faker.helpers.maybe(() => faker.location.streetAddress().replace(/\d+\s+/, ''), {
    probability: subBuildingName ? 0.9 : 0.2,
  })
  const buildingNumber = buildingName ? undefined : faker.location.buildingNumber()

  return {
    postcode: faker.location.zipCode(),
    subBuildingName,
    buildingName,
    buildingNumber,
    thoroughfareName: faker.location.street(),
    dependentLocality: faker.location.city(),
    postTown: faker.location.city(),
    county: faker.location.county(),
    country: faker.location.country(),
    uprn: faker.string.alphanumeric({ length: 12 }),
  }
})
