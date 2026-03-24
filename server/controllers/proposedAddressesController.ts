import { Request, RequestHandler, Response } from 'express'
import { ProposedAddressFormPage } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  checkYourAnswersRows,
  updateAddressFromRequest,
  updateTypeFromRequest,
  updateStatusFromRequest,
  updateNextAccommodationFromRequest,
  arrangementSubTypeItems,
  verificationStatusItems,
  nextAccommodationStatusItems,
  validateUpToAddress,
  validateUpToType,
  validateUpToStatus,
  validateUpToNextAccommodation,
  flowRedirects,
  validateLookupFromSession,
  lookupResultsItems,
  addressDetailRows,
  addressTimelineEntry,
} from '../utils/proposedAddresses'
import {
  fetchErrorsAndUserInput,
  addErrorToFlash,
  validateAndFlashErrors,
  addGenericErrorToFlash,
} from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import CasesService from '../services/casesService'
import OsDataHubService from '../services/osDataHubService'
import { getPageBackLink } from '../utils/backlinks'
import { formatAddress } from '../utils/addresses'
import { caseAssignedTo } from '../utils/cases'

interface EditRequest extends Request {
  params: {
    crn: string
    id: string
    page: ProposedAddressFormPage
  }
}

export default class ProposedAddressesController {
  formData: MultiPageFormManager<'proposedAddress'>

