import { context, propagation, trace } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import express from 'express'
import { ClientRequest } from 'http'
import request from 'supertest'
import { createUserLocationCodeRequestHook } from '../utils/userLocationTelemetry'
import clearInboundBaggage from './clearInboundBaggage'

describe('clearInboundBaggage', () => {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] })
  const tracer = provider.getTracer('clear-inbound-baggage-test')
  const hook = createUserLocationCodeRequestHook('https://sas-api.example')
  const app = express()

  app.use((_req, _res, next) => {
    const inboundBaggage = propagation.createBaggage({ userLocationCode: { value: 'Forged' } })
    context.with(propagation.setBaggage(context.active(), inboundBaggage), next)
  })
  app.use(clearInboundBaggage())
  app.get('/health', (_req, res) => {
    const dependencySpan = tracer.startSpan('health check dependency')
    const outgoingRequest = Object.create(ClientRequest.prototype) as ClientRequest
    const headers: Record<string, string> = { host: 'sas-api.example' }
    outgoingRequest.protocol = 'https:'
    outgoingRequest.getHeader = jest.fn((name: string) => headers[name])
    outgoingRequest.setHeader = jest.fn((name: string, value: string | number | readonly string[]) => {
      headers[name] = String(value)
      return outgoingRequest
    })
    outgoingRequest.removeHeader = jest.fn()

    const userLocationCode = propagation.getBaggage(context.active())?.getEntry('userLocationCode')?.value
    if (userLocationCode) outgoingRequest.setHeader('baggage', `userLocationCode=${userLocationCode}`)
    hook(dependencySpan, outgoingRequest)
    dependencySpan.end()

    res.json({
      baggageHeader: headers.baggage,
      spanAttributes: exporter.getFinishedSpans()[0]?.attributes,
    })
  })

  beforeAll(() => {
    provider.register()
  })

  beforeEach(() => exporter.reset())

  afterAll(async () => {
    await provider.shutdown()
    context.disable()
    trace.disable()
    propagation.disable()
  })

  it('clears forged inbound baggage before a health-check dependency request', async () => {
    const response = await request(app).get('/health').expect(200)

    expect(response.body.baggageHeader).toBeUndefined()
    expect(response.body.spanAttributes).toEqual({})
  })
})
