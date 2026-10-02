import { Request, RequestHandler, Response } from 'express'
import { ExternalReferralCommand } from '@sas/api'
import uiPaths from '../paths/ui'
import CasesService from '../services/casesService'
import AuditService, { Page } from '../services/auditService'
import { addGenericErrorToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import ExternalReferralsService from '../services/externalReferralsService'
import { dateInputToIsoDate } from '../utils/dates'
import {
  validateSubmission,
  submissionFormValues,
  detailsSummaryListRows,
  externalReferralTimelineEntry,
} from '../utils/externalReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'
import { summaryListRows } from '../utils/dutyToRefer'

export type SubmissionFlow = 'add' | 'edit'

export default class ExternalReferralsController {
  constructor(
    private readonly auditService: AuditService,
    private readonly externalReferralsService: ExternalReferralsService,
    private readonly casesService: CasesService,
  ) {}

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { username, token } = res.locals.user

      await this.auditService.logPageView(Page.EXTERNAL_REFFERALS_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: referral }, { data: auditRecords }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.externalReferralsService.getExternalReferralBySubmissionId(token, crn, id),
        this.externalReferralsService.getTimeline(token, crn, id),
      ])

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/external-referrals/show', {
        breadcrumbs: breadcrumbs(req, caseData),
        crn,
        referralId: id,
        displayName: displayName(caseData),
        caseData,
        referral,
        assignedTo: caseAssignedTo(caseData, username),
        submissionDetailRows: detailsSummaryListRows(referral),
        status: referral?.status,
        timeline: auditRecords.map(record => externalReferralTimelineEntry(record, username)),
        ...userInput,
        errors,
        errorSummary,
      })
    }
  }

  submission(flow: SubmissionFlow): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn, id } = req.params

      const backLinkHref = id ? uiPaths.externalReferrals.show({ crn, id }) : uiPaths.cases.show({ crn })

      await this.auditService.logPageView(Page.EXTERNAL_REFFERALS_SUBMISSION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { tableRows, referral } = await this.getSubmissionPageData(token, crn, id)
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      const formValues = {
        ...submissionFormValues(referral),
        ...userInput,
      }

      const pageTitleAction = { add: 'Add', addNew: 'Add new', edit: 'Edit' }[flow]

      return res.render('pages/external-referrals/submission', {
        pageTitle: `${pageTitleAction} external referral details`,
        backLinkHref,
        crn,
        tableRows,
        errors,
        errorSummary,
        formValues,
      })
    }
  }

  saveSubmission(flow: SubmissionFlow): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { organisationName, referenceNumber, website, submissionNote, email, phoneNumber } = req.body
      const errorRedirect = {
        add: uiPaths.externalReferrals.submission,
        edit: uiPaths.externalReferrals.edit,
      }[flow]({ crn, id })

      if (!validateSubmission(req)) {
        return res.redirect(errorRedirect)
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        const submission: ExternalReferralCommand = {
          status: 'SUBMITTED',
          submissionDate,
          referenceNumber,
          organisationName,
          website,
          email,
          phoneNumber,
          submissionNote,
        }

        if (id) {
          const { data: referral } = await this.externalReferralsService.getExternalReferralBySubmissionId(
            token,
            crn,
            id,
          )
          if (referral.status !== 'SUBMITTED') {
            submission.status = referral.status
          }

          await this.externalReferralsService.update(token, crn, id, submission)

          req.flash('success', 'Referral details changed')
          return res.redirect(uiPaths.externalReferrals.show({ crn, id }))
        }

        await this.externalReferralsService.submit(token, crn, submission)

        req.flash('success', 'Referral details added')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the submission details. Please try again.')
        return res.redirect(errorRedirect)
      }
    }
  }

  private async getSubmissionPageData(token: string, crn: string, id?: string) {
    const [{ data: caseData }, { data: referral } = {}] = await Promise.all([
      this.casesService.getCase(token, crn),
      id ? this.externalReferralsService.getExternalReferralBySubmissionId(token, crn, id) : undefined,
    ])

    const tableRows = summaryListRows(caseData)

    return { tableRows, referral }
  }
}
