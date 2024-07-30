import { useMeStore } from '../../../../modules/_me/me.store'
import type { Ticket } from '../../../../modules/ticket'
import type { TicketRadiology } from '../../../../modules/ticket-radiology'
import { DTimer, formatPhone, timeToText } from '../../../../utils'

export const ticketRadiologyHtmlContent = (ticket: Ticket, ticketRadiology: TicketRadiology) => {
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
        font-size: 18px;
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
              <p>Mã Phiếu: T${ticketRadiology.ticketId}-TR${ticketRadiology.id} </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5; text-transform: uppercase;">
          PHIẾU ${ticketRadiology.radiology!.name}
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

        <div style="margin-top: 20px; font-size: 18px; font-weight: 700"> I. Hình ảnh </div>  
        <div style="padding-top: 10px; display: flex; flex-wrap: wrap; gap: 20px">
        ${ticketRadiology.imageList
          .slice(0, 4)
          .map((i) => {
            return `
              <div style="width: 23%">
                <img style="width: 100%; object-fit: cover; aspect-ratio: 1 / 1;"
                  src="https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w500">
              </div>
            `
          })
          .join('')}
        </div>   

        <div style="margin-top: 20px; font-size: 18px; font-weight: 700"> II. Mô tả </div>
        <div style="padding-left: 1rem;"> ${ticketRadiology.description}</div>
        <div style="margin-top: 20px; font-size: 18px; font-weight: 700"> III. Kết luận </div>
        <div style="padding-left: 1rem;"> ${ticketRadiology.result} </div>

        <table style="width: 100%; margin-top: 0.5rem">
          <tr>
            <td style="width: 60%;">
            </td>
            <td style="width: 40%; text-align: center; vertical-align: top;">
              <div style="font-style: italic; font-size: 0.9rem;"> 
                ${DTimer.timeToText(ticket.startedAt, 'Ngày DD tháng MM năm YYYY')}
               </div>
              <div>
                Bác sĩ thực hiện
              </div>
              <div style="margin-top: 100px">
                ${ticketRadiology.doctor!.fullName}
              </div>
            </td>
          </tr>
        </table>
      </div> 
    </div>
  </body>
  `
}
