import * as Sentry from '@sentry/node'
import config from './config'
import './sentryInstrumentation'

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  expressIntegration: jest.fn().mockReturnValue({ name: 'Express' }),
  httpIntegration: jest.fn().mockReturnValue({ name: 'Http' }),
}))
jest.mock('./config', () => ({
  sentry: { dsn: 'https://public@example.com/1' },
  environment: 'prod',
}))
jest.mock('./applicationInfo', () => () => ({ gitRef: 'test-release' }))

describe('Sentry instrumentation', () => {
  it('leaves the OpenTelemetry provider and HTTP propagation to HMPPS telemetry', () => {
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        enableOpenTelemetrySetup: false,
        integrations: [{ name: 'Express' }, { name: 'Http' }],
      }),
    )
    expect(Sentry.httpIntegration).toHaveBeenCalledWith({ tracePropagation: false })
  })

  it('retains the privacy settings', () => {
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
          stackFrameVariables: false,
        },
      }),
    )
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: expect.any(String),
      username: expect.any(String),
    })
  })

  it.each([
    ['prod', 'GET /applications', 1],
    ['dev', 'GET /applications', 0.05],
    ['prod', 'GET /ping', 0],
    ['prod', 'GET /health', 0],
    ['prod', 'GET /assets/main.css', 0],
  ])('samples %s requests named %s at %s', (environment, name, rate) => {
    config.environment = environment
    const { tracesSampler } = jest.mocked(Sentry.init).mock.calls[0][0]

    expect(tracesSampler({ name, attributes: {}, inheritOrSampleWith: jest.fn() })).toBe(rate)
  })
})
