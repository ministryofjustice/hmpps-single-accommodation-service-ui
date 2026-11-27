import { CaseDto, TeamDto, TeamMemberDto } from '@sas/api'
import casesApi from '../mockApis/cases'
import userApi from '../mockApis/user'
import { caseFactory } from '../../server/testutils/factories'

// eslint-disable-next-line import/prefer-default-export
export const stubCaseListPage = async (cases?: CaseDto[], teams?: TeamDto[], teamMembers?: TeamMemberDto[]) => {
  await casesApi.stubGetCases(cases || caseFactory.buildList(10))
  await userApi.stubGetTeams(teams || [{ code: 'team-one-code', name: 'Team One' }])
  await userApi.stubGetTeamMembers(teamMembers || [{ username: 'membername', forename: 'member', surname: 'name' }])
}
