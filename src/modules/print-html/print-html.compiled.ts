import { DImage, DString, DTimer } from '../../utils'
import type { Laboratory } from '../laboratory'
import type { LaboratoryGroup } from '../laboratory-group'
import type { Organization } from '../organization'
import type { Radiology } from '../radiology'
import type { Ticket } from '../ticket'
import type { User } from '../user'
import type { PrintHtml } from './print-html.model'

export const printHtmlCompiledTemplate = (options: {
  organization: Organization
  ticket: Ticket
  me?: User
  masterData?: {
    laboratoryMap?: Record<string, Laboratory>
    laboratoryGroupMap?: Record<string, LaboratoryGroup>
    radiology?: Radiology
  }
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
  try {
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
  } catch (error) {
    console.log('🚀 ~ print-html.compiled.ts:51 ~ error:', error)
    return ''
  }
}
