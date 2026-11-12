import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { ServiceResult } from '@sas/api'
import { statusCard } from '../utils/macros'
import { exampleApplications, exampleDate } from './fixtures'
import { graphServiceResult, GraphStatuses, previewCard } from './statusCardPreview'

describe('generated status card preview', () => {
  let context: vm.Context
  let fragment: string
  const statuses: GraphStatuses = {}
  const scenarios = {
    CAS1: [
      'NOT_ELIGIBLE',
      'NOT_STARTED',
      'NOT_SUBMITTED',
      'SUBMITTED',
      'INFO_REQUESTED',
      'APPLICATION_REJECTED',
      'PLACEMENT_BOOKED',
      'ARRIVED',
      'NOT_ARRIVED',
      'PLACEMENT_CANCELLED',
      'PLACEMENT_REQUEST_NOT_STARTED',
      'PLACEMENT_REQUEST_SUBMITTED',
      'PLACEMENT_REQUEST_REJECTED',
      'PLACEMENT_REQUEST_WITHDRAWN',
    ],
    CAS2: [
      'NOT_ELIGIBLE',
      'NOT_STARTED',
      'NOT_SUBMITTED',
      'MORE_INFORMATION_NEEDED',
      'SUBMITTED',
      'AWAITING_DECISION',
      'ON_WAITING_LIST',
      'PLACE_OFFERED',
      'OFFER_ACCEPTED',
      'AWAITING_ARRIVAL',
      'WITHDRAWN',
      'CANCELLED',
      'OFFER_DECLINED_OR_WITHDRAWN',
    ],
    CAS3: [
      'NOT_ELIGIBLE',
      'NOT_STARTED',
      'NOT_SUBMITTED',
      'CANNOT_START_YET',
      'SUBMITTED',
      'REJECTED',
      'BEDSPACE_OFFERED',
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'ARRIVED',
    ],
    DTR: ['NOT_REQUIRED', 'NOT_STARTED', 'SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'],
    CRS: ['NOT_REQUIRED', 'NOT_ELIGIBLE', 'NOT_STARTED', 'SUBMITTED'],
  } satisfies Partial<Record<GraphStatuses[string]['service'], string[]>>

  Object.entries(scenarios).forEach(([service, values]) => {
    values.forEach(status => {
      statuses[`${service}_${status}`] = { service: service as GraphStatuses[string]['service'], text: status }
    })
  })
  statuses.PA_UNKNOWN = { service: 'PA', text: '<Example address>' }
  statuses.CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED = { service: 'CAS1', text: 'Not submitted' }
  statuses.CAS2_NOT_STARTED_PRISON = { service: 'CAS2', text: 'Not started' }
  statuses.CAS3_UPCOMING = { service: 'CAS3', text: 'Upcoming', upcoming: true, actionType: 'START_CAS3_REFERRAL' }

  const call = (expression: string): string => vm.runInContext(expression, context)
  const disableLinks = (html: string): string =>
    html.replace(/<a\b[^>]*>/g, tag =>
      tag
        .replace(/\s(?:href|target|rel)="[^"]*"/g, '')
        .replace('<a', '<a role="link" aria-disabled="true" title="Example link only"'),
    )

  beforeAll(() => {
    execFileSync(process.execPath, ['script/status-card-preview/generate.js'], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SESSION_SECRET: 'preview-test-session-sentinel',
        AUTH_CODE_CLIENT_SECRET: 'preview-test-auth-sentinel',
      },
    })
    fragment = fs.readFileSync(path.resolve(__dirname, '../../dist/status-card-preview.html'), 'utf8')
  }, 30000)

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-10T12:00:00Z'))
    context = vm.createContext({ console, Date }, { codeGeneration: { strings: false, wasm: false } })
    context.window = context
    const script = fragment.match(/<script>([\s\S]*)<\/script>/)[1]
    vm.runInContext(script, context)
    // Match Kotlin's insertion order: the fragment loads before the graph's const data.
    vm.runInContext(`const data = ${JSON.stringify({ statuses })}`, context)
  })

  afterEach(() => jest.useRealTimers())

  it.each(Object.keys(statuses).filter(status => !status.startsWith('PA_')))('renders the real UI for %s', status => {
    const card = previewCard({ status }, [], statuses)
    const expected = disableLinks(statusCard(card))
    expect(call(`statusCardPreview({status: ${JSON.stringify(status)}})`)).toContain(expected)
  })

  it('is self-contained and does not embed server configuration', () => {
    expect(fragment).not.toMatch(/<script[^>]+src=|<link\b|url\(/i)
    expect(fragment).not.toContain('SESSION_SECRET')
    expect(fragment).not.toContain('AUTH_CODE_CLIENT_SECRET')
    expect(fragment).not.toContain('preview-test-session-sentinel')
    expect(fragment).not.toContain('preview-test-auth-sentinel')
    expect(fragment).not.toContain('node_modules/moment/')
    expect(fragment).not.toContain('typescript.js')
    expect(fragment).not.toContain('node:fs')
    expect(fragment).not.toContain('@ministryofjustice/frontend/moj/filters/all')
    expect(fragment).toContain('Compact third-party runtime: Nunjucks slim')
    expect(fragment).not.toContain('node_modules/nunjucks/browser/nunjucks.js')
    expect(fragment).toContain(':is(#panel .result, #panel .trace-update, .status-card-preview) .sas-card')
    expect(fragment).toContain(':is(#panel .result, #panel .trace-update, .status-card-preview) .govuk-heading-m')
  })

  it('keeps unused CSS and the template compiler out of the readable fragment', () => {
    const styles = fragment.match(/<style>([\s\S]*?)<\/style>/)[1]
    expect(Buffer.byteLength(styles)).toBeLessThan(55000)
    expect(Buffer.byteLength(fragment)).toBeLessThan(210000)
    expect(fragment.split('\n').length).toBeLessThan(3500)
    expect(styles).not.toContain('govuk-\\!-padding-top-9')
    expect(styles).toContain('govuk-\\!-margin-bottom-0')
    expect(styles).toContain('govuk-\\!-margin-bottom-1')
    expect(styles).toContain('govuk-\\!-font-size-16')
    expect(styles).toContain('govuk-tag--yellow')
    expect(styles).toContain('govuk-tag--green')
    expect(styles).toContain('govuk-tag--grey')
    expect(styles).toContain('govuk-tag--orange')
    expect(styles).toContain('govuk-details__summary')
    expect(styles).toContain('.govuk-link:focus')
  })

  it('keeps the generated source readable and does not override card wrapping', () => {
    const styles = fragment.match(/<style>([\s\S]*?)<\/style>/)[1]
    const cardLayoutRules = styles.match(/[^{}]*\.sas-card__(?:head|footer)[^{}]*\{[^}]*\}/g)
    expect(cardLayoutRules).toHaveLength(2)
    cardLayoutRules.forEach(rule => expect(rule).not.toContain('flex-wrap: wrap'))
    expect(styles).toMatch(/\.sas-card__head\s*\{\n/)
    expect(fragment).toContain('<article class="sas-card{{ cardClass }}">')
    const readable = fragment
      .replace(/var StatusCardPreviewDependencies=[^\n]*/g, '')
      .replace(/const statusCardPreviewTemplates=[^\n]*/g, '')
    expect(Math.max(...readable.split('\n').map(line => line.length))).toBeLessThan(500)
    expect(fragment).toContain('var cas1StatusCard = ({ serviceResult, cas1Application }) => {\n')
  })

  it('hides the CAS1 card when the accommodation failure reason applies', () => {
    expect(
      call(`statusCardPreview({status: 'CAS1_NOT_ELIGIBLE'}, ['NOT_IN_PRISON_OR_CAS1_ACCOMMODATION'])`),
    ).not.toContain('<article')
  })

  it('merges and deduplicates failure reasons', () => {
    const result = graphServiceResult(
      { status: 'CAS2_NOT_ELIGIBLE', failureReasons: ['UNDER_18'] },
      ['UNDER_18', 'INVALID_TIER'],
      statuses,
    )
    expect(result.failureReasons).toEqual(['UNDER_18', 'INVALID_TIER'])
    const html = call(
      `statusCardPreview({status: 'CAS2_NOT_ELIGIBLE', failureReasons: ['UNDER_18']}, ['UNDER_18','INVALID_TIER'])`,
    )
    expect(html).toContain('Age (applicant is under 18)')
    expect(html).toContain('Tier not eligible')
    expect(html.match(/Age \(applicant is under 18\)/g)).toHaveLength(1)
  })

  it.each<ServiceResult['blockingStatusReason']>([
    'SUBMIT_DTR_BEFORE_CAS3',
    'SUBMIT_CRS_BEFORE_CAS3',
    'SUBMIT_CRS_ACCOMMODATION_BEFORE_CAS3',
    'SUBMIT_DTR_AND_CRS_BEFORE_CAS3',
    'SUBMIT_DTR_AND_CRS_ACCOMMODATION_BEFORE_CAS3',
  ])('passes blocking reason %s to the real UI', blockingReason => {
    const outcome = { status: 'CAS3_CANNOT_START_YET', blockingReason }
    expect(call(`statusCardPreview(${JSON.stringify(outcome)}, [])`)).toContain(
      statusCard(previewCard(outcome, [], statuses)),
    )
  })

  it('normalises graph-only status variants', () => {
    expect(graphServiceResult({ status: 'CAS2_NOT_STARTED_PRISON' }, [], statuses).serviceStatus).toBe('NOT_STARTED')
    expect(graphServiceResult({ status: 'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED' }, [], statuses).serviceStatus).toBe(
      'PLACEMENT_REQUEST_NOT_STARTED',
    )
  })

  it('uses the real tag colours rather than graph approximations', () => {
    expect(call(`statusCardTag({status: 'CAS3_BEDSPACE_OFFERED'})`)).toContain('govuk-tag--orange')
  })

  it('generates consistent relative dates and uses UI action labels', () => {
    expect(exampleDate(14)).toBe('2026-11-24')
    expect(call(`statusCardPreview({status: 'CAS3_UPCOMING'}, [])`)).toContain(
      'Start referral from 24 November 2026 (in 14 days).',
    )
    expect(call(`statusActionPreview({status: 'CAS3_UPCOMING'})`)).toContain('Start a CAS3 referral')
    expect(call(`statusActionPreview({status: 'CAS3_UPCOMING'})`)).toContain('in 14 days')
    expect(call(`statusActionPreview({status: 'CRS_NOT_REQUIRED'})`)).toContain('None')
  })

  it('disables navigation while retaining example details', () => {
    const html = call(`statusCardPreview({status: 'CAS2_AWAITING_ARRIVAL'}, [])`)
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('govuk-link govuk-link--no-visited-state')
    expect(html).not.toMatch(/href=|target=/)
    expect(html).toContain('Example practitioner')
  })

  it('escapes graph text for services without a card', () => {
    expect(call(`statusCardPreview({status: 'PA_UNKNOWN'}, [])`)).toContain('&lt;Example address&gt;')
  })

  it('fails explicitly for unknown statuses, services and action labels', () => {
    expect(() => call(`statusCardPreview({status: 'CAS1_NEW_STATUS'}, [])`)).toThrow('Unknown graph status')
    call(`data.statuses.CAS1_NEW_STATUS = {service: 'CAS1', text: 'New'}`)
    expect(() => call(`statusCardPreview({status: 'CAS1_NEW_STATUS'}, [])`)).toThrow('Unsupported UI status')
    call(`data.statuses.CAS1_NOT_STARTED.actionType = 'UNKNOWN_ACTION'`)
    expect(() => call(`statusActionPreview({status: 'CAS1_NOT_STARTED'})`)).toThrow('Missing UI action label')
    call(`data.statuses.CAS1_constructor = {service: 'CAS1', text: 'Invalid'}`)
    expect(() => call(`statusCardPreview({status: 'CAS1_constructor'}, [])`)).toThrow('Unsupported UI status')
    expect(() => call(`statusCardPreview({status: 'constructor'}, [])`)).toThrow('Unknown graph status')
  })

  it('supplies stage-consistent example data without presentation rules', () => {
    const draft = exampleApplications('NOT_SUBMITTED')
    expect(draft.cas1.application.status).toBe('STARTED')
    expect(draft.cas1.application.submittedAt).toBeUndefined()
    expect(draft.cas1.assessment).toBeUndefined()
    expect(draft.cas1.placement).toBeUndefined()
    expect(draft.cas2.submittedApplication).toBeUndefined()
    expect(draft.cas3.applicationStatus).toBe('IN_PROGRESS')
    expect(draft.cas3.applicationSubmittedDate).toBeUndefined()
    const submitted = exampleApplications('SUBMITTED')
    expect(submitted.cas1.application.status).toBe('AWAITING_ASSESSMENT')
    expect(submitted.cas1.placement).toBeUndefined()
    expect(exampleApplications('INFO_REQUESTED').cas1.application.status).toBe('REQUESTED_FURTHER_INFORMATION')
    expect(exampleApplications('APPLICATION_REJECTED').cas1.assessment.decision).toBe('REJECTED')
    expect(exampleApplications('PLACEMENT_REQUEST_WITHDRAWN').cas1.requestForPlacement.status).toBe('REQUEST_WITHDRAWN')
    expect(exampleApplications('PLACEMENT_BOOKED').cas1.placement.actualArrivalDate).toBeUndefined()
    expect(exampleApplications('ARRIVED').cas1.placement.status).toBe('ARRIVED')
    expect(exampleApplications('MORE_INFORMATION_NEEDED').cas2.submittedApplication.latestAssessmentStatus).toBe(
      'MORE_INFO_REQUESTED',
    )
    expect(exampleApplications('BOOKING_CONFIRMED').cas3.bookingStatus).toBe('CONFIRMED')
    expect(exampleApplications('REJECTED').cas3.applicationStatus).toBe('REJECTED')
    expect(exampleApplications('NOT_STARTED').cas1).toBeUndefined()
    expect(exampleApplications('NOT_STARTED').cas2).toBeUndefined()
    expect(exampleApplications('NOT_STARTED').cas3).toBeUndefined()
    expect(exampleApplications('NOT_STARTED').submission).toBeUndefined()
  })
})
