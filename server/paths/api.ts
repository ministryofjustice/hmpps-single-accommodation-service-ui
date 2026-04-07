import { path } from 'static-path'

const casesPath = path('/cases')
const casePath = casesPath.path(':crn')
const proposedAddressesPath = casePath.path('proposed-accommodations')
const proposedAddressPath = proposedAddressesPath.path(':id')
const dutyToReferPath = casePath.path('dtr')

export default {
  cases: {
    index: casesPath,
    show: casePath,
    dutyToRefer: {
      index: casePath.path('dtr'),
      update: dutyToReferPath.path(':id'),
      submit: dutyToReferPath,
    },
    eligibility: casePath.path('eligibility'),
    referrals: casePath.path('applications'),
    proposedAddresses: {
      index: proposedAddressesPath,
      show: proposedAddressPath,
      submit: proposedAddressesPath,
      update: proposedAddressPath,
      timeline: {
        index: proposedAddressPath.path('timeline'),
        submit: proposedAddressPath.path('timeline'),
      },
    },
  },
  referenceData: path('/reference-data'),
}
