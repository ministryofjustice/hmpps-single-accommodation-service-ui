import { Request, RequestHandler, Response } from 'express'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { ProposedAddressFormPage } from '@sas/ui'
import { ProposedAccommodationArrivalCommand } from '@sas/api'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  checkYourAnswersRows,
  updateAddressFromRequest,
  updateTypeFromRequest,
  updateStatusFromRequest,
  updateNextAccommodationFromRequest,
  accommodationTypeItems,
  validateUpToAddress,
  validateUpToType,
  validateUpToStatus,
  validateUpToNextAccommodation,
  flowRedirects,
  validateLookupFromSession,
  lookupResultsItems,
  addressDetailRows,
  addressTimeline,
  nextActionButton,
  verificationStatusLabels,
  nextAccommodationStatusLabels,
  validateNote,
} from '../utils/proposedAddresses'
import {
  fetchErrorsAndUserInput,
  addErrorToFlash,
  validateAndFlashErrors,
  validateRadioButton,
  addGenericErrorToFlash,
  addUserInputToFlash,
} from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import CasesService from '../services/casesService'
import OsDataHubService from '../services/osDataHubService'
import {  getPageBackLink } from '../utils/backlinks'
import { getActiveCaseListSegment } from '../utils/navigation'
import { addressLines, formatAddress } from '../utils/addresses'
import { caseAssignedTo, displayName } from '../utils/cases'
import ReferenceDataService from '../services/referenceDataService'
import config from '../config'
import { radioItems } from '../utils/utils'
import { collectApiResponses } from '../utils/apiResponses'
import { getTodayLocal } from '../utils/dates'
import { breadcrumbs } from '../utils/breadcrumbs'

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
    private readonly referenceDataService: ReferenceDataService,
  ) {
    this.formData = new MultiPageFormManager('proposedAddress')
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { username, token } = res.locals.user

      await this.auditService.logPageView(Page.PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: proposedAddress }, { data: auditRecords }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.proposedAddressesService.getProposedAddress(token, crn, id),
        this.proposedAddressesService.getTimeline(token, crn, id),
      ])

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)
      const caseListUrl = getActiveCaseListSegment(req)
      return res.render('pages/proposed-address/show', {
        breadcrumbs: breadcrumbs(req, caseData),
        displayName: displayName(caseData),
        caseData,
        assignedTo: caseAssignedTo(caseData, username),
        address: formatAddress(proposedAddress.address),
        addressDetailRows: addressDetailRows(proposedAddress, caseListUrl),
        timeline: addressTimeline(auditRecords, username),
        nextAction: nextActionButton(proposedAddress, caseListUrl),
        ...userInput,
        errors,
        errorSummary,
      })
    }
  }

  saveNote(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.PROPOSED_ADDRESS_DETAILS_ADD_NOTE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn, id } = req.params
      const { token } = res.locals.user
      const { note } = req.body
      const caseListUrl = getActiveCaseListSegment(req)

      if (!validateNote(req)) {
        return res.redirect(uiPaths.proposedAddresses.show({ caseListUrl, crn, id }))
      }

      try {
        await this.proposedAddressesService.submitTimelineNote(token, crn, id, { note })
        req.flash('success', 'Note added')
      } catch (error) {
        addGenericErrorToFlash(req, error.message)
        addUserInputToFlash(req)
      }

      return res.redirect(uiPaths.proposedAddresses.show({ caseListUrl, crn, id }))
    }
  }

  start(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.formData.remove(req.params.crn, req.session)
      await this.formData.update(req.params.crn, req.session, {})
      const caseListUrl = getActiveCaseListSegment(req)
      return res.redirect(uiPaths.proposedAddresses.lookup({ caseListUrl, crn: req.params.crn }))
    }
  }

  edit(): RequestHandler {
    return async (req: EditRequest, res: Response) => {
      const redirect = req.headers.referer
      const { crn, id, page } = req.params
      const { token } = res.locals.user
      const caseListUrl = getActiveCaseListSegment(req)
      await this.formData.remove(crn, req.session)

      const {
        data: { accommodationType, ...proposedAddress },
      } = await this.proposedAddressesService.getProposedAddress(token, crn, id)
      await this.formData.update(crn, req.session, {
        ...proposedAddress,
        accommodationTypeCode: accommodationType?.code,
        redirect,
      })

      return res.redirect(flowRedirects[page]({ caseListUrl, crn }))
    }
  }

  lookup(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_LOOKUP, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
const caseListUrl = getActiveCaseListSegment(req)
      const { crn } = req.params

      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      if (!proposedAddressFormSessionData) return res.redirect(uiPaths.cases.show({ caseListUrl, crn }))

      const { nameOrNumber, postcode } = proposedAddressFormSessionData
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      return res.render('pages/proposed-address/lookup', {
        crn,
        nameOrNumber,
        postcode,
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveLookup(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { session } = req
      const { nameOrNumber, postcode } = req.body
const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = await this.formData.update(crn, session, {
        nameOrNumber: req.body?.nameOrNumber,
        postcode: req.body?.postcode,
        lookupResults: null,
      })

      const errorRedirect = validateLookupFromSession(req, proposedAddressFormSessionData)
      if (errorRedirect) return res.redirect(errorRedirect)

      let lookupResult
      try {
        lookupResult = await this.osDataHubService.getByNameOrNumberAndPostcode(nameOrNumber, postcode)
      } catch (error) {
        if ((error as SanitisedError).responseStatus === 400) {
          validateAndFlashErrors(req, { postcode: 'Enter a valid UK postcode' })
          return res.redirect(uiPaths.proposedAddresses.lookup({ caseListUrl, crn }))
        }

        throw error
      }

      const { addresses: lookupResults, nameOrNumberMatched } = lookupResult

      if (!lookupResults.length) {
        validateAndFlashErrors(req, { postcode: 'Enter a valid UK postcode' })
        return res.redirect(uiPaths.proposedAddresses.lookup({ caseListUrl, crn }))
      }

      await this.formData.update(crn, session, { lookupResults, nameOrNumberMatched })
      return res.redirect(uiPaths.proposedAddresses.selectAddress({ caseListUrl, crn: req.params.crn }))
    }
  }

  selectAddress(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_SELECT_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn } = req.params
const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      if (!proposedAddressFormSessionData) return res.redirect(uiPaths.cases.show({ caseListUrl, crn }))

      const { nameOrNumber, postcode, lookupResults, address, nameOrNumberMatched } = proposedAddressFormSessionData
      if (!lookupResults) return res.redirect(uiPaths.proposedAddresses.lookup({ caseListUrl, crn }))

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      if (lookupResults.length === 1) {
        return res.render('pages/proposed-address/confirm-address', {
          crn,
          addressLines: addressLines(lookupResults[0]),
          addressUprn: lookupResults[0].uprn,
          caseListUrl,
        })
      }

      return res.render('pages/proposed-address/select-address', {
        crn,
        nameOrNumber,
        postcode,
        nameOrNumberMatched,
        addresses: lookupResultsItems(lookupResults, address?.uprn),
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveSelectAddress(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { session } = req
      const { addressUprn } = req.body
const caseListUrl = getActiveCaseListSegment(req)
      const { lookupResults } = this.formData.get(crn, session)

      if (!lookupResults) {
        return res.redirect(uiPaths.proposedAddresses.lookup({ caseListUrl, crn }))
      }

      const address = lookupResults.find(result => result.uprn === addressUprn)

      const error = validateRadioButton(addressUprn, 'address')
      if (error || !address) {
        validateAndFlashErrors(req, {
          addressUprn: error || 'Select an address',
        })
        return res.redirect(uiPaths.proposedAddresses.selectAddress({ caseListUrl, crn }))
      }

      await this.formData.update(crn, session, {
        address,
      })

      return this.continue(req, res, uiPaths.proposedAddresses.type({ caseListUrl, crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn } = req.params
const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      if (!proposedAddressFormSessionData) return res.redirect(uiPaths.cases.show({ caseListUrl, crn }))

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      return res.render('pages/proposed-address/details', {
        crn,
        backLinkHref: uiPaths.proposedAddresses.lookup({ caseListUrl, crn }),
        address: proposedAddressFormSessionData?.address || {},
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveDetails(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateAddressFromRequest(req, this.formData)
      const errorRedirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (errorRedirect) return res.redirect(errorRedirect)

      const caseListUrl = getActiveCaseListSegment(req)
      return this.continue(req, res, uiPaths.proposedAddresses.type({ caseListUrl, crn: req.params.crn }))
    }
  }

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { token } = res.locals.user
      const { crn } = req.params

      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { accommodationTypeCode } = proposedAddressFormSessionData
      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const [{ data: caseData }, { data: accommodationTypes }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.referenceDataService.getAccommodationTypes(token),
      ])
const caseListUrl = getActiveCaseListSegment(req)
      return res.render('pages/proposed-address/type', {
        crn,
        backLinkHref:
          proposedAddressFormSessionData.lookupResults?.length || config.flags.hideManualAddressEntry
            ? uiPaths.proposedAddresses.selectAddress({ caseListUrl, crn })
            : uiPaths.proposedAddresses.details({ caseListUrl, crn }),
        address: formatAddress(proposedAddressFormSessionData.address),
        name: displayName(caseData),
        accommodationTypeItems: accommodationTypeItems(accommodationTypes, accommodationTypeCode),
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveType(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateTypeFromRequest(req, this.formData)
      const redirect = validateUpToType(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)
      const caseListUrl = getActiveCaseListSegment(req)
      return this.continue(req, res, uiPaths.proposedAddresses.status({ caseListUrl, crn: req.params.crn }))
    }
  }

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { crn } = req.params
const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToType(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.status.pattern, req, [
        uiPaths.proposedAddresses.type.pattern,
        uiPaths.cases.show.pattern,
      ])

      return res.render('pages/proposed-address/status', {
        crn,
        verificationStatusItems: radioItems(
          verificationStatusLabels,
          proposedAddressFormSessionData?.verificationStatus,
        ),
        backLinkHref,
        address: formatAddress(proposedAddressFormSessionData.address),
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveStatus(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateStatusFromRequest(req, this.formData)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const caseListUrl = getActiveCaseListSegment(req)

      if (proposedAddressFormSessionData?.verificationStatus === 'PASSED') {
        return res.redirect(uiPaths.proposedAddresses.nextAccommodation({ caseListUrl, crn: req.params.crn }))
      }

      return this.continue(req, res, uiPaths.proposedAddresses.checkYourAnswers({ caseListUrl, crn: req.params.crn }))
    }
  }

  nextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { token } = res.locals.user
      const { crn } = req.params
const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const { data: caseData } = await this.casesService.getCase(token, crn)

      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.nextAccommodation.pattern, req, [
        uiPaths.cases.show.pattern,
        uiPaths.proposedAddresses.status.pattern,
      ])

      return res.render('pages/proposed-address/next-accommodation', {
        crn,
        nextAccommodationStatusItems: radioItems(
          nextAccommodationStatusLabels,
          proposedAddressFormSessionData?.nextAccommodationStatus,
        ),
        name: displayName(caseData),
        backLinkHref,
        address: formatAddress(proposedAddressFormSessionData.address),
        errors,
        errorSummary,
        caseListUrl,
      })
    }
  }

  saveNextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateNextAccommodationFromRequest(req, this.formData)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const caseListUrl = getActiveCaseListSegment(req)
      return this.continue(req, res, uiPaths.proposedAddresses.checkYourAnswers({ caseListUrl, crn: req.params.crn }))
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { token } = res.locals.user
      const { crn } = req.params
      const caseListUrl = getActiveCaseListSegment(req)
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.formData.update(crn, req.session, { redirect: uiPaths.proposedAddresses.checkYourAnswers({ caseListUrl, crn }) })

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)
      const { data: accommodationTypes } = await this.referenceDataService.getAccommodationTypes(token)

      const tableRows = checkYourAnswersRows(proposedAddressFormSessionData, crn, accommodationTypes, caseListUrl)
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
        caseListUrl,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)
      const caseListUrl = getActiveCaseListSegment(req)
      try {
        await this.proposedAddressesService.submit(token, req.params.crn, proposedAddressFormSessionData)

        await this.formData.remove(req.params.crn, req.session)
        req.flash('success', 'Private address added')
        return res.redirect(uiPaths.cases.show({ caseListUrl, crn: req.params.crn }))
      } catch {
        addErrorToFlash(req, 'checkYourAnswers', 'There was an error saving the address')
        return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ caseListUrl, crn: req.params.crn }))
      }
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      const {  crn } = req.params
      const { redirect } = this.formData.get(crn, req.session)
const caseListUrl = getActiveCaseListSegment(req)
      await this.formData.remove(crn, req.session)

      return res.redirect(
        redirect && redirect !== uiPaths.proposedAddresses.checkYourAnswers({ caseListUrl, crn })
          ? redirect
          : uiPaths.cases.show({ caseListUrl, crn }),
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

  arrival(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
const caseListUrl = getActiveCaseListSegment(req)
      await this.auditService.logPageView(Page.PROPOSED_ADDRESS_ARRIVAL, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const {
        data: { caseData, proposedAddress },
      } = await collectApiResponses({
        caseData: this.casesService.getCase(token, crn),
        proposedAddress: this.proposedAddressesService.getProposedAddress(token, crn, id),
      })

      const backLinkHref = getPageBackLink(uiPaths.proposedAddresses.arrival.pattern, req, [
        uiPaths.proposedAddresses.show.pattern,
        uiPaths.cases.show.pattern,
      ])

      return res.render('pages/proposed-address/arrival', {
        backLinkHref,
        pageHeading: `Confirm that ${displayName(caseData)} has moved into this address`,
        addressLines: addressLines(proposedAddress.address),
        cancelLinkHref: backLinkHref,
        caseListUrl,
      })
    }
  }

  saveArrival(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

        const caseListUrl = getActiveCaseListSegment(req)
      try {
        const arrival: ProposedAccommodationArrivalCommand = {
          arrivalDate: getTodayLocal(),
          arrivalMethod: 'STANDARD',
        }
        await this.proposedAddressesService.submitArrival(token, crn, id, arrival)
        req.flash('success', 'Current address updated')
        return res.redirect(uiPaths.cases.show({ caseListUrl, crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the current address. Please try again.')
        return res.redirect(uiPaths.proposedAddresses.arrival({ caseListUrl, crn, id }))
      }
    }
  }
}
