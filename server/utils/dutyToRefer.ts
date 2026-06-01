import { Request } from 'express'
import {
  AuditRecordDto,
  CaseDto,
  DtrServiceResult,
  DtrSubmissionDto,
  DutyToReferDto,
  FieldChange,
} from '@sas/api'
import { SummaryListRow, TimelineEntry } from '@govuk/ui'
import { StatusCard } from '@sas/ui'
import { formatDateAndDaysAgo, dateInputToIsoDate, isoDateToDateInput, formatDateAndAge } from './dates'
import uiPaths from '../paths/ui'
import { validateAndFlashErrors } from './validation'
import { renderMacro, statusTag } from './macros'
import { summaryListRowHtml, summaryListRowOptional, summaryListRowText } from './utils'
import { noteTimelineEntry, timelineEntry } from './timeline'
import { serviceStatusTag } from './statusTag'

export const submissionFormValues = (dtr: DutyToReferDto | undefined): Record<string, string> => {
  if (!dtr) return {}

  return {
    ...isoDateToDateInput(dtr.submission?.submissionDate, 'submissionDate'),
    localAuthorityAreaId: dtr.submission?.localAuthority?.localAuthorityAreaId,
    referenceNumber: dtr.submission?.referenceNumber,
  }
}

export const dutyToReferToDtrServiceResult = (dtr: DutyToReferDto): DtrServiceResult => ({
  caseId: dtr.caseId,
  serviceResult: { serviceStatus: dtr.status, failureReasons: [] },
  submission: dtr.submission,
})

export const dutyToReferStatusCard = (crn?: string, dutyToRefer?: DtrServiceResult): StatusCard => {
  const { serviceResult } = dutyToRefer || {}
  const { serviceStatus } = serviceResult || {}

  return {
    heading: 'Duty to Refer (DTR)',
    inactive: serviceStatus === 'NOT_ELIGIBLE',
    status: serviceStatusTag(serviceStatus, true),
    details: detailsForStatus(dutyToRefer),
    links: linksForStatus(dutyToRefer, crn),
  }
}

export const linksForStatus = (dtr?: DtrServiceResult, crn?: string) => {
  const status = dtr?.serviceResult?.serviceStatus
  const submission = dtr?.submission

  const notes = submission?.id && {
    text: 'View referral',
    href: uiPaths.dutyToRefer.show({ crn, id: submission.id }),
  }

  switch (status) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
      return [notes]
    case 'NOT_STARTED':
      return [{ text: 'Add referral details', href: uiPaths.dutyToRefer.submission({ crn }) }]
    case 'SUBMITTED':
      return [notes]
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
        'Date submitted',
        dutyToRefer.submission.submissionDate ? formatDateAndDaysAgo(dutyToRefer.submission.submissionDate) : '',
      ),
    )
  }

  return rows
}

export const detailsSummaryListRows = (dutyToRefer: DutyToReferDto = undefined) => {
  const rows = []

  if (dutyToRefer?.status === 'SUBMITTED') {
    rows.push(summaryListRowHtml('Status', statusTag(serviceStatusTag(dutyToRefer.status, true))))
  }
  rows.push(
    summaryListRowText(
      'Date submitted',
      dutyToRefer.submission.submissionDate ? formatDateAndDaysAgo(dutyToRefer.submission.submissionDate) : '',
    ),
  )
  rows.push(summaryListRowText('Local authority', dutyToRefer.submission.localAuthority.localAuthorityAreaName))
  rows.push(summaryListRowOptional('Reference', dutyToRefer.submission.referenceNumber, 'No reference added'))
  return rows
}

export const outcomeDetailsSummaryListRows = (dutyToRefer: DutyToReferDto = undefined) => {
  if (dutyToRefer?.status === 'SUBMITTED') {
    return []
  }

  return [
    summaryListRowHtml(
      'Status',
      `${statusTag(serviceStatusTag(dutyToRefer.status, true))} <p class="govuk-!-margin-top-4">${outcomeSupportText(dutyToRefer)}</p>`,
    ),
    summaryListRowText('Reason', outcomeReasonSummaryLabel[dutyToRefer.submission.outcomeReason]),
  ]
}

export const outcomeSupportText = (dutyToRefer: DutyToReferDto): string =>
  dutyToRefer.status === 'NOT_ACCEPTED'
    ? `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} will not support this person with housing`
    : `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} agreed to support this person with housing`

export const detailsForStatus = (dtr?: DtrServiceResult): SummaryListRow[] => {
  const status = dtr?.serviceResult?.serviceStatus
  const submission = dtr?.submission
  const rows: SummaryListRow[] = [
    summaryListRowText('Submitted to', submission?.localAuthority?.localAuthorityAreaName),
    summaryListRowOptional('Reference', submission?.referenceNumber, 'No reference added'),
    summaryListRowText('Submitted', formatDateAndDaysAgo(submission?.submissionDate)),
    summaryListRowText('Submitted by', submission?.createdBy),
  ]
  switch (status) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
    case 'SUBMITTED':
      return rows
    case 'NOT_ELIGIBLE':
    case 'NOT_STARTED':
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
  const { outcomeReason } = req.body

  if (!outcomeReason) {
    errors.outcomeReason = 'Select duty to refer outcome'
  }

  return validateAndFlashErrors(req, errors)
}

export const validateWithdraw = (req: Request) => {
  const errors: Record<string, string> = {}
  const { withdrawalReason, withdrawalReasonOther } = req.body

  if (!withdrawalReason) {
    errors.withdrawalReason = 'Select a reason for withdrawal'
  }

  if (withdrawalReason === 'OTHER' && !withdrawalReasonOther) {
    errors.withdrawalReasonOther = 'Enter a reason for withdrawal'
  }

  return validateAndFlashErrors(req, errors)
}

