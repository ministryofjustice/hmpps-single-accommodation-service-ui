/* eslint-disable */
import casesApi from '../integration_tests/mockApis/cases'
import eligibilityApi from '../integration_tests/mockApis/eligibility'
import dutyToReferApi from '../integration_tests/mockApis/dutyToRefer'
import proposedAddressesApi from '../integration_tests/mockApis/proposedAddresses'
import cases from './fixtures/cases.json'
import eligibility from './fixtures/eligibility.json'
import referrals from './fixtures/referrals.json'
import dutyToRefer from './fixtures/dutyToRefer.json'
import proposedAddresses from './fixtures/proposedAddresses.json'
import { AccommodationDetail, AccommodationReferralDto, CaseDto, DutyToReferDto, EligibilityDto } from '@sas/api'
import { resetStubs } from '../integration_tests/mockApis/wiremock'

async function stubCaseList() {
  await casesApi.stubGetCases(cases as CaseDto[])
}

async function stubCases() {
  for await (const caseDto of cases) {
    await casesApi.stubGetCaseByCrn(caseDto.crn, caseDto as CaseDto)
  }
}

async function stubEligibility() {
  for await (const caseDto of cases) {
    await eligibilityApi.stubGetEligibilityByCrn(
      caseDto.crn,
      (eligibility as Record<string, EligibilityDto>)[caseDto.crn],
    )
  }
}

async function stubReferrals() {
  for await (const caseDto of cases) {
    await casesApi.stubGetReferralHistory(
      caseDto.crn,
      (referrals as Record<string, AccommodationReferralDto[]>)[caseDto.crn],
    )
  }
}

async function stubDutyToRefer() {
  for await (const caseDto of cases) {
    await dutyToReferApi.stubGetDutyToReferByCrn(caseDto.crn, [
      (dutyToRefer as Record<string, DutyToReferDto>)[caseDto.crn],
    ])
  }
}

async function stubProposedAddresses() {
  for await (const caseDto of cases) {
    await casesApi.stubGetProposedAddressesByCrn(
      caseDto.crn,
      (proposedAddresses as Record<string, AccommodationDetail[]>)[caseDto.crn],
    )
    await proposedAddressesApi.stubSubmitProposedAddress(caseDto.crn)
  }
}

;(async function () {
  console.log('Resetting wiremock stubs...')
  await resetStubs()
  console.log('Stubbing endpoints...')
  await Promise.all([
    stubCaseList(),
    stubCases(),
    stubEligibility(),
    stubReferrals(),
    stubDutyToRefer(),
    stubProposedAddresses(),
  ])
  console.log('Done!')
})()