  constructor(
    private readonly auditService: AuditService,
    private readonly proposedAddressesService: ProposedAddressesService,
    private readonly casesService: CasesService,
    private readonly osDataHubService: OsDataHubService,
  ) {
    this.formData = new MultiPageFormManager('proposedAddress')
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [caseData, proposedAddress, auditRecords] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.proposedAddressesService.getProposedAddress(token, crn, id),
        this.proposedAddressesService.getTimeline(token, crn, id),
      ])

      return res.render('pages/proposed-address/show', {
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
        address: formatAddress(proposedAddress.address),
        addressDetailRows: addressDetailRows(proposedAddress),
        timeline: auditRecords.map(addressTimelineEntry),
      })
    }
  }

  start(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.formData.remove(req.params.crn, req.session)
      await this.formData.update(req.params.crn, req.session, {})

      return res.redirect(uiPaths.proposedAddresses.lookup({ crn: req.params.crn }))
    }
  }

  edit(): RequestHandler {
    return async (req: EditRequest, res: Response) => {
      const redirect = req.headers.referer
      const { crn, id, page } = req.params
      const { token } = res.locals.user

      await this.formData.remove(crn, req.session)

      const proposedAddress = await this.proposedAddressesService.getProposedAddress(token, crn, id)
      await this.formData.update(crn, req.session, { ...proposedAddress, redirect })

      return res.redirect(flowRedirects[page]({ crn }))
    }
  }

  lookup(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_LOOKUP, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { nameOrNumber, postcode } = this.formData.get(req.params.crn, req.session)
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      return res.render('pages/proposed-address/lookup', {
        crn: req.params.crn,
        nameOrNumber,
        postcode,
        errors,
        errorSummary,
      })
    }
  }

  saveLookup(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { session } = req
      const { nameOrNumber, postcode } = req.body

      const proposedAddressFormSessionData = await this.formData.update(crn, session, {
        nameOrNumber: req.body?.nameOrNumber,
        postcode: req.body?.postcode,
        lookupResults: null,
      })

      const errorRedirect = validateLookupFromSession(req, proposedAddressFormSessionData)
      if (errorRedirect) return res.redirect(errorRedirect)

      const lookupResults = await this.osDataHubService.getByNameOrNumberAndPostcode(nameOrNumber, postcode)

      if (!lookupResults.length) {
        addGenericErrorToFlash(req, 'No addresses found for this property name or number and UK postcode')
        return res.redirect(uiPaths.proposedAddresses.lookup({ crn }))
      }

      if (lookupResults.length === 1) {
        await this.formData.update(crn, session, { lookupResults, address: lookupResults[0] })
        return this.continue(req, res, uiPaths.proposedAddresses.type({ crn }))
      }

      await this.formData.update(crn, session, { lookupResults })
      return res.redirect(uiPaths.proposedAddresses.selectAddress({ crn: req.params.crn }))
    }
  }

  selectAddress(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_SELECT_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn } = req.params
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const { nameOrNumber, postcode, lookupResults, address } = this.formData.get(crn, req.session)

      if (!lookupResults) {
        return res.redirect(uiPaths.proposedAddresses.lookup({ crn }))
      }

      return res.render('pages/proposed-address/select-address', {
        crn,
        nameOrNumber,
        postcode,
        addresses: lookupResultsItems(lookupResults, address?.uprn),
        errors,
        errorSummary,
      })
    }
  }

  saveSelectAddress(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { session } = req
      const { addressUprn } = req.body

      const { lookupResults } = this.formData.get(crn, session)

      if (!lookupResults) {
        return res.redirect(uiPaths.proposedAddresses.lookup({ crn }))
      }

      const address = lookupResults.find(result => result.uprn === addressUprn)

      if (!addressUprn || !address) {
        validateAndFlashErrors(req, {
          addressUprn: 'Select an address',
        })
        return res.redirect(uiPaths.proposedAddresses.selectAddress({ crn }))
      }

      await this.formData.update(crn, session, {
        address,
      })

      return this.continue(req, res, uiPaths.proposedAddresses.type({ crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { crn } = req.params
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)

      return res.render('pages/proposed-address/details', {
        crn,
        backLinkHref: uiPaths.proposedAddresses.lookup({ crn }),
        address: proposedAddressFormSessionData?.address || {},
        errors,
        errorSummary,
      })
    }
  }

  saveDetails(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateAddressFromRequest(req, this.formData)
      const errorRedirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (errorRedirect) return res.redirect(errorRedirect)

      return this.continue(req, res, uiPaths.proposedAddresses.type({ crn: req.params.crn }))
    }
  }

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      const caseData = await this.casesService.getCase(token, crn)

      return res.render('pages/proposed-address/type', {
        crn,
        backLinkHref: proposedAddressFormSessionData.lookupResults?.length
          ? uiPaths.proposedAddresses.selectAddress({ crn })
          : uiPaths.proposedAddresses.details({ crn }),
        proposedAddress: proposedAddressFormSessionData,
        name: caseData.name,
        arrangementSubTypeItems: arrangementSubTypeItems(proposedAddressFormSessionData?.arrangementSubType),
        errors,
        errorSummary,
      })
    }
  }

  saveType(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateTypeFromRequest(req, this.formData)
      const redirect = validateUpToType(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      return this.continue(req, res, uiPaths.proposedAddresses.status({ crn: req.params.crn }))
    }
  }

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToType(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.status.pattern, req, [
        uiPaths.proposedAddresses.type.pattern,
        uiPaths.cases.show.pattern,
      ])

      return res.render('pages/proposed-address/status', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        verificationStatusItems: verificationStatusItems(proposedAddressFormSessionData?.verificationStatus),
        backLinkHref,
        errors,
        errorSummary,
      })
    }
  }

  saveStatus(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateStatusFromRequest(req, this.formData)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      if (proposedAddressFormSessionData?.verificationStatus === 'PASSED') {
        return res.redirect(uiPaths.proposedAddresses.nextAccommodation({ crn: req.params.crn }))
      }

      return this.continue(req, res, uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  nextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const caseData = await this.casesService.getCase(token, crn)

      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.nextAccommodation.pattern, req, [
        uiPaths.cases.show.pattern,
        uiPaths.proposedAddresses.status.pattern,
      ])

      return res.render('pages/proposed-address/next-accommodation', {
        crn,
        proposedAddress: proposedAddressFormSessionData,
        nextAccommodationStatusItems: nextAccommodationStatusItems(
          proposedAddressFormSessionData?.nextAccommodationStatus,
        ),
        name: caseData.name,
        backLinkHref,
        errors,
        errorSummary,
      })
    }
  }

  saveNextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateNextAccommodationFromRequest(req, this.formData)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      return this.continue(req, res, uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      await this.formData.update(crn, req.session, { redirect: uiPaths.proposedAddresses.checkYourAnswers({ crn }) })

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const caseData = await this.casesService.getCase(token, crn)

      const tableRows = checkYourAnswersRows(proposedAddressFormSessionData, crn, caseData.name)
      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.checkYourAnswers.pattern, req, [
        uiPaths.proposedAddresses.status.pattern,
        uiPaths.proposedAddresses.nextAccommodation.pattern,
      ])

      return res.render('pages/proposed-address/check-your-answers', {
        crn,
        tableRows,
        backLinkHref,
        errors,
        errorSummary,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      try {
        await this.proposedAddressesService.submit(token, req.params.crn, proposedAddressFormSessionData)

        await this.formData.remove(req.params.crn, req.session)
        req.flash('success', 'Private address added')
        return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
      } catch {
        addErrorToFlash(req, 'checkYourAnswers', 'There was an error saving the address')
        return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
      }
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { redirect } = this.formData.get(crn, req.session)

      await this.formData.remove(crn, req.session)

      return res.redirect(
        redirect && redirect !== uiPaths.proposedAddresses.checkYourAnswers({ crn })
          ? redirect
          : uiPaths.cases.show({ crn }),
      )
    }
  }

  private async continue(req: Request, res: Response, nextPagePath: string) {
    const { token } = res.locals.user
    const { crn } = req.params
    const proposedAddressFormSessionData = this.formData.get(crn, req.session)
    const { redirect, id } = proposedAddressFormSessionData

    if (redirect && id) {
      await this.proposedAddressesService.update(token, crn, proposedAddressFormSessionData)
      await this.formData.remove(crn, req.session)
      req.flash('success', 'Address updated')
      return res.redirect(redirect)
    }

    return res.redirect(redirect || nextPagePath)
  }
}
