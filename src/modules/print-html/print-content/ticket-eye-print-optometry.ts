import { DTimer, formatPhone } from '../../../utils'
import { useSettingStore } from '../../_me/setting.store'
import type { Customer } from '../../customer'
import type { Organization } from '../../organization'
import type { Ticket } from '../../ticket'
import type { DiagnosisSpecialEye } from '../../ticket-clinic'

export const ticketEyePrintOptometryCompiledTemplate = (options: {
  organization: Organization
  customer: Customer
  ticket: Ticket
  optometry: DiagnosisSpecialEye
  technicianName: string
  htmlString: string
}) => {
  const { organization, customer, ticket, optometry, technicianName, htmlString } = options
  const formatMoney = useSettingStore().formatMoney
  const compiledTemplate = new Function(
    'data',
    ` const {
          organization,
          customer,
          ticket,
          optometry,
          technicianName,
          DTimer,
          formatPhone,
          formatMoney,
      } = data;
      return \`${htmlString}\`;
    `
  )
  return compiledTemplate({
    organization,
    customer,
    ticket,
    optometry,
    technicianName,
    DTimer,
    formatPhone,
    formatMoney,
  })
}

export const ticketEyePrintOptometryDefault = async () => {
  const fetchFile = await fetch('/template/ticket-eye-print-optometry.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}
