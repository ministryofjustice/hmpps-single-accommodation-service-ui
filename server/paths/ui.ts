import { path } from 'static-path'

const listPath = path('/:caseListUrl')
const proposedAddressesPath = listPath.path(':crn/proposed-addresses')
const currentAddressPath = listPath.path(':crn/current-address')
const dutyToReferPath = listPath.path(':crn/dtr')
const externalReferralsPath = listPath.path(':crn/external-referrals')
const customListPath = path('/custom-list')
const prefix:'cases' | 'custom-list' = 'cases'

export default {
  cases: {
    index: path('/'),
    listPath: path('/cases'),
    show: listPath.path(':crn'),
    search: path('/search'),
  },
  dutyToRefer: {
    show: dutyToReferPath.path(':id/details'),
    submission: dutyToReferPath.path('submission'),
    newSubmission: dutyToReferPath.path('submission/new'),
    edit: dutyToReferPath.path(':id/edit'),
    outcome: dutyToReferPath.path(':id/outcome'),
    withdraw: dutyToReferPath.path(':id/withdraw'),
  },
  externalReferrals: {
    show: externalReferralsPath.path(':id/details'),
    submission: externalReferralsPath.path('submission'),
    edit: externalReferralsPath.path(':id/edit'),
    outcome: externalReferralsPath.path(':id/outcome'),
    withdrawal: externalReferralsPath.path(':id/withdrawal'),
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
  currentAddress: {
    select: currentAddressPath.path('select'),
    new: currentAddressPath.path('new'),
  },
  static: {
    notAuthorised: path('/not-authorised'),
    maintenance: path('/maintenance'),
  },
  customList: {
    index: customListPath,
    addCrns: customListPath.path('add-crns'),
    confirmation: customListPath.path('confirmation'),
    show: customListPath.path(':crn'),
  },
}
