/* eslint-disable no-param-reassign */
/* istanbul ignore file */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { convertObjectsToSelectOptions, dateFieldValues, initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'
import { formatDate, mojDateOrBlank } from './dates'
import uiPaths from '../paths/ui'
import { riskLevelStatusTag } from './riskLevel'
import { injectConditionals } from './form'

const NUNJUCKS_TEMPLATE_PATHS = [
  path.join(__dirname, '../../server/views'),
  'node_modules/govuk-frontend/dist/',
  'node_modules/@ministryofjustice/frontend/',
  'node_modules/@ministryofjustice/hmpps-probation-frontend-components/dist/assets/',
]

const addFilters = (env: nunjucks.Environment) => {
  env.addFilter('initialiseName', initialiseName)
  env.addFilter('date', formatDate)
  env.addFilter('mojDate', mojDateOrBlank)
}

const addGlobals = (env: nunjucks.Environment) => {
  env.addGlobal('paths', {
    ...uiPaths,
  })
  env.addGlobal('riskLevel', riskLevelStatusTag)
  env.addGlobal('injectConditionals', injectConditionals)
  env.addGlobal('dateFieldValues', dateFieldValues)

  env.addGlobal('featureFlags', config.flags)
}

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Accommodation'
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

  njkEnv.addGlobal(
    'convertObjectsToSelectOptions',
    function sendContextConvertObjectsToSelectOptions(
      items: Array<Record<string, string>>,
      prompt: string,
      textKey: string,
      valueKey: string,
      selectedValue?: string,
    ) {
      return convertObjectsToSelectOptions(items, prompt, textKey, valueKey, selectedValue)
    },
  )

  addGlobals(njkEnv)

  addFilters(njkEnv)
}

export const nunjucksInline = () => {
  const njkEnv = nunjucks.configure(NUNJUCKS_TEMPLATE_PATHS, { autoescape: true })

  addGlobals(njkEnv)

  addFilters(njkEnv)

  return nunjucks
}
