import {
  initialiseTelemetry,
  flushTelemetry,
  telemetry,
  ModifiableSpan,
} from '@ministryofjustice/hmpps-azure-telemetry'
import { SpanFilterFn, SpanInfo } from '@ministryofjustice/hmpps-azure-telemetry/src/main'
import { context } from '@opentelemetry/api'
import { SentryContextManager } from '@sentry/node'
import applicationInfoSupplier from '../applicationInfo'

// Must be registered before initialiseTelemetry: OTel only honours the first global
// context manager, and the telemetry library registers a plain AsyncLocalStorageContextManager
// during provider.register(). SentryContextManager extends that same class, so AppInsights
// context propagation is unchanged, but Sentry's per-request isolation scopes survive.
const contextManager = new SentryContextManager()
contextManager.enable()
context.setGlobalContextManager(contextManager)

const applicationInfo = applicationInfoSupplier()

const filterSentry: SpanFilterFn = (span: SpanInfo) => !span.attributes['sentry.op']
const stripHttpRouteAny = (span: ModifiableSpan) => {
  const route = span.attributes?.['http.route']

  if (route) {
    span.setAttribute('http.route', String(route).replace('/{*any}', ''))
  }
}

initialiseTelemetry({
  serviceName: applicationInfo.applicationName,
  serviceVersion: process.env.BUILD_NUMBER || 'unknown',
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(filterSentry)
  .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico']))
  .addModifier(stripHttpRouteAny)
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

const shutdown = async () => {
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())
