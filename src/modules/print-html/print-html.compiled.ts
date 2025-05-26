import { DImage, DString, ESTimer } from '../../utils'
import { InteractType } from '../commission/commission.model'
import { LaboratoryValueType, type Laboratory } from '../laboratory'
import type { LaboratoryGroup } from '../laboratory-group'
import type { Organization } from '../organization'
import type { Radiology } from '../radiology'
import type { Ticket } from '../ticket'
import type { User } from '../user'
import type { PrintHtml } from './print-html.model'

export const compiledTemplatePrintHtml = (options: {
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
  customVariables?: string
}) => {
  const _SYSTEM_VARIABLE = {
    organization: options.organization || {},
    ticket: options.ticket || {},
    me: options.me || {},
    masterData: options.masterData || {},
    data: options.data || {},
    ESTimer,
    DImage,
    DString,
    _UTILS: {
      InteractType,
      LaboratoryValueType,
      ESTimer,
      DImage,
      DString,
    },
  }
  let html = ''

  try {
    const compiledTemplate = new Function(
      'params',
      `let {
        organization, 
        ticket,
        me,
        data,
        masterData,
        ESTimer,
        DImage,
        DString,
        _UTILS,
      } = params;
      ${options.printHtml.initVariable || ''};
      ${options.customVariables || ''};
      return \`${options.printHtml.content}\`;
    `,
    )
    html = compiledTemplate(_SYSTEM_VARIABLE)
  } catch (error) {
    console.log('🚀 ~ print-html.compiled.ts:51 ~ error:', error)
  }
  return { html, systemVar: _SYSTEM_VARIABLE }
}
