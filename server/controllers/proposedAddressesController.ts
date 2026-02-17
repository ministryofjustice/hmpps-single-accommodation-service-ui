import { Request, RequestHandler, Response } from 'express'
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
} from '../utils/proposedAddresses'
import { fetchErrors } from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'
import CasesService from '../services/casesService'
import { getCaseData } from '../utils/cases'

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

      return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
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
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToAddress(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      const caseData = await getCaseData(req, res, this.casesService)

      return res.render('pages/proposed-address/type', {
        crn: req.params.crn,
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

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      return res.render('pages/proposed-address/status', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        verificationStatusItems: verificationStatusItems(proposedAddressFormSessionData?.verificationStatus),
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
      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  nextAccommodation(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToStatus(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_NEXT_ACCOMMODATION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
      const caseData = await getCaseData(req, res, this.casesService)

      return res.render('pages/proposed-address/next-accommodation', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        nextAccommodationStatusItems: nextAccommodationStatusItems(
          proposedAddressFormSessionData?.nextAccommodationStatus,
        ),
        name: caseData.name,
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

      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const caseData = await getCaseData(req, res, this.casesService)

      const tableRows = summaryListRows(proposedAddressFormSessionData, req.params.crn, caseData.name)
      const backLinkHref =
        proposedAddressFormSessionData?.verificationStatus === 'PASSED'
          ? uiPaths.proposedAddresses.nextAccommodation({ crn: req.params.crn })
          : uiPaths.proposedAddresses.status({ crn: req.params.crn })

      return res.render('pages/proposed-address/check-your-answers', {
        crn: req.params.crn,
        tableRows,
        backLinkHref,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const token = res.locals?.user?.token
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const redirect = validateUpToNextAccommodation(req, proposedAddressFormSessionData)
      if (redirect) return res.redirect(redirect)

      await this.proposedAddressesService.submit(token, req.params.crn, proposedAddressFormSessionData)

      this.formData.remove(req.params.crn, req.session)
      req.flash('success', 'Private address added')
      return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      this.formData.remove(req.params.crn, req.session)
      return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }
}
