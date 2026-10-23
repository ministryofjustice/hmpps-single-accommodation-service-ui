import { context, propagation, trace, ROOT_CONTEXT } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ClientRequest, IncomingMessage } from 'http'
import { createProbationAreaCodeRequestHook } from './probationAreaTelemetry'

describe('probation area HTTP request hook', () => {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] })
  const tracer = provider.getTracer('request-hook-test')
  const hook = createProbationAreaCodeRequestHook('https://sas-api.example')

  beforeAll(() => {
    provider.register()
  })

  beforeEach(() => {
    exporter.reset()
  })

  afterAll(async () => {
    await provider.shutdown()
    context.disable()
    trace.disable()
    propagation.disable()
  })

  const outgoingRequest = (protocol: string, host: string) => {
    const req = Object.create(ClientRequest.prototype) as ClientRequest
    req.protocol = protocol
    req.getHeader = jest.fn().mockReturnValue(host)
    req.removeHeader = jest.fn()
    return req
  }

  it.each([
    ['https:', 'sas-api.example', false],
    ['https:', 'external.example', true],
    ['http:', 'sas-api.example', true],
    ['https:', 'sas-api.example:8443', true],
    ['https:', 'sas-api.example.attacker.example', true],
  ])('restricts propagation for %s//%s', (protocol, host, shouldRemove) => {
    const span = tracer.startSpan('dependency')
    const req = outgoingRequest(protocol, host)
    const baggage = propagation.createBaggage({ requestIdentifier: { value: 'London' } })

    context.with(propagation.setBaggage(ROOT_CONTEXT, baggage), () => hook(span, req))
    span.end()

    expect(exporter.getFinishedSpans()[0].attributes).toEqual({ requestIdentifier: 'London' })
    if (shouldRemove) {
      expect(req.removeHeader).toHaveBeenCalledWith('baggage')
    } else {
      expect(req.removeHeader).not.toHaveBeenCalled()
    }
  })

  it('supports a configured non-default API port', () => {
    const req = outgoingRequest('http:', 'localhost:8080')
    const span = tracer.startSpan('dependency')

    createProbationAreaCodeRequestHook('http://localhost:8080')(span, req)
    span.end()

    expect(req.removeHeader).not.toHaveBeenCalled()
    expect(exporter.getFinishedSpans()[0].attributes).toEqual({})
  })

  it('does not tag incoming requests using untrusted baggage', () => {
    const span = tracer.startSpan('incoming')
    const req = Object.create(IncomingMessage.prototype) as IncomingMessage
    const baggage = propagation.createBaggage({ requestIdentifier: { value: 'Untrusted' } })

    context.with(propagation.setBaggage(ROOT_CONTEXT, baggage), () => hook(span, req))
    span.end()

    expect(exporter.getFinishedSpans()[0].attributes).toEqual({})
  })
})
