import { faker } from '@faker-js/faker/locale/en_GB'
import { Factory } from 'fishery'
import { ProposedAddressFormData } from '@sas/ui'
import accommodationDetailCommandFactory from './accommodationDetailCommand'

class ProposedAddressFormFactory extends Factory<ProposedAddressFormData> {
  manualAddress() {
    return this.params({
      address: {
        buildingName: faker.location.street(),
        subBuildingName: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
        postTown: faker.location.city(),
        county: faker.helpers.maybe(() => faker.location.state(), { probability: 0.3 }),
        postcode: faker.location.zipCode(),
        country: faker.location.country(),
        buildingNumber: undefined,
        thoroughfareName: undefined,
        dependentLocality: undefined,
        uprn: undefined,
      },
    })
  }
}

export default ProposedAddressFormFactory.define(({ params }) => {
  const accommodationDetailCommand = accommodationDetailCommandFactory.build(params)

  return {
    nameOrNumber: accommodationDetailCommand.address.buildingName || accommodationDetailCommand.address.buildingNumber,
    postcode: accommodationDetailCommand.address.postcode,
    ...accommodationDetailCommand,
    nextAccommodationStatus:
      accommodationDetailCommand.verificationStatus === 'PASSED'
        ? accommodationDetailCommand.nextAccommodationStatus
        : undefined,
  }
})
