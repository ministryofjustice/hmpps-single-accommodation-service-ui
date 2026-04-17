import { path } from 'static-path'

const casePath = path('/cases/:crn')
const proposedAddressesPath = casePath.path('proposed-accommodations')
const proposedAddressPath = proposedAddressesPath.path(':id')
const dutyToReferPath = casePath.path('dtr')

export default {
  cases: {
    index: path('/case-list'),
    show: casePath,
    dutyToRefer: {
      current: dutyToReferPath,
      show: dutyToReferPath.path(':id'),
      update: dutyToReferPath.path(':id'),
      submit: dutyToReferPath,
      timeline: dutyToReferPath.path(':id/timeline'),
      notes: dutyToReferPath.path(':id/notes'),
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
    },
  },
  referenceData: path('/reference-data'),
}
