import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import uiPaths from '../paths/ui'
import { displayName } from '../utils/cases'
import { addGenericErrorToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import config from '../config'

export default class ApplicationsController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
  ) {}

  arrival(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, applicationId } = req.params
      if (!config.flags.cas2ManualArrivalEnabled) return res.sendStatus(404)

      const { data: caseData } = await this.casesService.getCase(res.locals.user.token, crn)
      await this.auditService.logPageView(Page.CAS2_ARRIVAL, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { errorSummary } = fetchErrorsAndUserInput(req)
      return res.render('pages/applications/cas2/arrival', {
        displayName: displayName(caseData),
        formAction: uiPaths.applications.arrival({ crn, applicationId }),
        backLinkHref: uiPaths.cases.show({ crn }),
        cancelLinkHref: uiPaths.cases.show({ crn }),
        errorSummary,
      })
    }
  }

  saveArrival(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, applicationId } = req.params
      if (!config.flags.cas2ManualArrivalEnabled) return res.sendStatus(404)

      try {
        await this.casesService.submitCas2Arrival(res.locals.user.token, crn, applicationId, {
          markedAsArrivedDateTime: new Date().toISOString(),
        })
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem confirming the arrival. Please try again.')
        return res.redirect(uiPaths.applications.arrival({ crn, applicationId }))
      }
    }
  }
}
