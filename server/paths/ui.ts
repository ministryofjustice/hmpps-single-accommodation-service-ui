import { path } from 'static-path'

const casesPath = path('/cases')

export default {
  cases: {
    index: path('/'),
    show: casesPath.path(':crn'),
  },
}
