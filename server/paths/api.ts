import { path } from 'static-path'

const casePath = path('/cases/:crn')
const accommodationPath = casePath.path('accommodations')
const proposedAddressesPath = casePath.path('proposed-accommodations')
const proposedAddressPath = proposedAddressesPath.path(':id')
const dutyToReferPath = casePath.path('dtr')
const externalReferralsPath = casePath.path('external-referral')

export default {
  cases: {
    index: path('/case-list'),
    search: path('/search/:crn'),
    show: casePath,
    accommodation: {
      summary: accommodationPath.path('summary'),
    },
    dutyToRefer: {
      current: dutyToReferPath,
      show: dutyToReferPath.path(':id'),
      update: dutyToReferPath.path(':id'),
      submit: dutyToReferPath,
      timeline: dutyToReferPath.path(':id/timeline'),
      notes: dutyToReferPath.path(':id/notes'),
    },
    externalReferrals: {
      search: externalReferralsPath.path('search'),
      show: externalReferralsPath.path(':id'),
      submit: externalReferralsPath,
      update: externalReferralsPath.path(':id'),
      timeline: externalReferralsPath.path(':id/timline'),
      notes: externalReferralsPath.path(':id/notes'),
    },
    eligibility: casePath.path('eligibility'),
    referrals: casePath.path('applications'),
    proposedAddresses: {
      index: proposedAddressesPath,
      show: proposedAddressPath,
      submit: proposedAddressesPath,
      update: proposedAddressPath,
      timeline: proposedAddressPath.path('timeline'),
      notes: proposedAddressPath.path('notes'),
      arrival: proposedAddressPath.path('arrival'),
    },
    accommodationHistory: casePath.path('accommodation-history'),
  },
  referenceData: path('/reference-data'),
  user: {
    teams: path('/user/teams'),
  },
}
