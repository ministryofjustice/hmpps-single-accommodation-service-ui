import { Request } from 'express'
import { AuditRecordDto, CaseDto, DtrServiceResult, DtrSubmissionDto, DutyToReferDto, FieldChange } from '@sas/api'
import { SummaryListRow, TimelineEntry } from '@govuk/ui'
import { Link, StatusCard } from '@sas/ui'
import { formatDateAndDaysAgo, isoDateToDateInput, formatDateAndAge, dateFieldParts } from './dates'
import uiPaths from '../paths/ui'
import {
  validateAndFlashErrors,
  validateDateField,
  validateRadioButton,
  validateMandatoryText,
  validateMaxLength,
} from './validation'
import { renderMacro, statusTag } from './macros'
import { summaryListRowHtml, summaryListRowOptional, summaryListRowText } from './utils'
import { noteTimelineEntry, timelineEntry } from './timeline'
import { serviceStatusTag } from './statusTag'

const REFERENCE_REMOVED_LABEL = 'Reference removed'
const NOTE_REMOVED_LABEL = 'Note removed'

export const submissionFormValues = (dtr: DutyToReferDto | undefined): Record<string, string> => {
  if (!dtr) return {}

  return {
    ...isoDateToDateInput(dtr.submission?.submissionDate, 'submissionDate'),
    localAuthorityAreaId: dtr.submission?.localAuthority?.localAuthorityAreaId,
    referenceNumber: dtr.submission?.referenceNumber,
    submissionNote: dtr.submission?.submissionNote,
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

export const linksForStatus = (dtr?: DtrServiceResult, crn?: string): Link[] => {
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

  if (dutyToRefer?.status === 'SUBMITTED' || dutyToRefer?.status === 'WITHDRAWN') {
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
  rows.push(summaryListRowOptional('Note', dutyToRefer.submission.submissionNote, 'No note added'))
  return rows
}

export const outcomeDetailsSummaryListRows = (dutyToRefer: DutyToReferDto = undefined) => {
  if (dutyToRefer?.status === 'SUBMITTED' || dutyToRefer?.status === 'WITHDRAWN') {
    return []
  }

  return [
    summaryListRowHtml(
      'Status',
      `${statusTag(serviceStatusTag(dutyToRefer.status, true))} <p class="govuk-!-margin-top-4">${outcomeSupportText(dutyToRefer)}</p>`,
    ),
    summaryListRowText('Reason', outcomeReasonSummaryLabels[dutyToRefer.submission.outcomeReason]),
    summaryListRowOptional('Note', dutyToRefer.submission.outcomeNote, 'No note added'),
  ]
}

export const outcomeSupportText = (dutyToRefer: DutyToReferDto): string =>
  dutyToRefer.status === 'NOT_ACCEPTED'
    ? `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} will not support this person with housing`
    : `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} agreed to support this person with housing`

export const detailsForStatus = (dtr?: DtrServiceResult): SummaryListRow[] => {
  const status = dtr?.serviceResult?.serviceStatus
  const submission = dtr?.submission

  switch (status) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
    case 'SUBMITTED':
      return [
        summaryListRowText('Submitted to', submission?.localAuthority?.localAuthorityAreaName),
        summaryListRowOptional('Reference', submission?.referenceNumber, 'No reference added'),
        summaryListRowText('Submitted', formatDateAndDaysAgo(submission?.submissionDate)),
        summaryListRowText('Submitted by', submission?.createdBy),
      ]
    case 'NOT_ELIGIBLE':
    case 'NOT_STARTED':
    default:
      return []
  }
}

export const validateSubmission = (req: Request) => {
  const { localAuthorityAreaId, referenceNumber } = req.body
  const submissionDateParts = dateFieldParts(req.body, 'submissionDate')
  const errors: Record<string, string> = {
    submissionDate: validateDateField(submissionDateParts, 'Submission date'),
    localAuthorityAreaId: validateMandatoryText(localAuthorityAreaId, 'local authority'),
    referenceNumber: validateMaxLength(referenceNumber, 'Reference number', 255),
  }

  return validateAndFlashErrors(req, errors)
}

export const validateOutcome = (req: Request) => {
  const { outcomeReason } = req.body
  const errors: Record<string, string> = {
    outcomeReason: validateRadioButton(outcomeReason, 'Duty to Refer (DTR) outcome'),
  }

  return validateAndFlashErrors(req, errors)
}

export const validateWithdraw = (req: Request) => {
  const { withdrawalReason, withdrawalReasonOther } = req.body
  const errors: Record<string, string> = {
    withdrawalReason: validateRadioButton(withdrawalReason, 'withdrawal reason'),
  }

  if (withdrawalReason === 'OTHER') {
    errors.withdrawalReasonOther =
      validateMandatoryText(withdrawalReasonOther, 'other reason for withdrawal', '') ||
      validateMaxLength(withdrawalReasonOther, 'Other reason for withdrawal', 4000)
  }

  return validateAndFlashErrors(req, errors)
}

export const validateNote = (req: Request) => {
  const { note } = req.body
  const errors: Record<string, string> = {
    note: validateMandatoryText(note, 'note') || validateMaxLength(note, 'Notes', 4000),
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
    'submissionNote',
    'outcomeNote',
    'withdrawalReason',
    'withdrawalReasonOther',
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

type TimelineValue = { label: string; value: string; showLabel: boolean; isList?: boolean }
const submissionValues = (submission: Partial<DtrSubmissionDto>, isList: boolean): TimelineValue[] => [
  {
    label: 'Date submitted',
    value: submission.submissionDate ? formatDateAndDaysAgo(submission.submissionDate) : '',
    showLabel: true,
    isList,
  },
  { label: 'Local authority', value: submission.localAuthority?.localAuthorityAreaName, showLabel: true, isList },
  {
    label: 'Reference',
    value: submission.referenceNumber || (isList ? '' : 'No reference added'),
    showLabel: submission.referenceNumber !== REFERENCE_REMOVED_LABEL,
    isList,
  },
  {
    label: 'Note',
    value: submission.submissionNote || (isList ? '' : 'No note added'),
    showLabel: submission.submissionNote !== NOTE_REMOVED_LABEL,
    isList,
  },
]

const outcomeValues = (
  submission: Partial<DtrSubmissionDto>,
  outcomeText: string | undefined,
  isList: boolean,
): TimelineValue[] => [
  { label: 'Outcome', value: outcomeText, showLabel: false, isList: false },
  { label: 'Reason', value: outcomeReasonSummaryLabels[submission.outcomeReason], showLabel: true, isList },
  {
    label: 'Note',
    value: submission.outcomeNote || (isList ? '' : 'No note added'),
    showLabel: submission.outcomeNote !== NOTE_REMOVED_LABEL,
    isList,
  },
]

export const dutyToReferTimelineEntry = (auditRecord: AuditRecordDto): TimelineEntry => {
  const { type } = auditRecord

  if (type === 'NOTE') return noteTimelineEntry(auditRecord)

  const dtr = auditRecordChangesToDutyToRefer(auditRecord)
  const { status, submission } = dtr
  const isOutcome = submission.outcomeReason !== undefined || submission.outcomeNote !== undefined
  const statusChange = auditRecord.changes.find(change => change.field === 'status')
  const localAuthorityName = submission.localAuthority?.localAuthorityAreaName
  const outcomeText = isOutcome && localAuthorityName ? outcomeSupportText(dtr as DutyToReferDto) : undefined

  let label: string
  let values: TimelineValue[]

  if (type === 'CREATE') {
    label = 'Submission details added'
    values = submissionValues(submission, false)
  } else if (status === 'WITHDRAWN') {
    label = 'Referral withdrawn'
    values = [
      { label: 'Reason', value: withdrawReasonLabels[submission.withdrawalReason], showLabel: true, isList: false },
    ]
  } else if (isOutcome && statusChange?.oldValue === 'SUBMITTED') {
    label = 'Outcome details added'
    values = outcomeValues(submission, outcomeText, false)
  } else if (isOutcome) {
    label = 'Outcome details changed'
    const hasStatusChanged = statusChange?.oldValue !== statusChange?.value
    const outcomeNoteChange = auditRecord.changes.find(change => change.field === 'outcomeNote')
    const outcomeNote = outcomeNoteChange && (outcomeNoteChange.value || NOTE_REMOVED_LABEL)
    values = outcomeValues({ ...submission, outcomeNote }, hasStatusChanged ? outcomeText : '', true)
  } else {
    label = 'Submission details changed'
    const localAuthority =
      auditRecord.changes.some(change => change.field === 'localAuthorityAreaId') && submission.localAuthority
    const referenceChange = auditRecord.changes.find(change => change.field === 'referenceNumber')
    const referenceNumber = referenceChange && (referenceChange.value || REFERENCE_REMOVED_LABEL)
    const submissionNoteChange = auditRecord.changes.find(change => change.field === 'submissionNote')
    const submissionNote = submissionNoteChange && (submissionNoteChange.value || NOTE_REMOVED_LABEL)
    values = submissionValues(
      {
        ...submission,
        localAuthority: localAuthority || undefined,
        referenceNumber,
        submissionNote,
      },
      true,
    )
  }

  const html = renderMacro('timelineDutyToRefer', {
    type,
    status: status ? serviceStatusTag(status, true) : undefined,
    values,
    hasListItems: values.some(item => item.isList && item.value),
  })

  return timelineEntry(label, html, auditRecord.commitDate, auditRecord.author)
}

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

export const outcomeReasonLabels: Record<DtrSubmissionDto['outcomeReason'], string> = {
  PREVENTION_AND_RELIEF_DUTY: 'Yes, it was accepted on prevention and relief duty',
  PRIORITY_NEED: 'Yes, it was accepted on a priority need',
  NO_LOCAL_CONNECTION: "No, it was rejected as there's no local connection",
  INTENTIONALLY_HOMELESS: "No, it was rejected as they're considered intentionally homeless",
  REJECTED_FOR_ANOTHER_REASON: 'No, it was rejected for another reason',
}

export const outcomeReasonSummaryLabels: Record<DtrSubmissionDto['outcomeReason'], string> = {
  PREVENTION_AND_RELIEF_DUTY: 'Prevention and relief duty',
  PRIORITY_NEED: 'Priority need',
  NO_LOCAL_CONNECTION: 'No local connection',
  INTENTIONALLY_HOMELESS: 'Intentionally homeless',
  REJECTED_FOR_ANOTHER_REASON: 'Other reason',
}

export const withdrawReasonLabels: Record<DtrSubmissionDto['withdrawalReason'], string> = {
  NEW_REFERRAL: 'Replaced by a new referral',
  INCORRECT_LOCAL_AUTHORITY: 'Incorrect local authority',
  NO_CONSENT: 'Person no longer consents',
  DISENGAGED: 'Person cannot be contacted or has disengaged',
  HOUSING_NEED_RESOLVED: 'Housing need resolved or person already accommodated',
  NOT_ELIGIBLE: 'Not eligible for Duty to Refer (not homeless or at risk)',
  OTHER: 'Other',
}
