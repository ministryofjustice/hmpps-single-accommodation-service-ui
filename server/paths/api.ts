import { path } from 'static-path'

const casesPath = path('/cases')
const proposedAddressesPath = path('/private-addresses/:crn')

export default {
  cases: {
    index: casesPath,
    show: casesPath.path(':crn'),
    eligibility: casesPath.path(':crn/eligibility'),
  },
  referrals: {
    history: path('/application-histories/:crn'),
  },
  dutyToRefer: path('/dtrs/:crn'),
  proposedAddresses: {
    submit: proposedAddressesPath,
  },
}
