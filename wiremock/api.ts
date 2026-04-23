/* eslint-disable */
import casesApi from '../integration_tests/mockApis/cases'
import eligibilityApi from '../integration_tests/mockApis/eligibility'
import dutyToReferApi from '../integration_tests/mockApis/dutyToRefer'
import referenceDataApi from '../integration_tests/mockApis/referenceData'
import proposedAddressesApi from '../integration_tests/mockApis/proposedAddresses'
import accommodationsApi from '../integration_tests/mockApis/accommodations'
import cases from './fixtures/cases.json'
import eligibility from './fixtures/eligibility.json'
import referrals from './fixtures/referrals.json'
import dutyToRefer from './fixtures/dutyToRefer.json'
import dutyToReferAuditRecords from './fixtures/dutyToReferAuditRecords.json'
import proposedAddresses from './fixtures/proposedAddresses.json'
import proposedAddressesAuditRecords from './fixtures/proposedAddressesAuditRecords.json'
import currentAccommodations from './fixtures/currentAccommodations.json'
import nextAccommodations from './fixtures/nextAccommodations.json'
import {
  AccommodationDetail,
  AccommodationReferralDto,
  AccommodationSummaryDto,
  AuditRecordDto,
  CaseDto,
  DutyToReferDto,
  EligibilityDto,
} from '@sas/api'
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
    const dtr = (dutyToRefer as Record<string, DutyToReferDto>)[caseDto.crn]
    await dutyToReferApi.stubGetCurrentDtr(caseDto.crn, dtr)
    if (dtr?.submission?.id) {
      await dutyToReferApi.stubGetDtrBySubmissionId(caseDto.crn, dtr.submission.id, dtr)
      await dutyToReferApi.stubUpdateDutyToRefer(caseDto.crn, dtr.submission.id)
      await dutyToReferApi.stubSubmitDutyToReferTimelineNote(caseDto.crn, dtr.submission.id)
      await dutyToReferApi.stubGetDutyToReferTimeline(
        caseDto.crn,
        dtr.submission.id,
        (dutyToReferAuditRecords as Record<string, AuditRecordDto[]>)[dtr.submission.id] ?? [],
      )
    }
    await dutyToReferApi.stubSubmitDutyToRefer(caseDto.crn)
  }
}

async function stubProposedAddresses() {
  for await (const caseDto of cases) {
    const proposedAddress = (proposedAddresses as Record<string, AccommodationDetail[]>)[caseDto.crn]
    await proposedAddressesApi.stubGetProposedAddressesByCrn(caseDto.crn, proposedAddress)

    for await (const address of proposedAddress.filter(a => a.id)) {
      await proposedAddressesApi.stubGetProposedAddress(caseDto.crn, address.id, address)
      await proposedAddressesApi.stubUpdateProposedAddress(caseDto.crn, address.id)
      await proposedAddressesApi.stubGetProposedAddressTimeline(caseDto.crn, address.id, [
        (proposedAddressesAuditRecords as Record<string, AuditRecordDto>)[address.id],
      ])
    }
    await proposedAddressesApi.stubSubmitProposedAddress(caseDto.crn)
  }
}

async function stubAccommodations() {
  for await (const caseDto of cases) {
    await accommodationsApi.stubGetCurrentAccommodation(
      caseDto.crn,
      (currentAccommodations as Record<string, AccommodationSummaryDto>)[caseDto.crn],
    )
    await accommodationsApi.stubGetNextAccommodation(
      caseDto.crn,
      (nextAccommodations as Record<string, AccommodationSummaryDto>)[caseDto.crn],
    )
  }
}

async function stubReferenceData() {
  await referenceDataApi.stubGetLocalAuthorities()
}

;(async function () {
  console.log('Resetting wiremock stubs...')
  await resetStubs()
  console.log('Stubbing endpoints...')
  await Promise.all([
    stubCaseList(),
    stubCases(),
    stubEligibility(),
    stubReferenceData(),
    stubReferrals(),
    stubDutyToRefer(),
    stubProposedAddresses(),
    stubAccommodations(),
  ])
  console.log('Done!')
})()
