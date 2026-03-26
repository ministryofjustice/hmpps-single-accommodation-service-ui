import { Request } from 'express'
import { CaseDto, DutyToReferDto } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { StatusCard, StatusTag } from '@sas/ui'
import { formatDateAndDaysAgo, dateInputToIsoDate, formatDateAndAge } from './dates'
import uiPaths from '../paths/ui'
import { validateAndFlashErrors } from './validation'
import { statusTag } from './macros'
import { summaryListRowHtml, summaryListRowText } from './utils'

const dutyToReferStatusTag = (status: DutyToReferDto['status']): StatusTag =>
  ({
    NOT_ACCEPTED: { text: 'Not accepted' },
    ACCEPTED: { text: 'Accepted', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'red' },
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
  })[status] || { text: 'Unknown' }

export const dutyToReferStatusCard = (dutyToRefer: DutyToReferDto): StatusCard => {
  const status = dutyToRefer?.status
  return {
    heading: 'Duty to Refer (DTR)',
    inactive: status === 'NOT_ACCEPTED',
    status: dutyToReferStatusTag(status),
    details: detailsForStatus(dutyToRefer),
    links: linksForStatus(status, dutyToRefer?.crn),
  }
}

export const linksForStatus = (serviceStatus?: string, crn?: string) => {
  if (!crn) return []

  const notes = { text: 'Notes', href: uiPaths.dutyToRefer.show({ crn }) }

  switch (serviceStatus) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
      return [notes]
    case 'NOT_STARTED':
      return crn ? [{ text: 'Add submission details', href: uiPaths.dutyToRefer.guidance({ crn }) }, notes] : [notes]
    case 'SUBMITTED':
      return crn ? [{ text: 'Add outcome', href: uiPaths.dutyToRefer.outcome({ crn }) }, notes] : [notes]
    default:
      return []
  }
}

export const summaryListRows = (caseData: CaseDto, dutyToRefer: DutyToReferDto = undefined) => {
  const rows = [
    summaryListRowText('Name', caseData.name),
    summaryListRowText('Date of birth', formatDateAndAge(caseData.dateOfBirth)),
    summaryListRowText('CRN', caseData.crn),
    summaryListRowText('Prison number', caseData.prisonNumber),
  ]

  if (dutyToRefer) {
    rows.push(summaryListRowText('Local authority', dutyToRefer.submission.localAuthority.localAuthorityAreaName))
    rows.push(
      summaryListRowText(
        'Submission date',
        dutyToRefer.submission.submissionDate ? formatDateAndDaysAgo(dutyToRefer.submission.submissionDate) : '',
      ),
    )
  }

  return rows
}

export const detailsSummaryListRows = (dutyToRefer: DutyToReferDto = undefined) => {
  const rows = []

  if (dutyToRefer?.status === 'NOT_STARTED' || dutyToRefer?.status === 'SUBMITTED') {
    rows.push(summaryListRowHtml('Status', statusTag(dutyToReferStatusTag(dutyToRefer.status))))
  }
  if (dutyToRefer?.status !== 'NOT_STARTED') {
    rows.push(
      summaryListRowText(
        'Date submitted',
        dutyToRefer.submission.submissionDate ? formatDateAndDaysAgo(dutyToRefer.submission.submissionDate) : '',
      ),
    )
    rows.push(summaryListRowText('Local authority', dutyToRefer.submission.localAuthority.localAuthorityAreaName))
    rows.push(summaryListRowText('Reference', dutyToRefer.submission.referenceNumber))
  }
  return rows
}

export const outcomeDetailsSummaryListRows = (dutyToRefer: DutyToReferDto = undefined) => {
  const rows = []

  if (dutyToRefer?.status !== 'NOT_STARTED' && dutyToRefer?.status !== 'SUBMITTED') {
    rows.push(
      summaryListRowHtml(
        'Status',
        `${statusTag(dutyToReferStatusTag(dutyToRefer.status))} <p class="govuk-!-margin-top-4">${outcomeSupportText(dutyToRefer)}</p>`,
      ),
    )
  }
  return rows
}

const outcomeSupportText = (dutyToRefer: DutyToReferDto): string => {
  const localAuthority = dutyToRefer.submission.localAuthority.localAuthorityAreaName
  return dutyToRefer.status === 'NOT_ACCEPTED'
    ? `${localAuthority} will not support this person with housing`
    : `${localAuthority} agreed to support this person with housing`
}

export const detailsForStatus = (dutyToRefer: DutyToReferDto): SummaryListRow[] => {
  const { status } = dutyToRefer ?? {}
  switch (status) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
      return []
    case 'NOT_STARTED':
      return []
    case 'SUBMITTED':
      return [
        summaryListRowText('Submitted to', dutyToRefer?.submission?.localAuthority?.localAuthorityAreaName),
        summaryListRowText('Reference', dutyToRefer?.submission?.referenceNumber),
        summaryListRowText('Submitted', formatDateAndDaysAgo(dutyToRefer?.submission?.submissionDate)),
      ]
    default:
      return []
  }
}

export const validateSubmission = (req: Request) => {
  const errors: Record<string, string> = {}
  const { localAuthorityAreaId } = req.body

  if (!dateInputToIsoDate(req.body, 'submissionDate')) {
    errors.submissionDate = 'Enter a submission date'
  }
  if (!localAuthorityAreaId) {
    errors.localAuthorityAreaId = 'Select a local authority'
  }

  return validateAndFlashErrors(req, errors)
}

export const validateOutcome = (req: Request) => {
  const errors: Record<string, string> = {}
  const { outcomeStatus } = req.body

  if (!outcomeStatus) {
    errors.outcomeStatus = 'Select duty to refer outcome'
  }

  return validateAndFlashErrors(req, errors)
}

export const formatDutyToReferStatus = (status: DutyToReferDto['status']): string =>
  ({
    NOT_ACCEPTED: 'Not accepted',
    ACCEPTED: 'Accepted',
    NOT_STARTED: 'Not started',
    SUBMITTED: 'Submitted',
  })[status]
