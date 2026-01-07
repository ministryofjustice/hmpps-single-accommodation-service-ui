/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
import { caseFactory, eligibilityFactory, referralFactory } from '../server/testutils/factories'

const cases = caseFactory.buildList(10)
const eligibility = cases.reduce(
  (responses, c) => ({
    ...responses,
    [c.crn]: eligibilityFactory.build({ crn: c.crn }),
  }),
  {},
)
const referrals = cases.reduce(
  (responses, c) => ({
    ...responses,
    [c.crn]: referralFactory.buildList(faker.number.int({ min: 0, max: 3 })),
  }),
  {},
)

try {
  fs.writeFileSync(path.join(__dirname, 'fixtures', 'cases.json'), JSON.stringify(cases, null, 2))
  console.log('Written test cases data to wiremock/fixtures/cases.json')
  fs.writeFileSync(path.join(__dirname, 'fixtures', 'eligibility.json'), JSON.stringify(eligibility, null, 2))
  console.log('Written test eligibility data to wiremock/fixtures/eligibility.json')
  fs.writeFileSync(path.join(__dirname, 'fixtures', 'referrals.json'), JSON.stringify(referrals, null, 2))
  console.log('Written test referral history data to wiremock/fixtures/referrals.json')
} catch (error) {
  console.error(error)
}
