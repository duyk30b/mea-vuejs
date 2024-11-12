import { DTimer, formatPhone } from '../../../utils'
import { useSettingStore } from '../../_me/setting.store'
import type { Customer } from '../../customer'
import type { Organization } from '../../organization'
import type { Ticket } from '../../ticket'
import type { TicketProduct } from '../../ticket-product'

export const ticketClinicPrintPrescriptionCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  customer: Customer
  ticketProductPrescriptionList: TicketProduct[]
  doctorName: string
  htmlString: string
}) => {
  const { organization, ticket, customer, ticketProductPrescriptionList, doctorName, htmlString } =
    options
  const formatMoney = useSettingStore().formatMoney
  const compiledTemplate = new Function(
    'data',
    ` const {
        organization, 
        customer, 
        ticket,
        ticketProductPrescriptionList,
        doctorName,
        DTimer,
        formatPhone,
        formatMoney
      } = data;
      return \`${htmlString}\`;
    `
  )
  return compiledTemplate({
    organization,
    customer,
    ticket,
    ticketProductPrescriptionList,
    doctorName,
    DTimer,
    formatPhone,
    formatMoney,
  })
}

export const ticketClinicPrintPrescriptionDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-prescription.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}
