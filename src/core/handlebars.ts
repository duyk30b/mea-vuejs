// import Handlebars from 'handlebars'
// import type { UnitType } from '../modules/enum'
// import { formatNumber, formatPhone, timeToText } from '../utils'
// import type { TicketProduct } from '../modules/ticket-product'

// Handlebars.registerHelper('plus', (a: number, b: number) => a + b)
// Handlebars.registerHelper('minus', (a: number, b: number) => a - b)
// Handlebars.registerHelper('multiply', (a: number, b: number) => a * b)
// Handlebars.registerHelper('divide', (a: number, b: number) => a / b)
// Handlebars.registerHelper('eq', (a: number, b: number) => a === b)
// Handlebars.registerHelper('ne', (a: number, b: number) => a !== b)
// Handlebars.registerHelper('gt', (a: number, b: number) => a > b)
// Handlebars.registerHelper('gte', (a: number, b: number) => a >= b)
// Handlebars.registerHelper('lt', (a: number, b: number) => a < b)
// Handlebars.registerHelper('lte', (a: number, b: number) => a <= b)

// Handlebars.registerHelper('boolean', (a) => !!a)

// Handlebars.registerHelper('formatNumber', (number: number) => {
//   return formatNumber({ number })
// })

// Handlebars.registerHelper('formatPhone', (phone: string) => {
//   return formatPhone(phone)
// })

// Handlebars.registerHelper('timeToText', (time, text: string) => {
//   return timeToText(time, text)
// })

// Handlebars.registerHelper('nowToText', (text: string) => {
//   return timeToText(new Date(), text)
// })

// Handlebars.registerHelper('getGenderText', (gender: number) => {
//   if (gender === 0) return 'Nữ'
//   if (gender === 1) return 'Nam'
//   return ''
// })

// Handlebars.registerHelper('getUnitNameByTicketProduct', (ticketProduct: TicketProduct) => {
//   const unitObject: UnitType[] = JSON.parse(ticketProduct.product?.unit || '[]')
//   const unitCurrent = unitObject.find((i) => i.rate === ticketProduct.unitRate)
//   return unitCurrent?.name || ''
// })

// export { Handlebars }

export {}
