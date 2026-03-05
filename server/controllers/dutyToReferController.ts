import { Request, RequestHandler, Response } from 'express'
import { faker } from '@faker-js/faker/locale/en_GB'
import uiPaths from '../paths/ui'
import { summaryListRows, validateOutcome, validateSubmission } from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService from '../services/auditService'
import { addErrorToFlash, fetchErrors } from '../utils/validation'

export default class DutyToReferController {
  constructor(
    private readonly auditService: AuditService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly casesService: CasesService,
  ) {}

  guidance(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params

      return res.render('pages/duty-to-refer/guidance', {
        crn,
      })
    }
  }

  submission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params
      const caseData = await this.casesService.getCase(token, crn)
      const tableRows = summaryListRows(caseData)

      const { errors, errorSummary } = fetchErrors(req)
      const localAuthorities = [
        { id: faker.string.uuid(), identifier: 'croydon_council', name: 'Croydon Council' },
        { id: faker.string.uuid(), identifier: 'hounslow_council', name: 'Hounslow Council' },
        { id: faker.string.uuid(), identifier: 'lambeth_council', name: 'Lambeth Council' },
      ]
      return res.render('pages/duty-to-refer/submission', {
        crn,
        tableRows,
        localAuthorities,
        errors,
        errorSummary,
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { localAuthorityStatus, referenceNumber } = req.body
      const submissionDate = `${req.body['submissionDate-year']}-${req.body['submissionDate-month']}-${req.body['submissionDate-day']}`

      let { localAuthorityAreaId } = req.body
      const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
      if (localAuthorityStatus === 'YES') {
        localAuthorityAreaId = dtr?.submission?.localAuthorityAreaId
      }

      const redirect = validateSubmission(req, localAuthorityAreaId, localAuthorityStatus)
      if (redirect) return res.redirect(redirect)

      try {
        await this.dutyToReferService.submit(token, crn, {
          status: 'SUBMITTED',
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', 'Submission details added')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch (error) {
        // TODO replace this with generic error
        addErrorToFlash(req, 'submission', 'There was a problem submitting the duty to refer. Please try again.')
        return res.redirect(uiPaths.dutyToRefer.submission({ crn }))
      }
    }
  }

  outcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      const caseData = await this.casesService.getCase(token, crn)
      const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary } = fetchErrors(req)

      return res.render('pages/duty-to-refer/outcome', {
        crn,
        tableRows,
        errors,
        errorSummary,
      })
    }
  }

  update(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user
      const { outcomeStatus } = req.body

      const redirect = validateOutcome(req, outcomeStatus)
      if (redirect) return res.redirect(redirect)

      try {
        const dtr = await this.dutyToReferService.getDutyToRefer(token, crn)
        const submissionDate = dtr?.submission?.submissionDate
        const localAuthorityAreaId = dtr?.submission?.localAuthorityAreaId
        const referenceNumber = dtr?.submission?.referenceNumber
        await this.dutyToReferService.update(token, crn, dtr.submission.id, {
          status: outcomeStatus,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', 'Submission details updated')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch (error) {
        // TODO replace this with generic error
        addErrorToFlash(req, 'submission', 'There was a problem updating duty to refer. Please try again.')
        return res.redirect(uiPaths.dutyToRefer.outcome({ crn }))
      }
    }
  }
}
