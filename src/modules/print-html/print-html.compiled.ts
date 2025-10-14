import { ESImage, ESString, ESTimer } from '../../utils'
import type { Customer } from '../customer'
import { LaboratoryValueType } from '../laboratory'
import type { Organization } from '../organization'
import { TicketItemType } from '../payment-ticket-item'
import { PositionType } from '../position'
import type { Ticket } from '../ticket'
import type { User } from '../user'

export class PrintHtmlCompile {
  static compileContentHtml(options: {
    data: Record<string, any> & {
      me?: User
      organization: Organization
      ticket?: Ticket
      customer?: Customer
    }
    _LAYOUT?: {
      _HEADER: string
      _CONTENT: string
      _FOOTER: string
    }
    templateString: string
    variablesString: string[]
  }) {
    const _SYSTEM_VARIABLE = {
      data: options.data || {},
      _UTILS: {
        PositionType,
        LaboratoryValueType,
        TicketItemType,
        ESTimer,
        ESImage,
        ESString,
      },
      _LAYOUT: options._LAYOUT || {},
    }

    try {
      const compiledTemplate = new Function(
        'params',
        `let {
        data,
        _LAYOUT,
        _UTILS,
      } = params;
      ${options.variablesString.join(';')};
      return \`${options.templateString}\`;
    `,
      )
      const htmlString = compiledTemplate(_SYSTEM_VARIABLE)
      return { htmlString, _SYSTEM_VARIABLE }
    } catch (error) {
      console.log('🚀 ~ print-html.compiled.ts:53 ~ error:', error)
    }
  }

  static compilePageHtml(props: {
    data: Record<string, any> & {
      me: User
      organization: Organization
      customer?: Customer
      ticket?: Ticket
    }
    variablesString: string[]
    template: {
      _header: string
      _footer: string
      _content: string
      _wrapper: string
    }
  }) {
    const { data, variablesString, template } = props
    const headerCompiled = PrintHtmlCompile.compileContentHtml({
      data,
      variablesString,
      templateString: template._header,
    })
    const footerCompiled = PrintHtmlCompile.compileContentHtml({
      data,
      variablesString,
      templateString: template._footer,
    })
    const contentCompiled = PrintHtmlCompile.compileContentHtml({
      data,
      variablesString,
      templateString: template._content,
    })
    const wrapperCompiled = PrintHtmlCompile.compileContentHtml({
      data,
      variablesString,
      templateString: template._wrapper,
      _LAYOUT: {
        _HEADER: headerCompiled?.htmlString,
        _FOOTER: footerCompiled?.htmlString,
        _CONTENT: contentCompiled?.htmlString,
      },
    })
    return wrapperCompiled
  }
}
