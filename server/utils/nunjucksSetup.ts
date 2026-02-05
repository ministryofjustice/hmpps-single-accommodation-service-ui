/* eslint-disable no-param-reassign */
/* istanbul ignore file */

import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'
import { formatDate } from './dates'
import uiPaths from '../paths/ui'
import { riskLevelStatusTag } from './riskLevel'

const NUNJUCKS_TEMPLATE_PATHS = [
  path.join(__dirname, '../../server/views'),
  'node_modules/govuk-frontend/dist/',
  'node_modules/@ministryofjustice/frontend/',
  'node_modules/@ministryofjustice/hmpps-probation-frontend-components/dist/assets/',
]

const addFilters = (env: nunjucks.Environment) => {
  env.addFilter('initialiseName', initialiseName)
  env.addFilter('date', formatDate)
}

const addGlobals = (env: nunjucks.Environment) => {
  env.addGlobal('paths', {
    ...uiPaths,
  })
  env.addGlobal('riskLevel', riskLevelStatusTag)
}

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Accommodation service'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(NUNJUCKS_TEMPLATE_PATHS, {
    autoescape: true,
    express: app,
  })

  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)

  addGlobals(njkEnv)

  addFilters(njkEnv)
}

export const nunjucksInline = () => {
  const njkEnv = nunjucks.configure(NUNJUCKS_TEMPLATE_PATHS, { autoescape: true })

  addGlobals(njkEnv)

  addFilters(njkEnv)

  return nunjucks
}
