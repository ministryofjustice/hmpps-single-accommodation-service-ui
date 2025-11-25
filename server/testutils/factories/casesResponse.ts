import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { CasesResponse } from '@sas/api'
import caseFactory from './case'

export default Factory.define<CasesResponse>(() => ({
  cases: caseFactory.buildList(faker.number.int({ min: 1, max: 10 })),
}))
