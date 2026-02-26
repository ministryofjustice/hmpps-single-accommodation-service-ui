import { Request, RequestHandler, Response } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  summaryListRows,
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
} from '../utils/proposedAddresses'
import { addErrorToFlash } from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import CasesService from '../services/casesService'
import { getPageBackLink } from '../utils/backlinks'

export default class ProposedAddressesController {
  formData: MultiPageFormManager<'proposedAddress'>

  constructor(
    private readonly auditService: AuditService,
    private readonly proposedAddressesService: ProposedAddressesService,
    private readonly casesService: CasesService,
  ) {
    this.formData = new MultiPageFormManager('proposedAddress')
  }

  start(): RequestHandler {
    return async (req: Request, res: Response) => {
      this.formData.remove(req.params.crn, req.session)
      await this.formData.update(req.params.crn, req.session, { flow: 'full' })
      return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
    }
  }

  edit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const flow = req.query.flow as ProposedAddressFormData['flow']
      const { crn, id } = req.params

      const redirect = flowRedirects[flow]
      if (!redirect) return res.redirect(uiPaths.cases.show({ crn }))

      this.formData.remove(crn, req.session)
      const { token } = res.locals.user

      const proposedAddress = await this.proposedAddressesService.getProposedAddress(token, crn, id)
      await this.formData.update(crn, req.session, { ...proposedAddress, flow })

      return res.redirect(redirect({ crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { errors, errorSummary } = res.locals
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      return res.render('pages/proposed-address/details', {
        crn: req.params.crn,
        address: proposedAddressFormSessionData?.address || {},
        errors,
        errorSummary,
      })
    }
  }

  saveDetails(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = await updateAddressFromRequest(req, this.formData)
      const redirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      return res.redirect(uiPaths.proposedAddresses.type({ crn: req.params.crn }))
    }
  }

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = res.locals
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const caseData = await this.casesService.getCase(token, crn)

      return res.render('pages/proposed-address/type', {
        crn,
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

      return res.redirect(uiPaths.proposedAddresses.status({ crn: req.params.crn }))
    }
  }

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToType(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = res.locals
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

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

      if (proposedAddressFormSessionData?.flow !== 'full') {
        return this.updateAndRedirect(req, res, proposedAddressFormSessionData)
      }
      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  nextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(crn, req.session)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = res.locals
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
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

      if (proposedAddressFormSessionData?.flow !== 'full') {
        return this.updateAndRedirect(req, res, proposedAddressFormSessionData)
      }
      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      const { errors, errorSummary } = res.locals
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const caseData = await this.casesService.getCase(token, crn)

      const tableRows = summaryListRows(proposedAddressFormSessionData, crn, caseData.name)
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

        this.formData.remove(req.params.crn, req.session)
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
      this.formData.remove(req.params.crn, req.session)
      return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }

  private async updateAndRedirect(
    req: Request,
    res: Response,
    proposedAddressFormSessionData: ProposedAddressFormData,
  ) {
    const { token } = res.locals.user
    await this.proposedAddressesService.update(token, req.params.crn, proposedAddressFormSessionData)

    this.formData.remove(req.params.crn, req.session)
    req.flash('success', 'Address updated')
    return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
  }
}
