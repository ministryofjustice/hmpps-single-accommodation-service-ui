import { DeepPartial, Factory } from 'fishery'
import {
  AccommodationDetail,
  AccommodationReferralDto,
  AccommodationSummaryDto,
  ApiResponseDtoAccommodationDetail,
  ApiResponseDtoAccommodationSummaryDto,
  ApiResponseDtoCaseDto,
  ApiResponseDtoDutyToReferDto,
  ApiResponseDtoEligibilityDto,
  ApiResponseDtoListAccommodationDetail,
  ApiResponseDtoListAccommodationReferralDto,
  ApiResponseDtoListAuditRecordDto,
  ApiResponseDtoListCaseDto,
  ApiResponseDtoListReferenceDataDto,
  AuditRecordDto,
  CaseDto,
  DutyToReferDto,
  EligibilityDto,
  ReferenceDataDto,
  UpstreamFailureDto,
} from '@sas/api'
import dutyToReferFactory from './dutyToRefer'
import caseFactory from './case'
import eligibilityFactory from './eligibility'
import accommodationFactory from './accommodation'
import auditRecordFactory from './auditRecord'
import referenceDataFactory from './referenceData'
import referralFactory from './referral'
import accommodationSummaryFactory from './accommodationSummary'

export type ApiResponse =
  | ApiResponseDtoAccommodationSummaryDto
  | ApiResponseDtoListCaseDto
  | ApiResponseDtoCaseDto
  | ApiResponseDtoDutyToReferDto
  | ApiResponseDtoEligibilityDto
  | ApiResponseDtoListAccommodationDetail
  | ApiResponseDtoAccommodationDetail
  | ApiResponseDtoListAuditRecordDto
  | ApiResponseDtoListAccommodationReferralDto
  | ApiResponseDtoListReferenceDataDto

class ApiResponseFactory extends Factory<ApiResponse> {
  buildResponse<T extends ApiResponse>(data: T['data']) {
    return this.params({ data } as DeepPartial<T>).build() as T
  }

  accommodationSummary(accommodationSummary?: AccommodationSummaryDto) {
    return this.buildResponse<ApiResponseDtoAccommodationSummaryDto>(
      accommodationSummary || accommodationSummaryFactory.build(),
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

  proposedAddresses(proposedAddresses?: AccommodationDetail[]) {
    return this.buildResponse<ApiResponseDtoListAccommodationDetail>(
      proposedAddresses || accommodationFactory.buildList(2),
    )
  }

  proposedAddress(proposedAddress?: AccommodationDetail) {
    return this.buildResponse<ApiResponseDtoAccommodationDetail>(proposedAddress || accommodationFactory.build())
  }

  referralHistory(referrals?: AccommodationReferralDto[]) {
    return this.buildResponse<ApiResponseDtoListAccommodationReferralDto>(referrals || referralFactory.buildList(2))
  }

  auditRecords(auditRecords?: AuditRecordDto[]) {
    return this.buildResponse<ApiResponseDtoListAuditRecordDto>(auditRecords || auditRecordFactory.buildList(2))
  }

  referenceData(data?: ReferenceDataDto[]) {
    return this.buildResponse<ApiResponseDtoListReferenceDataDto>(data || referenceDataFactory.buildList(2))
  }
}

export default ApiResponseFactory.define(() => ({
  upstreamFailures: [] as UpstreamFailureDto[],
}))
