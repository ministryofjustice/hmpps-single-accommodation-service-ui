import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  summaryListRows,
  updateAddressFromBody,
  updateTypeFromBody,
  updateStatusFromBody,
  validateAddressFromSession,
  validateTypeFromSession,
  validateStatusFromSession,
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
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
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

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      await updateAddressFromBody(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateAddressFromSession(req, proposedAddressFormSessionData)) {
          return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
        }
      }

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

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      await updateTypeFromBody(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateTypeFromSession(req, proposedAddressFormSessionData)) {
          return res.redirect(uiPaths.proposedAddresses.type({ crn: req.params.crn }))
        }
      }

      return res.render('pages/proposed-address/status', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
        errors,
        errorSummary,
      })
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      await updateStatusFromBody(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateStatusFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.status({ crn: req.params.crn }))
      }

      const caseData = await getCaseData(req, res, this.casesService)

      const tableRows = summaryListRows(proposedAddressFormSessionData, req.params.crn, caseData.name)
      return res.render('pages/proposed-address/check-your-answers', {
        crn: req.params.crn,
        tableRows,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const token = res.locals?.user?.token
      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      await this.proposedAddressesService.submit(token, req.params.crn, proposedAddressFormSessionData)

      this.formData.remove(req.params.crn, req.session)
      return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      this.formData.remove(req.params.crn, req.session)
      return res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }
}
