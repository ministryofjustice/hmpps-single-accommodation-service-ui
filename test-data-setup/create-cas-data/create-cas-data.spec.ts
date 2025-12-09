import { test } from '@playwright/test'

test('Create CAS Data', async ({ page }) => {
  console.log('Creating CAS data...') // eslint-disable-line
  if (process.env.CREATE_CAS3_APPLICATION === 'true') {
    console.log('Creating CAS3 Application...') // eslint-disable-line
    await page.goto(process.env.CAS3_TRANSITIONAL_ACCOMMODATION_URL)
    console.log(`successfully visited: ${process.env.CAS3_TRANSITIONAL_ACCOMMODATION_URL}`) // eslint-disable-line
    if (process.env.CREATE_CAS3_REFERRAL === 'true') {
      console.log('Creating CAS3 Referral...') // eslint-disable-line
    }
  } else {
    console.log('No checkbox selected, please check a checkbox and re-run the workflow') // eslint-disable-line
  }
})
