import { fakerEN_GB as faker } from '@faker-js/faker'
import { Factory } from 'fishery'

import { ReferenceDataDto } from '@sas/api'
import localAuthoritiesJson from '../../../wiremock/fixtures/referenceData/localAuthorities.json'

class ReferenceDataFactory extends Factory<ReferenceDataDto> {
  localAuthority(): Factory<ReferenceDataDto> {
    return Factory.define<ReferenceDataDto>(() => faker.helpers.arrayElement(localAuthoritiesJson) as ReferenceDataDto)
  }
}

export default ReferenceDataFactory.define(() => ({
  id: faker.string.uuid(),
  name: `${faker.word.adjective()} ${faker.word.adverb()} ${faker.word.noun()}`,
}))
