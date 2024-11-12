import { DTimer, formatPhone } from '../../../utils'
import { useSettingStore } from '../../_me/setting.store'
import type { Customer } from '../../customer'
import type { Organization } from '../../organization'
import type { Paraclinical } from '../../paraclinical'
import type { Ticket } from '../../ticket'
import type { TicketParaclinical } from '../../ticket-paraclinical'

export const ticketClinicPrintTicketParaclinicalCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  customer: Customer
  paraclinical: Paraclinical
  ticketParaclinical: TicketParaclinical
  data: Record<string, any>
  htmlString: string
  doctorName: string
}) => {
  const {
    organization,
    ticket,
    customer,
    paraclinical,
    ticketParaclinical,
    data,
    htmlString,
    doctorName,
  } = options
  const formatMoney = useSettingStore().formatMoney
  const compiledTemplate = new Function(
    'options',
    `
      const {
        organization, 
        customer, 
        ticket,
        ticketParaclinical,
        data,
        paraclinical,
        DTimer,
        doctorName,
        formatPhone,
        formatMoney
      } = options
      return \`${htmlString}\`;
    `
  )
  return compiledTemplate({
    organization,
    customer,
    ticket,
    ticketParaclinical,
    data,
    paraclinical,
    DTimer,
    doctorName,
    formatPhone,
    formatMoney,
  })
}

export const ticketClinicPrintTicketParaclinicalDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-ticket-paraclinical.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}
