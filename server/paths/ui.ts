import { path } from 'static-path'

const casesPath = path('/cases')
const proposedAddressesPath = casesPath.path(':crn/proposed-addresses')
const dutyToReferPath = casesPath.path(':crn/dtr')

export default {
  cases: {
    index: path('/'),
    show: casesPath.path(':crn'),
    search: casesPath.path('search'),
  },
  dutyToRefer: {
    show: dutyToReferPath.path(':id/details'),
    submission: dutyToReferPath.path('submission'),
    newSubmission: dutyToReferPath.path('submission/new'),
    edit: dutyToReferPath.path(':id/edit'),
    outcome: dutyToReferPath.path(':id/outcome'),
    withdraw: dutyToReferPath.path(':id/withdraw'),
  },
  proposedAddresses: {
    show: proposedAddressesPath.path(':id/details'),
    start: proposedAddressesPath.path('start'),
    edit: proposedAddressesPath.path(':id/edit/:page'),
    lookup: proposedAddressesPath.path('lookup'),
    selectAddress: proposedAddressesPath.path('select-address'),
    details: proposedAddressesPath.path('details'),
    type: proposedAddressesPath.path('type'),
    status: proposedAddressesPath.path('status'),
    nextAccommodation: proposedAddressesPath.path('next-accommodation'),
    checkYourAnswers: proposedAddressesPath.path('check-your-answers'),
    submit: proposedAddressesPath.path('submit'),
    update: proposedAddressesPath.path('update'),
    cancel: proposedAddressesPath.path('cancel'),
    arrival: proposedAddressesPath.path(':id/arrival'),
  },
  static: {
    notAuthorised: path('/not-authorised'),
    maintenance: path('/maintenance'),
  },
}
