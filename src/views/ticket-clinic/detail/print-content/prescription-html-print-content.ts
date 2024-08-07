import { useMeStore } from '../../../../modules/_me/me.store'
import type { Ticket } from '../../../../modules/ticket'
import { TicketProductType } from '../../../../modules/ticket-product'
import { DTimer, formatPhone, timeToText } from '../../../../utils'

export const prescriptionHtmlContent = (ticket: Ticket) => {
  const meStore = useMeStore()
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
              <p>${meStore.organization.name} </p>
              <p>${meStore.organization.phone} </p>
            </td>
            <td style="width: 50%; text-align:right">
              <p>Mã KH: C${ticket.customerId}  </p>
              <p>Mã Phiếu: T${ticket.id} </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5; text-transform: uppercase;">
          ĐƠN THUỐC
        </div>

        <table class="information">
          <tr>
            <td> Họ tên </td>
            <td style="padding-right: 10px">:</td>
            <td> ${ticket.customer?.fullName} </td>
            <td style="white-space: no-wrap; padding-left: 48px;">
              - Ngày sinh: ${timeToText(ticket.customer?.birthday, 'DD/MM/YYYY')}
            </td>
          </tr>
          <tr>
            <td> SĐT </td>
            <td>:</td>
            <td> ${formatPhone(ticket.customer!.phone!)} </td>
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
            </tr>
          </thead>
          <tbody>
            ${(ticket.ticketProductList || [])
              .filter((i) => i.type === TicketProductType.Prescription)
              .map((i, index) => {
                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <div style="font-weight: 600;">${i.product?.brandName}</div>
                    <div style="font-size: 0.9rem">${i.product?.substance || ''}</div>
                    <div style="font-size: 0.9rem; font-style: italic;">${i.hintUsage || ''}</div>
                  </td>
                  <td style="text-align: center;">${i.unitName}</td>
                  <td style="text-align: center;">${i.unitQuantity}</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>

        <div style="text-align:right; font-style:italic; margin-top: 1rem">
          ${DTimer.timeToText(ticket.startedAt, 'DD/MM/YYYY')}
        </div>

        <table style="width: 100%; margin-top: 0.5rem">
          <tr>
            <td style="width: 70%; vertical-align: top;">
              <div style="font-style: italic; text-decoration: underline;">Lời dặn: </div>
              <div style="padding-top: 10px;">
                ${ticket.ticketDiagnosis?.advice}
              </div>
            </td>
            <td style="width: 30%; text-align: center; vertical-align: top;"> 
              <div> Bác sĩ thực hiện </div>
              <div style="margin-top: 100px">
                ${ticket.user!.fullName}
              </div>
            </td>
          </tr>
        </table>
      </div> 
    </div>
  </body>
  `
}
