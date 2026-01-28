import { Factory } from 'fishery'
import { RuleAction } from '@sas/api'
import { faker } from '@faker-js/faker'

export default Factory.define<RuleAction>(() => ({
  text: faker.word.verb(),
  isUpcoming: faker.datatype.boolean(),
}))
