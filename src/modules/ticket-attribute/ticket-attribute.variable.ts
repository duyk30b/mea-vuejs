export const TicketAttributeKeyGeneralList = [
  'reason',
  'healthHistory',
  'summary',

  'pulse',
  'bloodPressure',
  'temperature',
  'respiratoryRate',
  'spO2',
  'height',
  'weight',

  'icd10Name',
  'icd10Code',
] as const

export const TicketAttributeKeyAdviceList = ['advice'] as const

export const TicketAttributeKeyOrderList = ['note'] as const

export type TicketAttributeKeyGeneralType = (typeof TicketAttributeKeyGeneralList)[number]
export type TicketAttributeKeyAdviceType = (typeof TicketAttributeKeyAdviceList)[number]
export type TicketAttributeKeyOrderType = (typeof TicketAttributeKeyOrderList)[number]

export type TicketAttributeKeyType =
  | TicketAttributeKeyGeneralType
  | TicketAttributeKeyAdviceType
  | TicketAttributeKeyOrderType

export type TicketAttributeMap = {
  [P in TicketAttributeKeyType]?: any
}
// export type TicketAttributeMap = Partial<Record<TicketAttributeKeyType, any>>
