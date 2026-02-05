import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  summaryListRows,
  updateAddressFromRequest,
  updateTypeFromRequest,
  updateStatusFromRequest,
  validateAddressFromSession,
  validateTypeFromSession,
  validateStatusFromSession,
  updateConfirmationFromRequest,
  validateConfirmationFromSession,
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
      await updateAddressFromRequest(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateAddressFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
      }

      return res.redirect(uiPaths.proposedAddresses.type({ crn: req.params.crn }))
    }
  }

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_TYPE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      const caseData = await getCaseData(req, res, this.casesService)

      return res.render('pages/proposed-address/type', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        name: caseData.name,
        errors,
        errorSummary,
      })
    }
  }

  saveType(): RequestHandler {
    return async (req: Request, res: Response) => {
      await updateTypeFromRequest(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateTypeFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.type({ crn: req.params.crn }))
      }

      return res.redirect(uiPaths.proposedAddresses.status({ crn: req.params.crn }))
    }
  }

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_STATUS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      return res.render('pages/proposed-address/status', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        errors,
        errorSummary,
      })
    }
  }

  saveStatus(): RequestHandler {
    return async (req: Request, res: Response) => {
      await updateStatusFromRequest(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateStatusFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.status({ crn: req.params.crn }))
      }
      if (proposedAddressFormSessionData?.status === 'CHECKS_PASSED') {
        return res.redirect(uiPaths.proposedAddresses.confirmation({ crn: req.params.crn }))
      }
      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  confirmation(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CONFIRMATION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const caseData = await getCaseData(req, res, this.casesService)

      return res.render('pages/proposed-address/confirmation', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        name: caseData.name,
        errors,
        errorSummary,
      })
    }
  }

  saveConfirmation(): RequestHandler {
    return async (req: Request, res: Response) => {
      await updateConfirmationFromRequest(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateConfirmationFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.confirmation({ crn: req.params.crn }))
      }

      return res.redirect(uiPaths.proposedAddresses.checkYourAnswers({ crn: req.params.crn }))
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      const caseData = await getCaseData(req, res, this.casesService)

      const tableRows = summaryListRows(proposedAddressFormSessionData, req.params.crn, caseData.name)
      const backLinkHref =
        proposedAddressFormSessionData?.status === 'CHECKS_PASSED'
          ? uiPaths.proposedAddresses.confirmation({ crn: req.params.crn })
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

      await this.proposedAddressesService.submit(token, req.params.crn, proposedAddressFormSessionData)

      this.formData.remove(req.params.crn, req.session)
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
