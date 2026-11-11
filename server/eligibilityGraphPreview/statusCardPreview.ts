import { CaseAction, ServiceResult } from '@sas/api'
import { StatusCard } from '@sas/ui'
import { cas1StatusCard, cas2StatusCard, cas3StatusCard } from '../utils/eligibility'
import { dutyToReferStatusCard } from '../utils/dutyToRefer'
import { crsStatusCard } from '../utils/crs'
import { statusCard, statusTag } from '../utils/macros'
import { serviceStatusTag } from '../utils/statusTag'
import { actionsMap, renderActions } from '../utils/actions'
import { exampleApplications, exampleDate } from './fixtures'

type Service = CaseAction['service']

export type GraphStatus = {
  service: Service
  text: string
  upcoming?: boolean
  actionType?: CaseAction['type'] | null
}

export type GraphOutcome = {
  status: string
  failureReasons?: ServiceResult['failureReasons']
  blockingReason?: ServiceResult['blockingStatusReason']
}

export type GraphStatuses = Record<string, GraphStatus>

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })

const metadata = (outcome: GraphOutcome, statuses: GraphStatuses): GraphStatus => {
  const meta = Object.hasOwn(statuses, outcome.status) ? statuses[outcome.status] : undefined
  if (!meta) throw new Error(`Unknown graph status: ${outcome.status}`)
  if (!outcome.status.startsWith(`${meta.service}_`)) {
    throw new Error(`Graph status ${outcome.status} does not match service ${meta.service}`)
  }
  return meta
}

const isServiceStatus = (status: string): status is ServiceResult['serviceStatus'] => {
  const tag = serviceStatusTag(status as ServiceResult['serviceStatus'])
  return status === 'UNKNOWN' || (typeof tag?.text === 'string' && tag.text !== 'Unknown')
}

export const graphServiceResult = (
  outcome: GraphOutcome,
  failureReasons: ServiceResult['failureReasons'],
  statuses: GraphStatuses,
): ServiceResult => {
  const meta = metadata(outcome, statuses)
  let status = outcome.status.slice(meta.service.length + 1)
  if (meta.upcoming) status = 'UPCOMING'
  else if (status.startsWith('CANNOT_START_YET_')) status = 'CANNOT_START_YET'
  else if (status.startsWith('NOT_STARTED_')) status = 'NOT_STARTED'
  else if (status === 'PLACEMENT_REQUEST_NOT_SUBMITTED') status = 'PLACEMENT_REQUEST_NOT_STARTED'
  if (!isServiceStatus(status)) throw new Error(`Unsupported UI status: ${outcome.status}`)
  const reasons = [...new Set([...(outcome.failureReasons ?? []), ...(failureReasons ?? [])])]
  return {
    serviceStatus: status,
    failureReasons: reasons,
    blockingStatusReason: outcome.blockingReason,
    url: '#',
    action: meta.actionType
      ? {
          type: meta.actionType,
          service: meta.service,
          startDate: meta.upcoming ? exampleDate(14) : undefined,
        }
      : undefined,
  }
}

export const previewCard = (
  outcome: GraphOutcome,
  failureReasons: ServiceResult['failureReasons'],
  statuses: GraphStatuses,
): StatusCard | undefined => {
  const meta = metadata(outcome, statuses)
  const serviceResult = graphServiceResult(outcome, failureReasons, statuses)
  const examples = exampleApplications(serviceResult.serviceStatus)
  switch (meta.service) {
    case 'CAS1':
      return cas1StatusCard({ serviceResult, cas1Application: examples.cas1 })
    case 'CAS2':
      return cas2StatusCard({ serviceResult, cas2Application: examples.cas2 }, 'PREVIEW')
    case 'CAS3':
      return cas3StatusCard({ serviceResult, cas3Application: examples.cas3 })
    case 'DTR':
      return dutyToReferStatusCard('PREVIEW', { serviceResult, submission: examples.submission })
    case 'CRS':
      return crsStatusCard({
        serviceResult,
        commissionedRehabilitativeServices:
          serviceResult.serviceStatus === 'SUBMITTED' ? { status: 'LIVE', submissionDate: exampleDate(-2) } : undefined,
      })
    default:
      throw new Error(`No eligibility card for service: ${meta.service}`)
  }
}

export const statusCardPreview = (
  outcome: GraphOutcome,
  failureReasons: ServiceResult['failureReasons'],
  statuses: GraphStatuses,
): string => {
  const meta = metadata(outcome, statuses)
  if (meta.service === 'PA') {
    return `<p>Proposed address: <b>${escape(meta.text)}</b>. The UI has no corresponding eligibility card.</p>`
  }
  const card = previewCard(outcome, failureReasons, statuses)
  if (!card) return '<p class="muted">The UI hides this card for this outcome.</p>'
  // Keep the real macro, but prevent preview links from navigating or opening tabs.
  const html = statusCard(card).replace(/<a\b[^>]*>/g, tag =>
    tag
      .replace(/\s(?:href|target|rel)="[^"]*"/g, '')
      .replace('<a', '<a role="link" aria-disabled="true" title="Example link only"'),
  )
  return `<div class="status-card-preview" data-preview-status="${escape(outcome.status)}">
<p class="preview-example-note">Preview: application details are examples.</p>${html}</div>`
}

export const statusCardTag = (outcome: GraphOutcome, statuses: GraphStatuses): string => {
  const meta = metadata(outcome, statuses)
  if (meta.service === 'PA') return escape(meta.text)
  return statusTag(serviceStatusTag(graphServiceResult(outcome, [], statuses).serviceStatus))
}

export const statusActionPreview = (outcome: GraphOutcome, statuses: GraphStatuses): string => {
  const meta = metadata(outcome, statuses)
  if (!meta.actionType) return '<p class="card-action"><b>Action:</b> None</p>'
  if (!Object.hasOwn(actionsMap, meta.actionType)) throw new Error(`Missing UI action label: ${meta.actionType}`)
  const actions = renderActions([
    { type: meta.actionType, service: meta.service, startDate: meta.upcoming ? exampleDate(14) : undefined },
  ])
  return `<p class="card-action"><b>Action:</b> ${actions.join('')}</p>`
}
