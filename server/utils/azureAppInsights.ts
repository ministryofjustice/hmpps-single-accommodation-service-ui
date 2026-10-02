import {
  initialiseTelemetry,
  flushTelemetry,
  telemetry,
  ModifiableSpan,
} from '@ministryofjustice/hmpps-azure-telemetry'
import { SpanFilterFn, SpanInfo } from '@ministryofjustice/hmpps-azure-telemetry/src/main'
import applicationInfoSupplier from '../applicationInfo'

// Sentry v11 reads isolation scopes from the context manager installed by initialiseTelemetry,
// so no manual context manager registration is needed.
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
