import { Messages } from '@/i18n/types'

declare global {
  // Use type safe messages
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}

export type { Messages }