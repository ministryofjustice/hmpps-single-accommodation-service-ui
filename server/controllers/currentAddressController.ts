import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import ProposedAddressesService from '../services/proposedAddressesService'
import uiPaths from '../paths/ui'
import { displayName } from '../utils/cases'
import { deliusAddressHistoryUrl, NEW_ADDRESS_OPTION, proposedAddressItems } from '../utils/currentAddress'
import {
  addGenericErrorToFlash,
  fetchErrorsAndUserInput,
  validateAndFlashErrors,
  validateRadioButton,
} from '../utils/validation'
import { getPageBackLink } from '../utils/backlinks'
import { getTodayLocal } from '../utils/dates'

export default class CurrentAddressController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly proposedAddressesService: ProposedAddressesService,
  ) {}

  select(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      const [{ data: caseData }, { data: proposedAddresses }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.proposedAddressesService.getProposedAddresses(token, crn, { excludeVerificationFailed: true }),
      ])

      if (!proposedAddresses.proposed.length) {
        return res.redirect(uiPaths.currentAddress.new({ crn }))
      }

      await this.auditService.logPageView(Page.CURRENT_ADDRESS_SELECT, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const backLinkHref = getPageBackLink(uiPaths.currentAddress.select.pattern, req, [uiPaths.cases.show.pattern])

      return res.render('pages/current-address/select', {
        crn,
        backLinkHref,
        cancelLinkHref: backLinkHref,
        pageHeading: `What is the new current address for ${displayName(caseData)}?`,
        items: proposedAddressItems(proposedAddresses.proposed, userInput.proposedAddressId),
        errors,
        errorSummary,
      })
    }
  }

  saveSelect(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { proposedAddressId } = req.body

      const isValid = validateAndFlashErrors(req, {
        proposedAddressId: validateRadioButton(proposedAddressId, 'address'),
      })

      if (!isValid) {
        return res.redirect(uiPaths.currentAddress.select({ crn }))
      }

      if (proposedAddressId === NEW_ADDRESS_OPTION) {
        return res.redirect(uiPaths.currentAddress.new({ crn }))
      }

      try {
        await this.proposedAddressesService.submitArrival(token, crn, proposedAddressId, {
          arrivalDate: getTodayLocal(),
        })
        req.flash('success', 'Current address changed')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the current address. Please try again.')
        return res.redirect(uiPaths.currentAddress.select({ crn }))
      }
    }
  }

  addNew(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.CURRENT_ADDRESS_NEW, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { data: caseData } = await this.casesService.getCase(token, crn)

      return res.render('pages/current-address/new', {
        backLinkHref: getPageBackLink(uiPaths.currentAddress.new.pattern, req, [
          uiPaths.cases.show.pattern,
          uiPaths.currentAddress.select.pattern,
        ]),
        displayName: displayName(caseData),
        deliusLink: deliusAddressHistoryUrl(crn),
      })
    }
  }
}
