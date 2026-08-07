# Environment for running the app

# App configuration
REDIS_ENABLED=false
TOKEN_VERIFICATION_ENABLED=false
LOG_LEVEL=debug

# Credentials for allowing user access
AUTH_CODE_CLIENT_ID='k8s://hmpps-single-accommodation-service-ui-auth-code/AUTH_CODE_CLIENT_ID'
AUTH_CODE_CLIENT_SECRET='k8s://hmpps-single-accommodation-service-ui-auth-code/AUTH_CODE_CLIENT_SECRET'

# Credentials for API calls
CLIENT_CREDS_CLIENT_ID=hmpps-typescript-template-system
CLIENT_CREDS_CLIENT_SECRET=clientsecret

# Credentials for OS Data Hub API calls for address lookup
OS_DATAHUB_API_KEY='k8s://hmpps-single-accommodation-service-ui/OS_DATAHUB_API_KEY'

# Uncomment the following to run the local app against the dev environment
#SAS_API_URL=https://single-accommodation-service-api-dev.hmpps.service.justice.gov.uk
#HMPPS_AUTH_URL='https://sign-in-dev.hmpps.service.justice.gov.uk/auth'
#SAS_ALLOWED_ROLES='ROLE_SINGLE_ACCOMMODATION_SERVICE_PROBATION_PRACTITIONER'
