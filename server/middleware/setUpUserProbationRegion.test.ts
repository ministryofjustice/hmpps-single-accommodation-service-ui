import express, { Express } from 'express'
import session from 'express-session'
import request from 'supertest'
import setUpUserProbationRegion from './setUpUserProbationRegion'
import UserService from '../services/userService'
import { getRequestContext } from '../utils/requestContext'

jest.mock('../services/userService')
jest.mock('../../logger')

describe('setUpUserProbationRegion', () => {
  const userService = new UserService(null) as jest.Mocked<UserService>
  let currentUser: { username: string; token: string } | undefined

  const buildApp = (): Express => {
    const app = express()
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true }))
    app.use((req, res, next) => {
      res.locals.user = currentUser as never
      next()
    })
    app.use(setUpUserProbationRegion(userService))
    app.get('/', async (req, res) => {
      await new Promise(resolve => {
        setTimeout(resolve, 1)
      })
      res.json({ probationRegion: getRequestContext()?.probationRegion ?? null })
    })
    return app
  }

  beforeEach(() => {
    jest.resetAllMocks()
    currentUser = { username: 'user1', token: 'token-1' }
  })

  it('retrieves the probation region and makes it available to the rest of the request', async () => {
    userService.getProbationRegion.mockResolvedValue('N07')

    const response = await request(buildApp()).get('/')

    expect(userService.getProbationRegion).toHaveBeenCalledWith('token-1')
    expect(response.body).toEqual({ probationRegion: 'N07' })
  })

  it('stores the probation region in the session and does not request it again', async () => {
    userService.getProbationRegion.mockResolvedValue('N07')
    const agent = request.agent(buildApp())

    await agent.get('/')
    const response = await agent.get('/')

    expect(userService.getProbationRegion).toHaveBeenCalledTimes(1)
    expect(response.body).toEqual({ probationRegion: 'N07' })
  })

  it('requests the probation region again if the session belongs to a different user', async () => {
    userService.getProbationRegion.mockResolvedValueOnce('N07').mockResolvedValueOnce('N03')
    const agent = request.agent(buildApp())

    await agent.get('/')
    currentUser = { username: 'user2', token: 'token-2' }
    const response = await agent.get('/')

    expect(userService.getProbationRegion).toHaveBeenLastCalledWith('token-2')
    expect(response.body).toEqual({ probationRegion: 'N03' })
  })

  it('does not share the probation region between users', async () => {
    userService.getProbationRegion.mockImplementation(async token => (token === 'token-1' ? 'N07' : 'N03'))
    const app = buildApp()

    const response1 = await request(app).get('/')
    currentUser = { username: 'user2', token: 'token-2' }
    const response2 = await request(app).get('/')

    expect(response1.body).toEqual({ probationRegion: 'N07' })
    expect(response2.body).toEqual({ probationRegion: 'N03' })
  })

  it('continues without a probation region if the user has none', async () => {
    userService.getProbationRegion.mockResolvedValue(null)
    const agent = request.agent(buildApp())

    await agent.get('/')
    const response = await agent.get('/')

    expect(userService.getProbationRegion).toHaveBeenCalledTimes(1)
    expect(response.body).toEqual({ probationRegion: null })
  })

  it('continues without a probation region and retries later if the request fails', async () => {
    userService.getProbationRegion.mockRejectedValueOnce(new Error('API error')).mockResolvedValueOnce('N07')
    const agent = request.agent(buildApp())

    const response1 = await agent.get('/')
    const response2 = await agent.get('/')

    expect(response1.status).toEqual(200)
    expect(response1.body).toEqual({ probationRegion: null })
    expect(response2.body).toEqual({ probationRegion: 'N07' })
  })

  it('does nothing if there is no user', async () => {
    currentUser = undefined

    const response = await request(buildApp()).get('/')

    expect(userService.getProbationRegion).not.toHaveBeenCalled()
    expect(response.body).toEqual({ probationRegion: null })
  })
})
