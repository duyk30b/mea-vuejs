import { DTimer, DString, DImage } from '../../utils'
import type { Laboratory } from '../laboratory'
import type { Organization } from '../organization'
import type { Ticket } from '../ticket'
import type { User } from '../user'
import type { PrintHtml } from './print-html.model'

export const printHtmlCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  me?: User
  masterData: { laboratoryMap?: Record<string, Laboratory> }
  data?: Record<string, any>
  printHtml: PrintHtml
}) => {
  const { organization, ticket, me, printHtml, data, masterData } = options
  const compiledTemplate = new Function(
    'params',
    ` const {
        organization, 
        ticket,
        me,
        data,
        masterData,
        DTimer,
        DImage,
        DString,
      } = params;
      ${printHtml.initVariable};
      return \`${printHtml.content}\`;
    `
  )
  return compiledTemplate({
    organization,
    ticket,
    me,
    data,
    masterData,
    DTimer,
    DImage,
    DString,
  })
}
