import { path } from 'static-path'

const casesPath = path('/cases')

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
}
