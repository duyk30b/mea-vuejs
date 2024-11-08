import { DTimer, formatPhone } from '../../../utils'
import { useMeStore } from '../../_me/me.store'
import { useSettingStore } from '../../_me/setting.store'
import type { Ticket } from '../../ticket'

export const ticketClinicPrintInvoiceTemplate = (ticket: Ticket, htmlString: string) => {
  const settingStore = useSettingStore()
  const meStore = useMeStore()
  const organization = meStore.organization
  const { formatMoney } = settingStore
  const compiledTemplate = new Function(
    'ticket',
    'organization',
    'DTimer',
    'formatPhone',
    'formatMoney',
    `return \`${htmlString}\`;`
  )
  return compiledTemplate(ticket, organization, DTimer, formatPhone, formatMoney)
}

export const ticketClinicPrintInvoice = (ticket: Ticket) => {
  const settingStore = useSettingStore()
  const meStore = useMeStore()
  const organization = meStore.organization
  const { formatMoney } = settingStore

  return `
  <head>
    <title>&nbsp;</title>
    <style>
      #print-body * {
        all: revert;
        font-family: 'Arial', sans-serif;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        line-height: 30px;
      }

      #print-body table.information td {
        border: 0;
        vertical-align: top;
      }

      #print-body table.data {
        margin-top: 0.5rem;
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }

      #print-body table.data th {
        padding: 0.5rem;
        border: 1px solid #cdcdcd;
      }

      #print-body table.data td {
        padding: 0.5rem;
        border: 1px solid #cdcdcd;
      }
    </style>
  </head>
  <body>
    <div id="print-body" style="width: 760px; background-color: white; padding: 10px">
      <div>
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <p>${organization.name} </p>
              <p>${organization.phone} </p>
            </td>
            <td style="width: 50%; text-align:right">
              <p>Mã KH: C${ticket.customerId}  </p>
              <p>Mã Phiếu: T${ticket.id} </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5; text-transform: uppercase;">
          HOÁ ĐƠN
        </div>

        <table class="information">
          <tr>
            <td> Họ tên </td>
            <td style="padding-right: 10px">:</td>
            <td> ${ticket.customer?.fullName} </td>
            <td style="white-space: no-wrap; padding-left: 48px;">
              - Ngày sinh: ${DTimer.timeToText(ticket.customer?.birthday, 'DD/MM/YYYY')}
            </td>
          </tr>
          <tr>
            <td> SĐT </td>
            <td>:</td>
            <td> ${formatPhone(ticket.customer?.phone)} </td>
            <td style="white-space: no-wrap; padding-left: 48px;">
              - Giới tính: ${
                ticket.customer?.gender === 1 ? 'Nam' : ticket.customer?.gender === 0 ? 'Nữ' : ''
              }
            </td>
          </tr>
          <tr>
            <td> Địa chỉ </td>
            <td>:</td>
            <td colspan="2"> ${ticket.customer?.addressString} </td>
          </tr>
          <tr>
            <td style="width: 100px;"> Chẩn đoán </td>
            <td>:</td>  
            <td colspan="2"> ${ticket.ticketDiagnosis?.diagnosis} </td>
          </tr>
        </table>

        <table class="data">
          <thead>
            <tr>
              <th style="width: 30px">#</th>
              <th>Tên</th>
              <th>ĐV</th>
              <th>SL</th>
              <th>Giá</th>
              <th>T.Tiền</th>
            </tr>
          </thead>
            ${
              (ticket.ticketProductPrescriptionList || []).length
                ? `
              <tbody>
                <tr>
                  <th colspan="6" style="text-align: left; text-transform: uppercase;">Thuốc</th>
                </tr>
                ${(ticket.ticketProductPrescriptionList || [])
                  .map((i, index) => {
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <div style="font-weight: 600;">${i.product?.brandName}</div>
                        <div style="font-size: 0.9rem">${i.product?.substance || ''}</div>
                      </td>
                      <td style="text-align: center;">${i.unitName}</td>
                      <td style="text-align: center;">${i.unitQuantity}</td>
                      <td style="text-align: right;">
                        <div style="font-size: 0.9rem; color:red; font-style: italic; text-decoration: line-through;">
                          ${i.discountMoney ? formatMoney(i.expectedPrice) : ''}
                        </div>
                        <div>${formatMoney(i.actualPrice)}</div>
                      </td>
                      <td style="text-align: right;">${formatMoney(i.actualPrice * i.quantity)}</td>
                    </tr>
                  `
                  })
                  .join('')}
                <tr>
                  <td colspan="5" style="text-align: right; text-transform: uppercase;">Tổng tiền thuốc </td>
                  <td style="text-align: right; font-weight: bold">
                    ${formatMoney(
                      (ticket.ticketProductPrescriptionList || []).reduce((acc, item) => {
                        return acc + item.actualPrice * item.quantity
                      }, 0)
                    )}
                  </td>
                </tr>
              </tbody>
              `
                : ``
            }

            ${
              (ticket.ticketProductConsumableList || []).length
                ? `
              <tbody>
                <tr>
                  <th colspan="6" style="text-align: left; text-transform: uppercase;">VẬT TƯ</th>
                </tr>
                ${(ticket.ticketProductConsumableList || [])
                  .map((i, index) => {
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <div style="font-weight: 600;">${i.product?.brandName}</div>
                        <div style="font-size: 0.9rem">${i.product?.substance || ''}</div>
                      </td>
                      <td style="text-align: center;">${i.unitName}</td>
                      <td style="text-align: center;">${i.unitQuantity}</td>
                      <td style="text-align: right;">
                        <div style="font-size: 0.9rem; color:red; font-style: italic; text-decoration: line-through;">
                          ${i.discountMoney ? formatMoney(i.expectedPrice) : ''}
                        </div>
                        <div>${formatMoney(i.actualPrice)}</div>
                      </td>
                      <td style="text-align: right;">${formatMoney(i.actualPrice * i.quantity)}</td>
                    </tr>
                  `
                  })
                  .join('')}
                <tr>
                  <td colspan="5" style="text-align: right; text-transform: uppercase;">Tổng tiền vật tư </td>
                  <td style="text-align: right; font-weight: bold">
                    ${formatMoney(
                      (ticket.ticketProductConsumableList || []).reduce((acc, item) => {
                        return acc + item.actualPrice * item.quantity
                      }, 0)
                    )}
                  </td>
                </tr>
              </tbody>
              `
                : ``
            }

            ${
              (ticket.ticketProcedureList || []).length
                ? `
              <tbody>
                <tr>
                  <th colspan="6" style="text-align: left; text-transform: uppercase;">Dịch vụ thủ thuật</th>
                </tr>
                ${(ticket.ticketProcedureList || [])
                  .map((i, index) => {
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td colspan="2">${i.procedure?.name}</td>
                      <td style="text-align: center;">${i.quantity}</td>
                      <td style="text-align: right;">
                        <div style="font-size: 0.9rem; color:red; font-style: italic; text-decoration: line-through;">
                          ${i.discountMoney ? formatMoney(i.expectedPrice) : ''}
                        </div>
                        <div>${formatMoney(i.actualPrice)}</div>
                      </td>
                      <td style="text-align: right;">${formatMoney(i.actualPrice * i.quantity)}</td>
                    </tr>
                  `
                  })
                  .join('')}
                <tr>
                  <td colspan="5" style="text-align: right; text-transform: uppercase;"> Tổng tiền dịch vụ - thủ thuật </td>
                  <td style="text-align: right; font-weight: bold">
                    ${formatMoney(ticket.proceduresMoney)}
                  </td>
                </tr>
              </tbody>
              `
                : ``
            }

            ${
              (ticket.ticketRadiologyList || []).length
                ? `
              <tbody>
                <tr>
                  <th colspan="6" style="text-align: left; text-transform: uppercase;">CHẨN ĐOÁN HÌNH ẢNH</th>
                </tr>
                ${(ticket.ticketRadiologyList || [])
                  .map((i, index) => {
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td colspan="3">${i.radiology?.name}</td>
                      <td style="text-align: right;">
                        <div style="font-size: 0.9rem; color:red; font-style: italic; text-decoration: line-through;">
                          ${i.discountMoney ? formatMoney(i.expectedPrice) : ''}
                        </div>
                        <div>${formatMoney(i.actualPrice)}</div>
                      </td>
                      <td style="text-align: right;">${formatMoney(i.actualPrice)}</td>
                    </tr>
                  `
                  })
                  .join('')}
                <tr>
                  <td colspan="5" style="text-align: right; text-transform: uppercase;"> Tổng tiền chẩn đoán hình ảnh </td>
                  <td style="text-align: right; font-weight: bold">
                    ${formatMoney(ticket.radiologyMoney)}
                  </td>
                </tr>
              </tbody>
              `
                : ``
            }

          <tbody>
            <tr>
              <td colspan="5" style="text-align: right; text-transform: uppercase; font-weight: bold">Tổng tiền </td>
              <td style="text-align: right; font-weight: bold">${formatMoney(
                ticket.totalMoney
              )}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align:right; font-style:italic; margin-top: 1rem">
          ${DTimer.timeToText(ticket.startedAt, 'DD/MM/YYYY')}
        </div>

        <table style="width: 100%; margin-top: 0.5rem">
          <tr>
            <td style="width: 30%; text-align: center;"> Khách hàng </td>
            <td style="width: 30%; text-align: center;"> </td>
            <td style="width: 30%; text-align: center"> Người thu tiền </td>
          </tr>
        </table>
      </div> 
    </div>
  </body>
  `
}
