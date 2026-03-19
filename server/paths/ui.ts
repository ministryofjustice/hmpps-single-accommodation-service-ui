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
    guidance: dutyToReferPath.path('guidance'),
    submission: dutyToReferPath.path('submission'),
    outcome: dutyToReferPath.path('outcome'),
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
  },
}
