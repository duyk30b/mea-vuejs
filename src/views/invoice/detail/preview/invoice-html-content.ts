import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import type { Invoice } from '../../../../modules/invoice'
import { timeToText } from '../../../../utils'

export const invoiceHtmlContent = (invoice: Invoice) => {
  const screenStore = useScreenStore()
  const meStore = useMeStore()
  const { formatMoney } = screenStore
  const rowInvoiceItem = invoice
    .invoiceItems!.map((item, index) => {
      let invoiceItemName = ''
      if (item.productId) {
        invoiceItemName = `<div style="font-weight: 500;">${item.product!.brandName}</div>`
        if (screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance) {
          invoiceItemName += `<div>${item.product?.substance}</div>`
        }
      }
      if (item.procedureId) {
        invoiceItemName = `<div style="font-weight: 500;">${item.procedure!.name}</div>`
      }
      let expectedPrice = ''
      if (screenStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice && item.discountMoney) {
        expectedPrice = `<div style="color:red"><del><i><small>
            ${formatMoney(item.expectedPrice * item.unitRate)}
          </small></i></del></div>`
      }
      return `<tr>
      <td style="text-align: center">${index + 1}</td>
      <td>${invoiceItemName}</td>
      <td style="text-align: center">${item.unitName}</td>
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
  if (screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney) {
    itemsActualMoney = `<tr>
      <td colspan="4" style="text-align: right"><b>Tiền hàng</b></td>
      <td colspan="2" style="text-align: right"><b>${formatMoney(invoice.itemsActualMoney)}</b></td>
    </tr>`
  }

  let discount = ''
  if (screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount) {
    discount = `<tr>
      <td colspan="4" style="text-align: right">Chiết khấu</td>
      <td colspan="2" style="text-align: right">${formatMoney(invoice.discountMoney)}</td>
    </tr>`
  }

  let surcharge = ''
  if (screenStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge) {
    surcharge = `<tr>
      <td colspan="4" style="text-align: right">Phụ phí</td>
      <td colspan="2" style="text-align: right">${formatMoney(invoice.surcharge)}</td>
    </tr>`
  }

  return `
    <style>
      #print-invoice-demo-body * {
        all: revert;
        font-family: 'Arial', sans-serif;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      #print-invoice-demo-body table.print-invoice-customer td {
        border: 0;
        padding: 0.5em 0;
        vertical-align: top;
      }
      #print-invoice-demo-body table.print-invoice-item-list {
        margin-top: 0.5rem;
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }
      #print-invoice-demo-body table.print-invoice-item-list th {
        padding: 0.5rem;
        border: 1px solid #cdcdcd;
      }
      #print-invoice-demo-body table.print-invoice-item-list td {
        padding: 0.5rem;
        border: 1px solid #cdcdcd;
      }
    </style>
    <div id="print-invoice-demo-body" style="width: 760px; background-color: white; padding: 10px">
      <div>
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <p>${meStore.organization.name} </p>
              <p>${meStore.organization.phone} </p>
            </td>
            <td style="width: 50%; text-align:right">
              <p>Mã KH: C${invoice.id}  </p>
              <p>Mã HĐ: IV${invoice.id}  </p>
            </td>
          </tr>
        </table>
        <div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5">HÓA ĐƠN</div>
        <table class="print-invoice-customer">
          <tr>
            <td style="width: 100px">Khách hàng: </td>
            <td>${invoice.customer?.fullName} </td>
          </tr>
          <tr>
            <td>Địa chỉ: </td>
            <td>  ${invoice.customer?.addressString} </td>
          </tr>
        </table>
        <table class="print-invoice-item-list">
          <thead>
            <tr>
              <th style="width: 20px">#</th>
              <th>Tên</th>
              <th>Đ.Vị</th>
              <th>SL</th>
              <th>Đ.Giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rowInvoiceItem}
            ${itemsActualMoney}
            ${discount}
            ${surcharge}
            <tr>
              <td colspan="4" style="text-align: right"><b>Thành tiền</b></td>
              <td colspan="2" style="text-align: right"><b>${formatMoney(
                invoice.totalMoney
              )}</b></td>
            </tr>
          </tbody>
        </table>
        <div style="text-align:right; font-style:italic; margin-top: 1rem">
          ${timeToText(invoice.startedAt, 'hh:mm:ss DD/MM/YYYY')}
        </div>
        <table style="width: 100%; margin-top: 0.5rem">
          <tr>
            <td style="width: 50%; text-align: center"> Khách hàng </td>
            <td style="width: 50%; text-align: center"> Người thu tiền</td>
          </tr>
        </table>
      </div> 
    </div>`
}
