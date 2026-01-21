import { StatusCard } from '@sas/ui'
import { nunjucksInline } from './nunjucksSetup'

// eslint-disable-next-line import/prefer-default-export
export const statusCard = (card: StatusCard) => nunjucksInline().render('components/statusCard.njk', card)
