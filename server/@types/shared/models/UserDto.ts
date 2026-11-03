/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliusUserDetailsDto } from './DeliusUserDetailsDto'
import type { NomisUserDetailsDto } from './NomisUserDetailsDto'
export type UserDto = {
  userType: 'DELIUS' | 'NOMIS'
  username: string
  nomisUserDetails?: NomisUserDetailsDto | null
  deliusUserDetails?: DeliusUserDetailsDto | null
}
