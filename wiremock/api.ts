/* eslint-disable */
import casesApi from '../integration_tests/mockApis/cases'
import eligibilityApi from '../integration_tests/mockApis/eligibility'
import cases from './fixtures/cases.json'
import eligibility from './fixtures/eligibility.json'
import referrals from './fixtures/referrals.json'
import { AccommodationReferralDto, CaseDto, EligibilityDto } from '@sas/api'
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

;(async function () {
  await resetStubs()
  await Promise.all([stubCaseList(), stubCases(), stubEligibility(), stubReferrals()])
})()
