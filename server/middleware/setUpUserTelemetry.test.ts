import { context, propagation, trace } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import express from 'express'
import session from 'express-session'
import request from 'supertest'
import UserService from '../services/userService'
import setUpUserTelemetry from './setUpUserTelemetry'
import { user } from '../routes/testutils/appSetup'
import logger from '../../logger'

jest.mock('../services/userService')
jest.mock('../../logger')

describe('setUpUserTelemetry', () => {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] })
  const userService = new UserService(null) as jest.Mocked<UserService>
  const tracer = provider.getTracer('user-telemetry-test')
  let currentUser = { ...user }
  let profileLookupBaggage: string

  const app = express()
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }))
  app.use((_req, res, next) => {
    const span = tracer.startSpan('UI request')
    res.on('finish', () => span.end())
    res.locals.user = currentUser
    const browserBaggage = propagation.createBaggage({
      requestIdentifier: { value: 'Untrusted' },
      arbitrary: { value: 'Discard me' },
    })
    context.with(propagation.setBaggage(trace.setSpan(context.active(), span), browserBaggage), next)
  })
  app.use(setUpUserTelemetry(userService))
  app.get('/', async (_req, res) => {
    // Cross an async boundary to exercise request-local context.
    await new Promise(resolve => {
      setImmediate(resolve)
    })
    res.json({
      probationAreaCode: propagation.getBaggage(context.active())?.getEntry('requestIdentifier')?.value,
      arbitrary: propagation.getBaggage(context.active())?.getEntry('arbitrary')?.value,
    })
  })

  beforeAll(() => {
    provider.register()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    exporter.reset()
    currentUser = { ...user }
    profileLookupBaggage = undefined
    userService.getProbationAreaCode.mockImplementation(async () => {
      profileLookupBaggage = propagation.getBaggage(context.active())?.getEntry('requestIdentifier')?.value
      return 'London'
    })
  })

  afterAll(async () => {
    await provider.shutdown()
    context.disable()
    trace.disable()
    propagation.disable()
  })

  it('sets the request attribute and trusted baggage, clearing browser-supplied baggage', async () => {
    const response = await request(app).get('/').expect(200)

    expect(response.body).toEqual({ probationAreaCode: 'London' })
    expect(profileLookupBaggage).toBeUndefined()
    expect(userService.getProbationAreaCode).toHaveBeenCalledWith(user.token)
    expect(exporter.getFinishedSpans()[0].attributes).toMatchObject({ requestIdentifier: 'London' })
    expect(propagation.getBaggage(context.active())).toBeUndefined()
  })

  it('caches the area across requests in the same session', async () => {
    const agent = request.agent(app)

    await agent.get('/').expect(200)
    userService.getProbationAreaCode.mockResolvedValue('Wales')
    const response = await agent.get('/').expect(200)

    expect(response.body).toEqual({ probationAreaCode: 'London' })
    expect(userService.getProbationAreaCode).toHaveBeenCalledTimes(1)
  })

  it('fetches again for a new session', async () => {
    await request(app).get('/').expect(200)
    await request(app).get('/').expect(200)

    expect(userService.getProbationAreaCode).toHaveBeenCalledTimes(2)
  })

  it.each(['username', 'authSource'] as const)('invalidates the cache when %s changes', async field => {
    const agent = request.agent(app)
    await agent.get('/').expect(200)
    currentUser = field === 'username' ? { ...user, username: 'another-user' } : { ...user, authSource: 'delius' }
    userService.getProbationAreaCode.mockResolvedValue('Wales')

    const response = await agent.get('/').expect(200)

    expect(response.body).toEqual({ probationAreaCode: 'Wales' })
    expect(userService.getProbationAreaCode).toHaveBeenCalledTimes(2)
  })

  it('logs lookup failures, continues without baggage and retries on the next request', async () => {
    const agent = request.agent(app)
    const error = new Error('API unavailable')
    userService.getProbationAreaCode.mockRejectedValueOnce(error)

    const response = await agent.get('/').expect(200)

    expect(response.body).toEqual({})
    expect(exporter.getFinishedSpans()[0].attributes.requestIdentifier).toBeUndefined()
    expect(logger.warn).toHaveBeenCalledWith(error, expect.stringContaining('will retry'))
    await agent.get('/').expect(200)
    expect(userService.getProbationAreaCode).toHaveBeenCalledTimes(2)
  })

  it("does not reuse another identity's cached area when the new lookup fails", async () => {
    const agent = request.agent(app)
    await agent.get('/').expect(200)
    currentUser = { ...user, username: 'another-user' }
    userService.getProbationAreaCode.mockRejectedValueOnce(new Error('API unavailable'))

    const response = await agent.get('/').expect(200)

    expect(response.body).toEqual({})
  })

  it('isolates baggage between concurrent sessions', async () => {
    userService.getProbationAreaCode
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve('London'), 20)
          }),
      )
      .mockResolvedValueOnce('Wales')

    const responses = await Promise.all([request(app).get('/'), request(app).get('/')])

    expect(responses.map(response => response.body.probationAreaCode).sort()).toEqual(['London', 'Wales'])
    expect(
      exporter
        .getFinishedSpans()
        .map(span => span.attributes.requestIdentifier)
        .sort(),
    ).toEqual(['London', 'Wales'])
  })
})
