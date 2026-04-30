import { Request } from 'express'
import { AuditRecordDto, CaseDto, DtrServiceResult, DtrSubmissionDto, DutyToReferDto, FieldChange } from '@sas/api'
import { SummaryListRow, TimelineEntry } from '@govuk/ui'
import { StatusCard, StatusTag } from '@sas/ui'
import { formatDateAndDaysAgo, dateInputToIsoDate, formatDateAndAge } from './dates'
import uiPaths from '../paths/ui'
import { validateAndFlashErrors } from './validation'
import { renderMacro, statusTag } from './macros'
import { summaryListRowHtml, summaryListRowOptional, summaryListRowText } from './utils'
import { noteTimelineEntry, timelineEntry } from './timeline'

const dutyToReferStatusTag = (status?: DutyToReferDto['status']): StatusTag =>
  ({
    NOT_ACCEPTED: { text: 'Not accepted', colour: 'grey' },
    ACCEPTED: { text: 'Accepted', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'orange' },
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
  })[status] || { text: 'Unknown' }

export const dtrServiceResultToDutyToRefer = (crn: string, dtr: DtrServiceResult): DutyToReferDto => ({
  crn,
  caseId: dtr.caseId,
  status: dtr.serviceResult.serviceStatus as DutyToReferDto['status'],
  submission: dtr.submission,
})

export const dutyToReferToDtrServiceResult = (dtr: DutyToReferDto): DtrServiceResult => ({
  caseId: dtr.caseId,
  serviceResult: { serviceStatus: dtr.status },
  submission: dtr.submission,
})

export const dutyToReferStatusCard = (dutyToRefer?: DutyToReferDto): StatusCard => {
  const { status } = dutyToRefer || {}

  return {
    heading: 'Duty to Refer (DTR)',
    inactive: status === 'NOT_ACCEPTED',
    status: dutyToReferStatusTag(status),
    details: detailsForStatus(dutyToRefer),
    links: linksForStatus(dutyToRefer),
  }
}

export const linksForStatus = (dutyToRefer: DutyToReferDto) => {
  const { status, crn, submission } = dutyToRefer || {}

  const notes = submission?.id && {
    text: 'View referral and notes',
    href: uiPaths.dutyToRefer.show({ crn, id: submission.id }),
  }

  switch (status) {
    case 'NOT_ACCEPTED':
    case 'ACCEPTED':
      return [notes]
    case 'NOT_STARTED':
      return [{ text: 'Add submission details', href: uiPaths.dutyToRefer.guidance({ crn }) }]
    case 'SUBMITTED':
      return [{ text: 'Add outcome', href: uiPaths.dutyToRefer.outcome({ crn, id: submission?.id }) }, notes]
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
    rows.push(summaryListRowOptional('Reference', dutyToRefer.submission.referenceNumber, 'No reference added'))
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

export const outcomeSupportText = (dutyToRefer: DutyToReferDto): string =>
  dutyToRefer.status === 'NOT_ACCEPTED'
    ? `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} will not support this person with housing`
    : `${dutyToRefer.submission?.localAuthority?.localAuthorityAreaName} agreed to support this person with housing`

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
        summaryListRowOptional('Reference', dutyToRefer?.submission?.referenceNumber, 'No reference added'),
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

const auditRecordChangesToDutyToRefer = (auditRecord: AuditRecordDto): Partial<DutyToReferDto> => {
  const submissionFields = ['submissionDate', 'referenceNumber', 'localAuthority', 'id', 'createdBy', 'createdAt']
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
    status !== 'NOT_STARTED' && (submissionDate || localAuthorityName || referenceNumber)
      ? {
          'Date submitted': formatDateAndDaysAgo(submissionDate),
          'Local authority': localAuthorityName,
          Reference: referenceNumber,
        }
      : undefined

  const html = renderMacro('timelineDutyToRefer', {
    type,
    isOutcome,
    status: status ? dutyToReferStatusTag(status) : undefined,
    values: isOutcome ? { Outcome: outcomeText } : submissionValues,
  })

  return timelineEntry(label, html, auditRecord.commitDate, auditRecord.author)
}
