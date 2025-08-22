import { SETTING_DEFAULT } from './setting.default'

export const SettingKey: { [K in keyof typeof SETTING_DEFAULT]: K } = (
  Object.keys(SETTING_DEFAULT) as (keyof typeof SETTING_DEFAULT)[]
).reduce((acc, key) => {
  acc[key] = key
  return acc
}, {} as any)
