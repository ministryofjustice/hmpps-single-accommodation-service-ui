import { Factory } from 'fishery'
import {
  AccommodationReferralDto,
  AccommodationSummariesDto,
  AccommodationSummaryDto,
  ApiResponseDtoAccommodationSummariesDto,
  ApiResponseDtoAccommodationSummaryDto,
  ApiResponseDtoCaseDto,
  ApiResponseDtoDutyToReferDto,
  ApiResponseDtoEligibilityDto,
  ApiResponseDtoListAccommodationReferralDto,
  ApiResponseDtoListAccommodationSummaryDto,
  ApiResponseDtoListAuditRecordDto,
  ApiResponseDtoListCaseDto,
  ApiResponseDtoListProposedAccommodationDto,
  ApiResponseDtoListReferenceDataDto,
  ApiResponseDtoProposedAccommodationDto,
  AuditRecordDto,
  CaseDto,
  DutyToReferDto,
  EligibilityDto,
  ProposedAccommodationDto,
  ReferenceDataDto,
  UpstreamFailureDto,
} from '@sas/api'
import { ApiResponse } from '@sas/ui'
import dutyToReferFactory from './dutyToRefer'
import caseFactory from './case'
import eligibilityFactory from './eligibility'
import auditRecordFactory from './auditRecord'
import referenceDataFactory from './referenceData'
import referralFactory from './referral'
import accommodationSummaryFactory from './accommodationSummary'
import accommodationSummariesFactory from './accommodationSummaries'
import proposedAccommodationFactory from './proposedAccommodation'
import upstreamFailureFactory from './upstreamFailure'

class ApiResponseFactory extends Factory<ApiResponse> {
  buildResponse<T extends ApiResponse>(data: T['data']) {
    return this.params({ data }).build() as T
  }

  accommodationSummary(accommodationSummary?: AccommodationSummaryDto) {
    return this.buildResponse<ApiResponseDtoAccommodationSummaryDto>(accommodationSummary ?? null)
  }

  accommodationSummaries(accommodationSummaries?: AccommodationSummariesDto) {
    return this.buildResponse<ApiResponseDtoAccommodationSummariesDto>(
      accommodationSummaries ?? accommodationSummariesFactory.build(),
    )
  }

  caseList(cases?: CaseDto[]) {
    return this.buildResponse<ApiResponseDtoListCaseDto>(cases || caseFactory.buildList(2))
  }

  case(caseDto?: CaseDto) {
    return this.buildResponse<ApiResponseDtoCaseDto>(caseDto || caseFactory.build())
  }

  dutyToRefer(dtr?: DutyToReferDto) {
    return this.buildResponse<ApiResponseDtoDutyToReferDto>(dtr || dutyToReferFactory.build())
  }

  eligibility(eligibility?: EligibilityDto) {
    return this.buildResponse<ApiResponseDtoEligibilityDto>(eligibility || eligibilityFactory.build())
  }

  proposedAddresses(proposedAddresses?: ProposedAccommodationDto[]) {
    return this.buildResponse<ApiResponseDtoListProposedAccommodationDto>(
      proposedAddresses || proposedAccommodationFactory.buildList(2),
    )
  }

  proposedAddress(proposedAddress?: ProposedAccommodationDto) {
    return this.buildResponse<ApiResponseDtoProposedAccommodationDto>(
      proposedAddress || proposedAccommodationFactory.build(),
    )
  }

  referralHistory(referrals?: AccommodationReferralDto[]) {
    return this.buildResponse<ApiResponseDtoListAccommodationReferralDto>(referrals || referralFactory.buildList(2))
  }

  accommodationHistory(accommodationHistory?: AccommodationSummaryDto[]) {
    return this.buildResponse<ApiResponseDtoListAccommodationSummaryDto>(
      accommodationHistory || accommodationSummaryFactory.buildListSequential(2),
    )
  }

  auditRecords(auditRecords?: AuditRecordDto[]) {
    return this.buildResponse<ApiResponseDtoListAuditRecordDto>(auditRecords || auditRecordFactory.buildList(2))
  }

  referenceData(data?: ReferenceDataDto[]) {
    return this.buildResponse<ApiResponseDtoListReferenceDataDto>(data || referenceDataFactory.buildList(2))
  }

  withUpstreamFailures<T>(upstreamFailures?: UpstreamFailureDto[]) {
    return this.params({
      data: null,
      upstreamFailures: upstreamFailures || upstreamFailureFactory.buildList(2),
    }).build() as T
  }
}

export default ApiResponseFactory.define(() => ({
  upstreamFailures: [] as UpstreamFailureDto[],
}))
