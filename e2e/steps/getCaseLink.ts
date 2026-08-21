import { expect, Page } from '@playwright/test'
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  minutesToMilliseconds,
  secondsToMilliseconds,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time'
import { TestCase } from '@sas/e2e'
import { refreshUntil } from '../utils/refreshUntil'

// eslint-disable-next-line import/prefer-default-export
export const getCaseLink = async (page: Page, caseData: TestCase) => {
  const [forename, surname] = caseData.name.split(' ')

  const caseLink = page.getByRole('link', { name: `${surname}, ${forename}` })

  await refreshUntil(page, () => expect(caseLink).toBeVisible(), {
    timeout: minutesToMilliseconds(11),
    intervals: [secondsToMilliseconds(15)],
  })

  return { caseLink, forename, surname }
}
