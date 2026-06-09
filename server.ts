// Require Sentry and App Insights setup before anything else to allow for instrumentation of bunyan and express
import './server/sentryInstrumentation'
import 'applicationinsights'

import app from './server/index'
import logger from './logger'

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)
})
