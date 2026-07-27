import {
  AccommodationReferralDto,
  AccommodationSummariesDto,
  AccommodationSummaryDto,
  CaseDto,
  EligibilityDto,
  ProposedAccommodationDto,
} from '@sas/api'
import casesApi from '../mockApis/cases'
import eligibilityApi from '../mockApis/eligibility'
import proposedAddressesApi from '../mockApis/proposedAddresses'
import accommodationApi from '../mockApis/accommodation'

// eslint-disable-next-line import/prefer-default-export
export const stubProfilePage = async ({
  crn,
  caseData,
  eligibility,
  referrals,
  proposedAddresses,
  accommodationHistory,
  accommodationSummaries,
}: {
  crn: string
  caseData: CaseDto
  eligibility?: EligibilityDto
  referrals?: AccommodationReferralDto[]
  proposedAddresses?: ProposedAccommodationDto[]
  accommodationHistory?: AccommodationSummaryDto[]
  accommodationSummaries?: AccommodationSummariesDto
}) => {
  await casesApi.stubGetCaseByCrn(crn, caseData)
  await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
  await casesApi.stubGetReferralHistory(crn, referrals)
  await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
  await accommodationApi.stubGetAccommodationHistory(crn, accommodationHistory)
  await accommodationApi.stubGetAccommodationSummary(crn, accommodationSummaries)
}
