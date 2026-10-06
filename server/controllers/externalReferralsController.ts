import { Request, RequestHandler, Response } from 'express'
import { ExternalReferralCommand, ExternalReferralDto } from '@sas/api'
import uiPaths from '../paths/ui'
import CasesService from '../services/casesService'
import AuditService, { Page } from '../services/auditService'
import { addGenericErrorToFlash, addUserInputToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import ExternalReferralsService from '../services/externalReferralsService'
import { dateInputToIsoDate } from '../utils/dates'
import {
  validateSubmission,
  submissionFormValues,
  detailsSummaryListRows,
  externalReferralTimelineEntry,
  validateNote,
  summaryListRows,
  validateOutcome,
  outcomeDetailsSummaryListRows,
  outcomeRadioItems,
} from '../utils/externalReferrals'
import { breadcrumbs } from '../utils/breadcrumbs'
import { caseAssignedTo, displayName } from '../utils/cases'

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

      await this.auditService.logPageView(Page.EXTERNAL_REFERRALS_DETAILS, {
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
        outcomeDetailRows: outcomeDetailsSummaryListRows(referral),
        outcomePath: uiPaths.externalReferrals.outcome({ crn, id }),
        editPath: uiPaths.externalReferrals.edit({ crn, id }),
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

      await this.auditService.logPageView(Page.EXTERNAL_REFERRALS_SUBMISSION, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { caseData, referral } = await this.getSubmissionPageData(token, crn, id)
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
        tableRows: summaryListRows(caseData),
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
      const referral = await this.getReferral(token, crn, id)

      try {
        const submission: ExternalReferralCommand = {
          ...this.preFillCommand(referral),
          submissionDate,
          referenceNumber: referenceNumber || undefined,
          organisationName,
          website: website || undefined,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
          submissionNote: submissionNote || undefined,
        }

        if (id) {
          await this.externalReferralsService.update(token, crn, id, submission)

          req.flash('success', 'Referral details changed')
          return res.redirect(uiPaths.externalReferrals.show({ crn, id }))
        }

        await this.externalReferralsService.submit(token, crn, submission)

        req.flash('success', 'Referral details added')
        return res.redirect(uiPaths.cases.show({ crn }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the submission details. Please try again.')
        addUserInputToFlash(req)
        return res.redirect(errorRedirect)
      }
    }
  }

  saveNote(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { note } = req.body

      await this.auditService.logPageView(Page.EXTERNAL_REFERRALS_ADD_NOTE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      if (!validateNote(req)) {
        return res.redirect(uiPaths.externalReferrals.show({ crn, id }))
      }

      try {
        await this.externalReferralsService.saveNote(token, crn, id, note)
        req.flash('success', 'Note added')
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the note. Please try again.')
        addUserInputToFlash(req)
      }
      return res.redirect(uiPaths.externalReferrals.show({ crn, id }))
    }
  }

  outcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const {
        id: correlationId,
        params: { crn, id },
      } = req
      const { token, username } = res.locals.user

      await this.auditService.logPageView(Page.EXTERNAL_REFERRALS_OUTCOME, {
        who: username,
        correlationId,
      })

      const { caseData, referral } = await this.getSubmissionPageData(token, crn, id)

      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)
      const outcomeStatus: ExternalReferralDto['status'] = userInput?.outcomeStatus ?? referral?.status

      return res.render('pages/external-referrals/outcome', {
        pageTitle: `${referral.status === 'SUBMITTED' ? 'Add' : 'Edit'} external referral outcome`,
        backLinkHref: uiPaths.externalReferrals.show({ crn, id }),
        crn,
        tableRows: summaryListRows(caseData, referral),
        statusItems: outcomeRadioItems(outcomeStatus),
        errors,
        errorSummary,
        outcomeNote: referral.submission.outcomeNote,
        ...userInput,
      })
    }
  }

  saveOutcome(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn, id } = req.params
      const { token } = res.locals.user
      const { outcomeStatus, outcomeNote } = req.body
      const errorRedirect = uiPaths.externalReferrals.outcome({ crn, id })

      if (!validateOutcome(req)) {
        return res.redirect(errorRedirect)
      }

      const referral = await this.getReferral(token, crn, id)
      try {
        await this.externalReferralsService.update(token, crn, id, {
          ...this.preFillCommand(referral),
          status: outcomeStatus,
          outcomeNote: outcomeNote || undefined,
        })

        const flash: { heading: string; body: string } = {
          heading: referral.status !== 'SUBMITTED' ? 'Outcome details changed' : 'Outcome details added',
          body:
            (outcomeStatus as ExternalReferralDto['status']) === 'ACCEPTED'
              ? `If the organisation has shared a possible address, <a href="${uiPaths.proposedAddresses.start({ crn })}">add it as a proposed address</a>.`
              : undefined,
        }

        req.flash('success', flash)
        return res.redirect(uiPaths.externalReferrals.show({ crn, id }))
      } catch {
        addGenericErrorToFlash(req, 'There was a problem saving the outcome details. Please try again.')
        addUserInputToFlash(req)
        return res.redirect(errorRedirect)
      }
    }
  }

  private async getReferral(token: string, crn: string, id?: string) {
    return (await this.getSubmissionPageData(token, crn, id, false)).referral
  }

  private async getSubmissionPageData(token: string, crn: string, id?: string, getCase = true) {
    const [{ data: caseData } = {}, { data: referral } = {}] = await Promise.all([
      getCase ? this.casesService.getCase(token, crn) : undefined,
      id ? this.externalReferralsService.getExternalReferralBySubmissionId(token, crn, id) : undefined,
    ])

    return { referral, caseData }
  }

  private preFillCommand(referral: ExternalReferralDto): ExternalReferralCommand {
    const {
      status,
      submission: {
        submissionDate,
        referenceNumber,
        organisationName,
        website,
        phoneNumber,
        email,
        submissionNote,
        outcomeNote,
      } = {},
    } = referral || {}

    return {
      submissionDate,
      status: status || 'SUBMITTED',
      referenceNumber,
      organisationName,
      website,
      email,
      phoneNumber,
      submissionNote,
      outcomeNote,
    }
  }
}
