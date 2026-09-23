import { Request, RequestHandler, Response } from 'express'
import { OtherAccommodationReferralCommand } from '@sas/api'
import uiPaths from '../paths/ui'
import CasesService from '../services/casesService'
import AuditService, { Page } from '../services/auditService'
import { addGenericErrorToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import OtherReferralsService from '../services/otherReferralsService'
import { dateInputToIsoDate } from '../utils/dates'
import { validateSubmission, submissionFormValues } from '../utils/otherReferrals'
import { validateSubmission, submissionFormValues, detailsSummaryListRows } from '../utils/otherReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'
import { summaryListRows } from '../utils/dutyToRefer'

export type SubmissionFlow = 'add' | 'edit'

export default class OtherReferralsController {
  constructor(
    private readonly auditService: AuditService,
    private readonly otherReferralsService: OtherReferralsService,
    private readonly casesService: CasesService,
  ) {}

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { username, token } = res.locals.user

      await this.auditService.logPageView(Page.DUTY_TO_REFER_DETAILS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [{ data: caseData }, { data: referral }] = await Promise.all([
        this.casesService.getCase(token, crn),
        this.otherReferralsService.getOtherReferralBySubmissionId(token, crn, id),
      ])

      const submissionDetailRows = detailsSummaryListRows(referral)

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)

      return res.render('pages/other-referrals/show', {
        breadcrumbs: breadcrumbs(req, caseData),
        crn,
        referralId: id,
        displayName: displayName(caseData),
        caseData,
        referral,
        assignedTo: caseAssignedTo(caseData, username),
        submissionDetailRows,
        status: referral?.status,
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

      const backLinkHref = id ? uiPaths.otherReferrals.show({ crn, id }) : uiPaths.cases.show({ crn })

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

      return res.render('pages/other-referrals/submission', {
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
      const { organisationName, referenceNumber, website, submissionNote } = req.body
      const errorRedirect = {
        add: uiPaths.otherReferrals.submission,
        edit: uiPaths.otherReferrals.edit,
      }[flow]({ crn, id })

      if (!validateSubmission(req)) {
        return res.redirect(errorRedirect)
      }

      const submissionDate = dateInputToIsoDate(req.body, 'submissionDate')

      try {
        const submission: OtherAccommodationReferralCommand = {
          status: 'SUBMITTED',
          submissionDate,
          referenceNumber,
          organisationName,
          website,
          // email,  // TODO: not in the DTO yet
          // phone,
          submissionNote,
        }

        if (id) {
          const { data: referral } = await this.otherReferralsService.getOtherReferralBySubmissionId(token, crn, id)
          if (referral.status !== 'SUBMITTED') {
            submission.status = referral.status
          }
          await this.otherReferralsService.update(token, crn, id, submission)

          req.flash('success', 'Referral details changed')
          return res.redirect(uiPaths.otherReferrals.show({ crn, id }))
        }

        await this.otherReferralsService.submit(token, crn, submission)

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
      id ? this.otherReferralsService.getOtherReferralBySubmissionId(token, crn, id) : undefined,
    ])

    const tableRows = summaryListRows(caseData)

    return { tableRows, referral }
  }
}
