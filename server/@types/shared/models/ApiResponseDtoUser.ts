/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliusUserDto } from './DeliusUserDto'
import type { NomisUserDto } from './NomisUserDto'
import type { UpstreamFailureDto } from './UpstreamFailureDto'
export type ApiResponseDtoUser = {
  data: DeliusUserDto | NomisUserDto
  upstreamFailures: Array<UpstreamFailureDto>
}
