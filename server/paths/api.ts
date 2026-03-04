import { path } from 'static-path'

const casesPath = path('/cases')
const casePath = casesPath.path(':crn')
const proposedAddressesPath = casePath.path('proposed-accommodations')
const dutyToReferPath = casePath.path('dtr')

export default {
  cases: {
    index: casesPath,
    show: casePath,
    dutyToRefer: {
      index: casePath.path('dtr'),
      show: dutyToReferPath,
      update: dutyToReferPath.path(':id'),
      submit: dutyToReferPath,
    },
    eligibility: casePath.path('eligibility'),
    referrals: casePath.path('applications'),
    proposedAddresses: {
      index: proposedAddressesPath,
      show: proposedAddressesPath.path(':id'),
      submit: proposedAddressesPath,
      update: proposedAddressesPath.path(':id'),
    },
  },
}
