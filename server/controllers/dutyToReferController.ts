import { Request, RequestHandler, Response } from 'express'
import uiPaths from '../paths/ui'
import {
  validateSubmission,
  summaryListRows,
  validateOutcome,
  detailsSummaryListRows,
  outcomeDetailsSummaryListRows,
  dutyToReferTimelineEntry,
} from '../utils/dutyToRefer'
import CasesService from '../services/casesService'
import DutyToReferService from '../services/dutyToReferService'
import AuditService, { Page } from '../services/auditService'
import {
  addGenericErrorToFlash,
  addUserInputToFlash,
  fetchErrorsAndUserInput,
  validateAndFlashErrors,
} from '../utils/validation'
import { dateInputToIsoDate } from '../utils/dates'
import ReferenceDataService from '../services/referenceDataService'
import { caseAssignedTo } from '../utils/cases'
import { getFlowRedirect, setFlowRedirect } from '../utils/backlinks'

const FLOW_ENTRY_POINTS = [uiPaths.dutyToRefer.show.pattern, uiPaths.cases.show.pattern]

export default class DutyToReferController {
  constructor(
    private readonly auditService: AuditService,
    private readonly dutyToReferService: DutyToReferService,
    private readonly casesService: CasesService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: dutyToRefer }, auditRecords] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.dutyToReferService.getDtrBySubmissionId(token, crn, id),
        this.dutyToReferService.getTimeline(token, crn, id),
      ])

      const submissionDetailRows = detailsSummaryListRows(dutyToRefer)
      const outcomeDetailRows = outcomeDetailsSummaryListRows(dutyToRefer)

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/show', {
        crn,
        dtrId: id,
        caseData,
        assignedTo: caseAssignedTo(caseData, res.locals?.user?.userId),
        submissionDetailRows,
        outcomeDetailRows,
        timeline: auditRecords.map(dutyToReferTimelineEntry),
        status: dutyToRefer?.status,
        ...userInput,
        errors,
        errorSummary,
      })
    }
  }

  guidance(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params

      setFlowRedirect(uiPaths.dutyToRefer.guidance.pattern, req, FLOW_ENTRY_POINTS)

      await this.auditService.logPageView(Page.DUTY_TO_REFER_GUIDANCE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      return res.render('pages/duty-to-refer/guidance', {
        crn,
      })
    }
  }

  submission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn, id } = req.params

      const backLinkHref = id
        ? setFlowRedirect(uiPaths.dutyToRefer.guidance.pattern, req, FLOW_ENTRY_POINTS)
        : uiPaths.dutyToRefer.guidance({ crn })

      await this.auditService.logPageView(Page.DUTY_TO_REFER_SUBMISSION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { tableRows, localAuthorities } = await this.getSubmissionPageData(token, crn)
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/duty-to-refer/submission', {
        pageTitle: `${id ? 'Edit' : 'Add'} Duty to Refer (DTR) submission details`,
        backLinkHref,
        crn,
        tableRows,
        localAuthorities,
        errors,
        errorSummary,
        formValues: userInput,
      })
    }
  }

  saveSubmission(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { localAuthorityAreaId, referenceNumber } = req.body
      const errorRedirect = id ? uiPaths.dutyToRefer.edit({ crn, id }) : uiPaths.dutyToRefer.submission({ crn })
      const successRedirect = getFlowRedirect(uiPaths.dutyToRefer.guidance.pattern, req, uiPaths.cases.show({ crn }))

      if (!validateSubmission(req)) {
        return res.redirect(errorRedirect)
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        const submission = {
          status: 'SUBMITTED' as const,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        }

        if (id) {
          await this.dutyToReferService.update(token, crn, id, submission)
          req.flash('success', 'Submission details updated')
        } else {
          await this.dutyToReferService.submit(token, crn, submission)
          req.flash('success', 'Submission details added')
        }
        return res.redirect(successRedirect)
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the submission details. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  outcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_OUTCOME, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: dtr }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.dutyToReferService.getDtrBySubmissionId(token, crn, id),
      ])

      const tableRows = summaryListRows(caseData, dtr)

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      const backLinkHref = setFlowRedirect(uiPaths.dutyToRefer.outcome.pattern, req, FLOW_ENTRY_POINTS)

      return res.render('pages/duty-to-refer/outcome', {
        pageTitle: `${dtr.status === 'SUBMITTED' ? 'Add' : 'Edit'} Duty to Refer (DTR) outcome details`,
        backLinkHref,
        crn,
        dtr,
        tableRows,
        errors,
        errorSummary,
      })
    }
  }

  saveOutcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { outcomeStatus, currentStatus, submissionDate, localAuthorityAreaId, referenceNumber } = req.body
      const errorRedirect = uiPaths.dutyToRefer.outcome({ crn, id })
      const successRedirect = getFlowRedirect(uiPaths.dutyToRefer.outcome.pattern, req, uiPaths.cases.show({ crn }))

      if (!validateOutcome(req)) {
        return res.redirect(errorRedirect)
      }

      try {
        await this.dutyToReferService.update(token, crn, id, {
          status: outcomeStatus,
          submissionDate,
          localAuthorityAreaId,
          referenceNumber,
        })

        req.flash('success', currentStatus !== 'SUBMITTED' ? 'Outcome details updated' : 'Outcome details added')
        return res.redirect(successRedirect)
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the outcome details. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  saveNote(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS_ADD_NOTE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { crn, id } = req.params
      const { token } = res.locals.user
      const { note } = req.body

      if (!note) {
        validateAndFlashErrors(req, { note: 'Enter a note' })
        return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
      }

      try {
        await this.dutyToReferService.submitTimelineNote(token, crn, id, { note })
        req.flash('success', 'Note added')
      } catch (error) {
        addGenericErrorToFlash(req, error.message)
        addUserInputToFlash(req)
      }
      return res.redirect(uiPaths.dutyToRefer.show({ crn, id }))
    }
  }

  private async getSubmissionPageData(token: string, crn: string) {
    const [{ data: caseData }, { data: localAuthorities }] = await Promise.all([
      this.casesService.getCase(token, crn),
      this.referenceDataService.getLocalAuthorities(token),
    ])

    const tableRows = summaryListRows(caseData)

    return { tableRows, localAuthorities }
  }
}
