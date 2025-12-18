import { path } from 'static-path'

const casesPath = path('/cases')

export default {
  cases: {
    index: casesPath,
    show: casesPath.path(':crn'),
  },
  referrals: {
    history: path('/application-histories/:crn'),
  },
}
