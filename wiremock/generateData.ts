/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
import { CaseDto, DtrServiceResult, DutyToReferDto, ProposedAccommodationDto } from '@sas/api'
import {
  accommodationSummaryFactory,
  auditRecordFactory,
  caseFactory,
  dutyToReferFactory,
  eligibilityFactory,
  proposedAccommodationFactory,
  referralFactory,
} from '../server/testutils/factories'

import casesFixture from './fixtures/cases.json'

/**
 * Generate data for wiremock fixtures.
 *
 * Usage: npx ts-node wiremock/generateData.ts [--all] [--eligibility] [--referrals] [--dtr] [--proposed-addresses] [--accommodation-history]
 */

const generateCases = process.argv.includes('--all')
const generate = {
  cases: generateCases,
  eligibility: generateCases || process.argv.includes('--eligibility'),
  referrals: generateCases || process.argv.includes('--referrals'),
  dutyToRefer: generateCases || process.argv.includes('--dtr'),
  proposedAddresses: generateCases || process.argv.includes('--proposed-addresses'),
  accommodation: generateCases || process.argv.includes('--accommodation'),
}

if (Object.values(generate).filter(Boolean).length === 0) {
  console.log(
    'No data selected. Specify --all, --eligibility, --referrals, --dtr, --proposed-addresses or --accommodation',
  )
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

let allCases: CaseDto[]
if (generate.cases) {
  allCases = [...caseFactory.buildList(10), caseFactory.limitedAccess().build()]
  saveToFixture('cases', allCases)
} else {
  allCases = casesFixture as CaseDto[]
}
const cases = allCases.filter(c => c.userAccess === 'FULL')

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
  const dtrServiceResultToDutyToRefer = (crn: string, dtr: DtrServiceResult): DutyToReferDto => ({
    crn,
    caseId: dtr.caseId,
    status: dtr.serviceResult.serviceStatus as DutyToReferDto['status'],
    submission: dtr.submission,
  })

  const eligibility = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'eligibility.json'), 'utf8'))
  const dutyToRefer: Record<string, DutyToReferDto> = {}
  const auditRecords: Record<string, unknown[]> = {}

  cases.forEach(c => {
    const eligibilityForCase = eligibility[c.crn]
    if (eligibilityForCase && eligibilityForCase.dtr) {
      const dtr = dtrServiceResultToDutyToRefer(c.crn, eligibilityForCase.dtr)
      dutyToRefer[c.crn] = dtr
      if (dtr.submission?.id) {
        const records = []
        if (dtr.status === 'SUBMITTED' || dtr.status === 'ACCEPTED' || dtr.status === 'NOT_ACCEPTED') {
          records.push(auditRecordFactory.dutyToReferAdded(dtr.submission).build())
        }
        if (dtr.status === 'ACCEPTED' || dtr.status === 'NOT_ACCEPTED') {
          records.push(
            auditRecordFactory
              .dutyToReferAdded(dtr.submission, dtr.status, {
                localAuthorityAreaName: dtr.submission?.localAuthority?.localAuthorityAreaName,
              })
              .build(),
          )
        }
        auditRecords[dtr.submission.id] = records.reverse()
      }
    }
  })
  saveToFixture('dutyToRefer', dutyToRefer)
  saveToFixture('dutyToReferAuditRecords', auditRecords)
}

if (generate.proposedAddresses) {
  const proposedAddresses = cases.reduce(
    (responses, c) => ({
      ...responses,
      [c.crn]: [...Array(faker.number.int({ min: 0, max: 3 }))].map(() =>
        proposedAccommodationFactory.build({ crn: c.crn }),
      ),
    }),
    {},
  )
  saveToFixture('proposedAddresses', proposedAddresses)
  const auditRecords = Object.fromEntries(
    Object.values(proposedAddresses)
      .flat()
      .map((address: ProposedAccommodationDto) => [
        address.id,
        auditRecordFactory.proposedAddressCreated(address).build(),
      ]),
  )
  saveToFixture('proposedAddressesAuditRecords', auditRecords)
}

if (generate.accommodation) {
  const currentAccommodation: Record<string, unknown> = {}
  const nextAccommodation: Record<string, unknown> = {}
  const accommodationHistory: Record<string, unknown> = {}

  cases.forEach(c => {
    const isNoFixedAbode = c.status === 'NO_FIXED_ABODE'
    const isRiskOfNoFixedAbode = c.status === 'RISK_OF_NO_FIXED_ABODE'

    const current = isNoFixedAbode ? null : accommodationSummaryFactory.current().build({ crn: c.crn })
    const next =
      isNoFixedAbode || isRiskOfNoFixedAbode ? null : accommodationSummaryFactory.next().build({ crn: c.crn })

    currentAccommodation[c.crn] = current
    nextAccommodation[c.crn] = next

    accommodationSummaryFactory.lastStartDate = current ? new Date(current.startDate) : undefined
    const previous = accommodationSummaryFactory.buildListSequential(faker.number.int({ min: 0, max: 6 }))
    accommodationHistory[c.crn] = current ? [current, ...previous] : previous
  })

  saveToFixture('currentAccommodation', currentAccommodation)
  saveToFixture('nextAccommodation', nextAccommodation)
  saveToFixture('accommodationHistory', accommodationHistory)
}
