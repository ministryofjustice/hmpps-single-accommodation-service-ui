import { path } from 'static-path'

const casesPath = path('/cases')
const casePath = casesPath.path(':crn')
const proposedAddressesPath = casePath.path('proposed-accommodations')

export default {
  cases: {
    index: casesPath,
    show: casePath,
    dutyToRefer: casePath.path('dtrs'),
    eligibility: casePath.path('eligibility'),
    referrals: casePath.path('applications'),
    proposedAddresses: {
      index: proposedAddressesPath,
      submit: proposedAddressesPath,
    },
  },
}
