import { Request, RequestHandler, Response } from 'express'
import { AddressDetails } from '@sas/api'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  summaryListRows,
  updateAddressFromQuery,
  updateTypeFromQuery,
  updateStatusFromQuery,
  validateAddressFromSession,
  validateTypeFromSession,
  validateStatusFromSession,
} from '../utils/proposedAddresses'
import { fetchErrors } from '../utils/validation'
import ProposedAddressesService from '../services/proposedAddressesService'

export default class ProposedAddressesController {
  formData: MultiPageFormManager<'proposedAddress'>

  constructor(
    private readonly auditService: AuditService,
    private readonly proposedAddressesService: ProposedAddressesService,
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

      res.render('pages/proposed-address/details', {
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

      await updateAddressFromQuery(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateAddressFromSession(req, proposedAddressFormSessionData)) {
          return res.redirect(uiPaths.proposedAddresses.details({ crn: req.params.crn }))
        }
      }

      res.render('pages/proposed-address/type', {
        crn: req.params.crn,
        proposedAddress: proposedAddressFormSessionData,
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

      await updateTypeFromQuery(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateTypeFromSession(req, proposedAddressFormSessionData)) {
          return res.redirect(uiPaths.proposedAddresses.type({ crn: req.params.crn }))
        }
      }

      res.render('pages/proposed-address/status', {
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

      await updateStatusFromQuery(req, this.formData)

      const proposedAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateStatusFromSession(req, proposedAddressFormSessionData)) {
        return res.redirect(uiPaths.proposedAddresses.status({ crn: req.params.crn }))
      }

      const tableRows = summaryListRows(proposedAddressFormSessionData, req.params.crn)
      res.render('pages/proposed-address/check-your-answers', {
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
      res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PROPOSED_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      this.formData.remove(req.params.crn, req.session)
      res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }
}