export const formatDutyToReferStatus = (status: DutyToReferDto['status']): string =>
  ({
    NOT_ACCEPTED: 'Not accepted',
    ACCEPTED: 'Accepted',
    SUBMITTED: 'Submitted',
    WITHDRAWN: 'Withdrawn',
  })[status]

const auditRecordChangesToDutyToRefer = (auditRecord: AuditRecordDto): Partial<DutyToReferDto> => {
  const submissionFields = [
    'submissionDate',
    'referenceNumber',
    'localAuthority',
    'id',
    'createdBy',
    'createdAt',
    'outcomeReason',
  ]
  const filterChanges = (predicate: (change: FieldChange) => boolean) =>
    Object.fromEntries(auditRecord.changes.filter(predicate).map(change => [change.field, change.value]))

  const submission = filterChanges(change => submissionFields.includes(change.field)) as Partial<DtrSubmissionDto>
  const { localAuthorityAreaName } = auditRecord.extraInformation || {}

  if (localAuthorityAreaName) {
    submission.localAuthority = { ...submission.localAuthority, localAuthorityAreaName }
  }

  return {
    ...filterChanges(change => !submissionFields.includes(change.field)),
    submission,
  } as DutyToReferDto
}

export const dutyToReferTimelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => {
  const { type } = auditRecord

  if (type === 'NOTE') return noteTimelineEntry(auditRecord)

  const dtr = auditRecordChangesToDutyToRefer(auditRecord)
  const { status } = dtr
  const isOutcome = status === 'ACCEPTED' || status === 'NOT_ACCEPTED'

  let label: string
  if (type === 'CREATE') {
    if (isOutcome) label = 'Outcome details added'
    else label = 'Submission details added'
  } else if (isOutcome) {
    label = 'Outcome details updated'
  } else {
    label = 'Submission details updated'
  }

  const { submissionDate, localAuthority, referenceNumber } = dtr.submission || {}
  const localAuthorityName = localAuthority?.localAuthorityAreaName
  const outcomeText = isOutcome && localAuthorityName ? outcomeSupportText(dtr as DutyToReferDto) : undefined

  const submissionValues =
    submissionDate || localAuthorityName || referenceNumber
      ? [
          { label: 'Date submitted', value: formatDateAndDaysAgo(submissionDate), showLabel: true },
          { label: 'Local authority', value: localAuthorityName, showLabel: true },
          { label: 'Reference', value: referenceNumber, showLabel: true },
        ]
      : undefined

  const values = isOutcome
    ? [
        { label: 'Outcome', value: outcomeText, showLabel: false },
        { label: 'Reason', value: outcomeReasonSummaryLabel[dtr.submission?.outcomeReason], showLabel: true },
      ]
    : submissionValues

  const html = renderMacro('timelineDutyToRefer', {
    type,
    isOutcome,
    status: status ? serviceStatusTag(status, true) : undefined,
    values,
  })

  return timelineEntry(label, html, auditRecord.commitDate, auditRecord.author)
}

export const outcomeItems = (outcomeReason?: DtrSubmissionDto['outcomeReason']) =>
  Object.entries(outcomeReasonLabel).map(([key, label]) => ({
    value: key,
    text: label,
    checked: outcomeReason === key,
  }))

export const outcomeReasonToStatus = (outcomeReason: DtrSubmissionDto['outcomeReason']): DutyToReferDto['status'] => {
  switch (outcomeReason) {
    case 'PREVENTION_AND_RELIEF_DUTY':
    case 'PRIORITY_NEED':
      return 'ACCEPTED'
    case 'NO_LOCAL_CONNECTION':
    case 'INTENTIONALLY_HOMELESS':
    case 'REJECTED_FOR_ANOTHER_REASON':
      return 'NOT_ACCEPTED'
    default:
      return 'SUBMITTED'
  }
}

export const outcomeReasonLabel: Record<DtrSubmissionDto['outcomeReason'], string> = {
  PREVENTION_AND_RELIEF_DUTY: 'Yes, it was accepted on prevention and relief duty',
  PRIORITY_NEED: 'Yes, it was accepted on a priority need',
  NO_LOCAL_CONNECTION: "No, it was rejected as there's no local connection",
  INTENTIONALLY_HOMELESS: "No, it was rejected as they're considered intentionally homeless",
  REJECTED_FOR_ANOTHER_REASON: 'No, it was rejected for another reason',
}

export const outcomeReasonSummaryLabel: Record<DtrSubmissionDto['outcomeReason'], string> = {
  PREVENTION_AND_RELIEF_DUTY: 'Prevention and relief duty',
  PRIORITY_NEED: 'Priority need',
  NO_LOCAL_CONNECTION: 'No local connection',
  INTENTIONALLY_HOMELESS: 'Intentionally homeless',
  REJECTED_FOR_ANOTHER_REASON: 'Other reason',
}

export const withdrawalReasonItems = () => [
  { value: 'NEW_REFERRAL', text: 'Replaced by a new referral' },
  {
    value: 'INCORRECT_LOCAL_AUTHORITY',
    text: 'Incorrect local authority',
  },
  { value: 'NO_CONSENT', text: 'Person no longer consents' },
  { value: 'DISENGAGED', text: 'Person cannot be contacted or has disengaged' },
  {
    value: 'HOUSING_NEED_RESOLVED',
    text: 'Housing need resolved or person already accommodated',
  },
  { value: 'NOT_ELIGIBLE', text: 'Not eligible for Duty to Refer (not homeless or at risk)' },
  { value: 'OTHER', text: 'Other' },
]
