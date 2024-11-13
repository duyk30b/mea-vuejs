import { DTimer, DString, DImage } from '../../utils'
import type { Organization } from '../organization'
import type { Ticket } from '../ticket'
import type { PrintHtml } from './print-html.model'

export const printHtmlCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  data?: Record<string, any>
  printHtml: PrintHtml
}) => {
  const { organization, ticket, printHtml, data } = options
  const compiledTemplate = new Function(
    'params',
    ` const {
        organization, 
        ticket,
        DTimer,
        DImage,
        DString,
      } = params;
      let data = params.data;
      ${printHtml.initVariable};
      return \`${printHtml.content}\`;
    `
  )
  return compiledTemplate({
    organization,
    ticket,
    data,
    DTimer,
    DImage,
    DString,
  })
}

export const ticketClinicPrintInvoiceDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-invoice.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}

export const ticketClinicPrintPrescriptionDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-prescription.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}

export const ticketEyePrintOptometryDefault = async () => {
  const fetchFile = await fetch('/template/ticket-eye-print-optometry.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}

export const ticketClinicPrintTicketRadiologyDefault = async () => {
  const fetchFile = await fetch('/template/ticket-clinic-print-ticket-radiology.html')
  const templateHtml = await fetchFile.text()
  return templateHtml
}
