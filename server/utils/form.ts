import { RadioItem, CheckboxItem, DividerItem } from '@sas/ui'

type Item = RadioItem | CheckboxItem

// eslint-disable-next-line import/prefer-default-export
export const injectConditionals = (
  items: Item[],
  conditionals: Record<string, string>,
): (Item & { conditional?: { html: string } })[] =>
  items.map(item => ({
    ...item,
    conditional: !isDivider(item) && conditionals[item.value] ? { html: conditionals[item.value] } : undefined,
  }))

const isDivider = (item: Item): item is DividerItem => 'divider' in item
