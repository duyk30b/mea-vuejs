import { DTimer, formatPhone } from '../../../utils'
import { useSettingStore } from '../../_me/setting.store'
import type { Customer } from '../../customer'
import type { Organization } from '../../organization'
import type { Ticket } from '../../ticket'

export const ticketClinicPrintInvoiceCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  customer: Customer
  htmlString: string
}) => {
  const { organization, ticket, customer, htmlString } = options
  const formatMoney = useSettingStore().formatMoney
  const compiledTemplate = new Function(
    'data',
    ` const {
        organization, 
        customer, 
        ticket,
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
    DTimer,
    formatPhone,
    formatMoney,
  })
}

export const ticketClinicPrintInvoiceDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-invoice.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}
