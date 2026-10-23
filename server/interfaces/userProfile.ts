import type { Team, UpstreamFailureDto } from '@sas/api'

export interface UserProfile {
  teams: Team[]
  probationAreaCode: string
}

export interface UserProfileResponse {
  data: UserProfile
  upstreamFailures?: UpstreamFailureDto[]
}
