import { path } from 'static-path'

const casesPath = path('/cases')
const proposedAddressesPath = casesPath.path(':crn/proposed-addresses')

export default {
  cases: {
    index: path('/'),
    show: casesPath.path(':crn'),
    search: casesPath.path('search'),
  },
  proposedAddresses: {
    start: proposedAddressesPath.path('start'),
    details: proposedAddressesPath.path('details'),
    type: proposedAddressesPath.path('type'),
    status: proposedAddressesPath.path('status'),
    nextAccommodation: proposedAddressesPath.path('next-accommodation'),
    checkYourAnswers: proposedAddressesPath.path('check-your-answers'),
    submit: proposedAddressesPath.path('submit'),
    cancel: proposedAddressesPath.path('cancel'),
  },
}
