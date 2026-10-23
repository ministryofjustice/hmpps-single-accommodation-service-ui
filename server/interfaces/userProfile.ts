import type { Team, UpstreamFailureDto } from '@sas/api'

export type UserType = 'DELIUS' | 'NOMIS'

export type NomisUserDetails = {
  prisonCode: string | null
}

export type DeliusUserDetails = {
  teams: Team[]
  probationAreaCode: string
}

export type UserProfile = {
  userType: UserType
  username: string
  nomisUserDetails?: NomisUserDetails | null
  deliusUserDetails?: DeliusUserDetails | null
}

export type UserProfileResponse = {
  data: UserProfile
  upstreamFailures: UpstreamFailureDto[]
}
