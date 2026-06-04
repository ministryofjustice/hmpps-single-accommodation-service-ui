/* eslint-disable */
import casesApi from '../integration_tests/mockApis/cases'
import eligibilityApi from '../integration_tests/mockApis/eligibility'
import dutyToReferApi from '../integration_tests/mockApis/dutyToRefer'
import referenceDataApi from '../integration_tests/mockApis/referenceData'
import proposedAddressesApi from '../integration_tests/mockApis/proposedAddresses'
import accommodationApi from '../integration_tests/mockApis/accommodation'
import userApi from '../integration_tests/mockApis/user'
import cases from './fixtures/cases.json'
import eligibility from './fixtures/eligibility.json'
import referrals from './fixtures/referrals.json'
import dutyToRefer from './fixtures/dutyToRefer.json'
import dutyToReferAuditRecords from './fixtures/dutyToReferAuditRecords.json'
import proposedAddresses from './fixtures/proposedAddresses.json'
import proposedAddressesAuditRecords from './fixtures/proposedAddressesAuditRecords.json'
import currentAccommodation from './fixtures/currentAccommodation.json'
import nextAccommodation from './fixtures/nextAccommodation.json'
import accommodationHistory from './fixtures/accommodationHistory.json'
import {
  AccommodationReferralDto,
  AccommodationSummaryDto,
  AuditRecordDto,
  CaseDto,
  DutyToReferDto,
  EligibilityDto,
  ProposedAccommodationDto,
} from '@sas/api'
import { resetStubs } from '../integration_tests/mockApis/wiremock'

const fullCases = cases.filter(c => c.userAccess === 'FULL')

// Defines upstream failures for given CRNs
const upstreamFailures: Record<CaseDto['crn'], string[]> = {
  H271226: ['eligibility'], // Jim Anderson
  I322559: ['referralHistory'], // Ervin Ratke
  L247269: ['accommodationHistory'], // Bert Morissette
  F608163: ['referralHistory', 'accommodationHistory'], // Ms. Ethel Hudson
}

async function stubCaseList() {
  await casesApi.stubGetCases(cases as CaseDto[])
}

async function stubCases() {
  for await (const caseDto of cases) {
    await casesApi.stubGetCaseByCrn(caseDto.crn, caseDto as CaseDto)
  }
}

async function stubEligibility() {
  for await (const caseDto of fullCases) {
    await eligibilityApi.stubGetEligibilityByCrn(
      caseDto.crn,
      (eligibility as Record<string, EligibilityDto>)[caseDto.crn],
    )

    if (upstreamFailures[caseDto.crn]?.includes('eligibility')) {
      await eligibilityApi.stubGetEligibilityByCrnUpstreamFailure(caseDto.crn)
    }
  }
}

async function stubReferrals() {
  for await (const caseDto of fullCases) {
    await casesApi.stubGetReferralHistory(
      caseDto.crn,
      (referrals as Record<string, AccommodationReferralDto[]>)[caseDto.crn],
    )

    if (upstreamFailures[caseDto.crn]?.includes('referralHistory')) {
      await casesApi.stubGetReferralHistoryUpstreamFailure(caseDto.crn)
    }
  }
}

async function stubDutyToRefer() {
  for await (const caseDto of fullCases) {
    const dtr = (dutyToRefer as Record<string, DutyToReferDto>)[caseDto.crn]
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
  for await (const caseDto of fullCases) {
    const proposedAddress = (proposedAddresses as Record<string, ProposedAccommodationDto[]>)[caseDto.crn]
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

async function stubAccommodation() {
  for await (const caseDto of fullCases) {
    await accommodationApi.stubGetCurrentAccommodation(
      caseDto.crn,
      (currentAccommodation as Record<string, AccommodationSummaryDto>)[caseDto.crn],
    )
    await accommodationApi.stubGetNextAccommodation(
      caseDto.crn,
      (nextAccommodation as Record<string, AccommodationSummaryDto>)[caseDto.crn],
    )
    const history = (accommodationHistory as Record<string, AccommodationSummaryDto[]>)[caseDto.crn]
    await accommodationApi.stubGetAccommodationHistory(caseDto.crn, history)

    if (upstreamFailures[caseDto.crn]?.includes('accommodationHistory')) {
      await accommodationApi.stubGetAccommodationHistoryUpstreamFailure(caseDto.crn)
    }
  }
}

async function stubReferenceData() {
  await referenceDataApi.stubGetLocalAuthorities()
  await referenceDataApi.stubGetAccommodationTypes()
}

async function stubUserProfile() {
  await userApi.stubGetTeams([
    {
      code: 'T34M',
      name: 'Team name',
    },
  ])
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
    stubAccommodation(),
    stubUserProfile(),
  ])
  console.log('Done!')
})()
