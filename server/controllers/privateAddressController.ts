import { Request, RequestHandler, Response } from 'express'
import { AddressDetails } from '@sas/api'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import MultiPageFormManager from '../utils/multiPageFormManager'
import {
  summaryListRows,
  updateAddressFromQuery,
  updateArrangementFromQuery,
  updateStatusFromQuery,
  validateAddressFromSession,
  validateArrangementFromSession,
  validateStatusFromSession,
} from '../utils/privateAddress'
import { addErrorToFlash, fetchErrors } from '../utils/validation'
import PrivateAddressService from '../services/privateAddressService'

export default class PrivateAddressController {
  formData: MultiPageFormManager<'privateAddress'>

  constructor(
    private readonly auditService: AuditService,
    private readonly privateAddressService: PrivateAddressService,
  ) {
    this.formData = new MultiPageFormManager('privateAddress')
  }

  start(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      return res.redirect(uiPaths.privateAddress.details({ crn: req.params.crn }))
    }
  }

  details(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)
      const privateAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      res.render('pages/private-address/details', {
        crn: req.params.crn,
        address: privateAddressFormSessionData?.address || {},
        errors,
        errorSummary,
      })
    }
  }

  type(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      await updateAddressFromQuery(req, this.formData)

      const privateAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateAddressFromSession(req, privateAddressFormSessionData)) {
          return res.redirect(uiPaths.privateAddress.details({ crn: req.params.crn }))
        }
      }

      res.render('pages/private-address/type', {
        crn: req.params.crn,
        privateAddress: privateAddressFormSessionData,
        errors,
        errorSummary,
      })
    }
  }

  status(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary } = fetchErrors(req)

      await updateArrangementFromQuery(req, this.formData)

      const privateAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!errors || Object.keys(errors).length === 0) {
        if (!validateArrangementFromSession(req, privateAddressFormSessionData)) {
          return res.redirect(uiPaths.privateAddress.type({ crn: req.params.crn }))
        }
      }

      res.render('pages/private-address/status', {
        crn: req.params.crn,
        privateAddress: privateAddressFormSessionData,
        errors,
        errorSummary,
      })
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      await updateStatusFromQuery(req, this.formData)

      const privateAddressFormSessionData = this.formData.get(req.params.crn, req.session)
      if (!validateStatusFromSession(req, privateAddressFormSessionData)) {
        return res.redirect(uiPaths.privateAddress.status({ crn: req.params.crn }))
      }

      const tableRows = summaryListRows(privateAddressFormSessionData, req.params.crn)
      res.render('pages/private-address/check-your-answers', {
        crn: req.params.crn,
        tableRows,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const token = res.locals?.user?.token
      const privateAddressFormSessionData = this.formData.get(req.params.crn, req.session)

      await this.privateAddressService.submit(token, req.params.crn, privateAddressFormSessionData)

      this.formData.remove(req.params.crn, req.session)
      res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }

  cancel(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.ADD_PRIVATE_ADDRESS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      this.formData.remove(req.params.crn, req.session)
      res.redirect(uiPaths.cases.show({ crn: req.params.crn }))
    }
  }
}
