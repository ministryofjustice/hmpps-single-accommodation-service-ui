/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
import { AccommodationDetail, CaseDto, DutyToReferDto } from '@sas/api'
import {
  accommodationFactory,
  auditRecordFactory,
  caseFactory,
  dutyToReferFactory,
  eligibilityFactory,
  referralFactory,
} from '../server/testutils/factories'

import casesFixture from './fixtures/cases.json'

/**
 * Generate data for wiremock fixtures.
 *
 * Usage: npx ts-node wiremock/generateData.ts [--all] [--eligibility] [--referrals] [--dtr] [--proposed-addresses]
 */

const generateCases = process.argv.includes('--all')
const generate = {
  cases: generateCases,
  eligibility: generateCases || process.argv.includes('--eligibility'),
  referrals: generateCases || process.argv.includes('--referrals'),
  dutyToRefer: generateCases || process.argv.includes('--dtr'),
  proposedAddresses: generateCases || process.argv.includes('--proposed-addresses'),
}

if (Object.values(generate).filter(Boolean).length === 0) {
  console.log('No data selected. Specify --all, --eligibility, --referrals, --dtr or --proposed-addresses')
  process.exit(1)
}

const saveToFixture = (fixtureName: string, data: unknown) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'fixtures', `${fixtureName}.json`), JSON.stringify(data, null, 2))
    console.log(`Written new fixture data to wiremock/fixtures/${fixtureName}.json`)
  } catch (error) {
    console.error(error)
  }
}

let cases: CaseDto[]
if (generate.cases) {
  cases = caseFactory.buildList(10)
  saveToFixture('cases', cases)
} else {
  cases = casesFixture as unknown as CaseDto[]
}

if (generate.eligibility) {
  const eligibility = cases.reduce(
    (responses, c) => ({
      ...responses,
      [c.crn]: eligibilityFactory.build({ crn: c.crn }),
    }),
    {},
  )
  saveToFixture('eligibility', eligibility)
}

if (generate.referrals) {
  const referrals = cases.reduce(
    (responses, c) => ({
      ...responses,
      [c.crn]: referralFactory.buildList(faker.number.int({ min: 0, max: 3 })),
    }),
    {},
  )
  saveToFixture('referrals', referrals)
}

if (generate.dutyToRefer) {
  const dutyToRefer = cases.reduce(
    (responses, c) => ({
      ...responses,
      [c.crn]: dutyToReferFactory.build({ crn: c.crn }),
    }),
    {},
  )
  saveToFixture('dutyToRefer', dutyToRefer)
  const auditRecords = Object.fromEntries(
    Object.values(dutyToRefer)
      .flat()
      .filter((dtr: DutyToReferDto) => dtr.submission?.id)
      .map((dtr: DutyToReferDto) => {
        const records = [auditRecordFactory.dutyToReferCreated().build()]
        if (dtr.status === 'SUBMITTED' || dtr.status === 'ACCEPTED' || dtr.status === 'NOT_ACCEPTED') {
          records.push(auditRecordFactory.dutyToReferSubmissionAdded(dtr.submission).build())
        }
        if (dtr.status === 'ACCEPTED' || dtr.status === 'NOT_ACCEPTED') {
          records.push(
            auditRecordFactory
              .dutyToReferAdded([{ field: 'status', value: dtr.status }], {
                localAuthorityAreaName: dtr.submission?.localAuthority?.localAuthorityAreaName,
              })
              .build(),
          )
        }
        return [dtr.submission.id, records.reverse()]
      }),
  )
  saveToFixture('dutyToReferAuditRecords', auditRecords)
}

if (generate.proposedAddresses) {
  const proposedAddresses = cases.reduce(
    (responses, c) => ({
      ...responses,
      [c.crn]: [...Array(faker.number.int({ min: 0, max: 3 }))].map(() =>
        accommodationFactory.proposed().build({ crn: c.crn }),
      ),
    }),
    {},
  )
  saveToFixture('proposedAddresses', proposedAddresses)
  const auditRecords = Object.fromEntries(
    Object.values(proposedAddresses)
      .flat()
      .map((address: AccommodationDetail) => [address.id, auditRecordFactory.proposedAddressCreated(address).build()]),
  )
  saveToFixture('proposedAddressesAuditRecords', auditRecords)
}
