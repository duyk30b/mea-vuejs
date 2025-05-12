import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import type { Ticket } from '../../../../modules/ticket'
import { DString, ESTimer } from '../../../../utils'

export const ticketOrderHtmlContent = (ticket: Ticket) => {
  const settingStore = useSettingStore()
  const meStore = useMeStore()
  const { formatMoney } = settingStore
  const showSubstance = settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.substance
  const showUnit = settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.unit
  const showExpectedPrice = settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.expectedPrice
  const showHintUsage = settingStore.SCREEN_INVOICE_PREVIEW.invoiceItemsTable.hintUsage
  const showItemsActualMoney = settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.itemsActualMoney
  const showSurcharge = settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.surcharge
  const showDiscount = settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.discount
  const showPaid = settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.paid
  const showDebt = settingStore.SCREEN_INVOICE_PREVIEW.paymentInfo.debt

  const rowTicketProcedureList = ticket
    .ticketProcedureList!.map((item, index) => {
      const procedureName = `<div style="font-weight: 500;">${item.procedure!.name}</div>`
      let expectedPrice = ''
      if (showExpectedPrice && item.discountMoney) {
        expectedPrice = `<div style="color:red"><del><i><small>
            ${formatMoney(item.expectedPrice)}
          </small></i></del></div>`
      }
      return `<tr>
      <td class="auto-index" style="text-align: center"></td>
      <td colspan="${showUnit ? 2 : 1}"> ${procedureName} </td>
      <td style="text-align: center">${item.quantity}</td>
      <td style="text-align: right">
        ${expectedPrice}
        <div>${formatMoney(item.actualPrice)}</div>
      </td>
      <td style="text-align: right">${formatMoney(item.quantity * item.actualPrice)}</td>
    </tr>`
    })
    .join('')

  const rowTicketProductList = ticket
    .ticketProductList!.map((item, index) => {
      let productName = `<div style="font-weight: 500;">${item.product!.brandName}</div>`
      if (showSubstance && item.product?.substance) {
        productName += `<div style="font-size: 0.9em">${item.product?.substance}</div>`
      }
      let expectedPrice = ''
      if (showExpectedPrice && item.discountMoney) {
        expectedPrice = `<div style="color:red"><del><i><small>
            ${formatMoney(item.expectedPrice * item.unitRate)}
          </small></i></del></div>`
      }
      let colUnit = ''
      if (showUnit) {
        colUnit = ` <td style="text-align: center">${item.unitName}</td>`
      }
      return `<tr>
      <td class="auto-index" style="text-align: center"></td>
      <td>${productName}</td>
      ${colUnit}
      <td style="text-align: center">${item.quantity / item.unitRate}</td>
      <td style="text-align: right">
        ${expectedPrice}
        <div>${formatMoney(item.actualPrice * item.unitRate)}</div>
      </td>
      <td style="text-align: right">${formatMoney(item.quantity * item.actualPrice)}</td>
    </tr>`
    })
    .join('')

  let itemsActualMoney = ''
  if (showItemsActualMoney) {
    itemsActualMoney = `<tr>
      <td colspan="${showUnit ? 4 : 3}" style="text-align: right"><b>Tiền hàng</b></td>
      <td colspan="2" style="text-align: right">
        <b>
        ${formatMoney(ticket.productMoney + ticket.procedureMoney + ticket.radiologyMoney)}
        </b>
      </td>
    </tr>`
  }

  let discount = ''
  if (showDiscount) {
    discount = `<tr>
      <td colspan="${showUnit ? 4 : 3}" style="text-align: right">Chiết khấu</td>
      <td colspan="2" style="text-align: right">${formatMoney(ticket.discountMoney)}</td>
    </tr>`
  }

  let surcharge = ''
  if (showSurcharge) {
    surcharge = `<tr>
      <td colspan="${showUnit ? 4 : 3}" style="text-align: right">Phụ phí</td>
      <td colspan="2" style="text-align: right">${formatMoney(ticket.surcharge)}</td>
    </tr>`
  }

  let paid = ''
  if (showPaid) {
    paid = `<tr>
      <td colspan="${showUnit ? 4 : 3}" style="text-align: right">Đã thanh toán</td>
      <td colspan="2" style="text-align: right">${formatMoney(ticket.paid)}</td>
    </tr>`
  }

  let debt = ''
  if (showDebt) {
    debt = `<tr>
      <td colspan="${showUnit ? 4 : 3}" style="text-align: right">Nợ</td>
      <td colspan="2" style="text-align: right">${formatMoney(ticket.debt)}</td>
    </tr>`
  }

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
        line-height: 1.7;
        font-size: 14px;
      }

      #print-body {
        width: 190mm;
        background-color: white;
        margin: 0 auto;
        color: #000;
      }

      #print-body table {
        width: 100%;
        border-collapse: collapse;
      }

      #print-body table.information td {
        border: 0;
        padding: 0.5em 0;
        vertical-align: top;
      }
      #print-body table.data {
        margin-top: 0.5rem;
        border-spacing: 0;
      }
      #print-body table.data tbody {
        counter-reset: rowNumber 0;
      }
      #print-body table.data tbody tr {
        counter-increment: rowNumber 1;
      }
      #print-body table.data tbody tr td.auto-index:first-child::before {
        content: counter(rowNumber);
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
  <body id="print-body">
    <div>
      <table>
        <tr>
          <td style="width: 50%">
            <p>${meStore.organization.name} </p>
            <p>${meStore.organization.phone} </p>
          </td>
          <td style="width: 50%; text-align:right">
            <p>Mã KH: C${ticket.customerId}  </p>
            <p>Mã HĐ: IV${ticket.id}  </p>
          </td>
        </tr>
      </table>
      <div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5">HÓA ĐƠN</div>
      <table class="information">
        <tr>
          <td style="width: 100px">Khách hàng: </td>
          <td>${ticket.customer?.fullName} </td>
        </tr>
        <tr>
          <td>Địa chỉ: </td>
          <td>  ${DString.formatAddress(ticket.customer)} </td>
        </tr>
      </table>
      <table class="data">
        <thead>
          <tr>
            <th style="width: 20px">#</th>
            <th>Tên</th>
            ${showUnit ? '<th>Đ.Vị</th>' : ''}
            <th>SL</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowTicketProcedureList}
          ${rowTicketProductList}
          ${itemsActualMoney}
          ${discount}
          ${surcharge}
          <tr>
            <td colspan="${showUnit ? 4 : 3}" style="text-align: right"><b>Tổng tiền</b></td>
            <td colspan="2" style="text-align: right"><b>${formatMoney(
              ticket.totalMoney
            )}</b></td>
          </tr>
          ${paid}
          ${debt}
        </tbody>
      </table>
      <div style="text-align:right; font-style:italic; margin-top: 1rem">
        ${ESTimer.timeToText(ticket.registeredAt, 'hh:mm:ss DD/MM/YYYY')}
      </div>
      <table style="margin-top: 0.5rem">
        <tr>
          <td style="width: 50%; text-align: center"> Khách hàng </td>
          <td style="width: 50%; text-align: center"> Người thu tiền</td>
        </tr>
      </table>
    </div>
  </body>`
}
