# Environment for running the E2E test data setup and teardown

# URLs
AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk
DELIUS_URL=https://ndelius.test.probation.service.justice.gov.uk
OASYS_URL=https://t2.oasys.service.justice.gov.uk/eor/f?p=100:101
PRISON_API=https://prison-api-dev.prison.service.justice.gov.uk

# Credentials
HMPPS_AUTH_CLIENT_ID="k8s://hmpps-single-accommodation-service-ui-client-creds/CLIENT_CREDS_CLIENT_ID" # GH_SECRET:E2E
HMPPS_AUTH_CLIENT_SECRET="k8s://hmpps-single-accommodation-service-ui-client-creds/CLIENT_CREDS_CLIENT_SECRET" # GH_SECRET:E2E
DELIUS_USERNAME="op://CAS/SAS USER PP/username" # GH_SECRET:E2E
DELIUS_PASSWORD="op://CAS/SAS USER PP/password" # GH_SECRET:E2E
OASYS_USERNAME_BOOKING="op://CAS/SAS USER PP OASys/username" # GH_SECRET:E2E
OASYS_PASSWORD_BOOKING="op://CAS/SAS USER PP OASys/password" # GH_SECRET:E2E
DPS_USERNAME="op://CAS/SAS USER DPS/username" # GH_SECRET:E2E
