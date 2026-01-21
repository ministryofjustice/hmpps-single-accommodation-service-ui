import { path } from 'static-path'

const casesPath = path('/cases')
const privateAddressPath = casesPath.path(':crn/private-addresses')

export default {
  cases: {
    index: path('/'),
    show: casesPath.path(':crn'),
    search: casesPath.path('search'),
  },
  privateAddress: {
    start: privateAddressPath.path('start'),
    details: privateAddressPath.path('details'),
    type: privateAddressPath.path('type'),
    status: privateAddressPath.path('status'),
    checkYourAnswers: privateAddressPath.path('check-your-answers'),
    submit: privateAddressPath.path('submit'),
    cancel: privateAddressPath.path('cancel'),
  },
}
