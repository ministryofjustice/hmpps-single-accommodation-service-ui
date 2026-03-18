import { fakerEN_GB as faker } from '@faker-js/faker'
import { Factory } from 'fishery'

import localAuthoritiesJson from '../../../wiremock/fixtures/referenceData/localAuthorities.json'

type ReferenceData = {
  id: string
  name: string
}

class ReferenceDataFactory extends Factory<ReferenceData> {
  localAuthority(): Factory<ReferenceData> {
    return Factory.define<ReferenceData>(() => faker.helpers.arrayElement(localAuthoritiesJson))
  }
}

export default ReferenceDataFactory.define(() => ({
  id: faker.string.uuid(),
  name: `${faker.word.adjective()} ${faker.word.adverb()} ${faker.word.noun()}`,
}))
