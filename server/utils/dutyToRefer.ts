import { Request } from 'express'
import { CaseDto, DutyToReferDto } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { StatusCard, StatusTag } from '@sas/ui'
import { dateIsEmpty, formatDateAndDaysAgo } from './dates'
import uiPaths from '../paths/ui'
import { validateAndFlashErrors } from './validation'

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
  switch (serviceStatus) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
      return [{ text: 'Notes', href: '#' }]
    case 'NOT_STARTED':
      return [
        { text: 'Add submission details', href: uiPaths.dutyToRefer.guidance({ crn }) },
        { text: 'Notes', href: '#' },
      ]
    case 'SUBMITTED':
      return [
        { text: 'Add outcome', href: uiPaths.dutyToRefer.outcome({ crn }) },
        { text: 'Notes', href: '#' },
      ]
    default:
      return []
  }
}

export const summaryListRows = (caseData: CaseDto, dutyToRefer: DutyToReferDto = undefined) => {
  const rows = [
    summaryListRow('Name', caseData.name),
    summaryListRow('Date of birth', caseData.dateOfBirth),
    summaryListRow('CRN', caseData.crn),
    summaryListRow('Prison number', caseData.prisonNumber),
  ]

  if (dutyToRefer) {
    rows.push(
      summaryListRow(
        'Submission date',
        dutyToRefer.submission.submissionDate ? formatDateAndDaysAgo(dutyToRefer.submission.submissionDate) : '',
      ),
    )
  }

  return rows
}

const summaryListRow = (label: string, value: string): SummaryListRow => ({
  key: { text: label },
  value: { text: value ?? '' },
})

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
        summaryListRow('Reference', dutyToRefer?.submission?.referenceNumber),
        summaryListRow('Submitted', formatDateAndDaysAgo(dutyToRefer?.submission?.submissionDate)),
      ]
    default:
      return []
  }
}

export const validateSubmission = (req: Request) => {
  const errors: Record<string, string> = {}
  const { localAuthorityAreaId } = req.body

  if (dateIsEmpty(req.body, 'submissionDate')) {
    errors.submissionDate = 'Enter a submission date'
  }
  if (!localAuthorityAreaId) {
    errors.localAuthorityAreaId = 'Select a local authority'
  }

  return !validateAndFlashErrors(req, errors) ? uiPaths.dutyToRefer.submission({ crn: req.params.crn }) : undefined
}

export const validateOutcome = (req: Request) => {
  const errors: Record<string, string> = {}
  const { outcomeStatus } = req.body

  if (!outcomeStatus) {
    errors.outcomeStatus = 'Select duty to refer outcome'
  }

  return !validateAndFlashErrors(req, errors) ? uiPaths.dutyToRefer.outcome({ crn: req.params.crn }) : undefined
}
