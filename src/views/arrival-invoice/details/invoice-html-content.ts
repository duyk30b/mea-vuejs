import { InvoiceItemType } from '@/modules/enum'
import type { Invoice } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'

export const invoiceHtmlContent = (invoice: Invoice) => {
	const organizationStore = useOrganizationStore()
	const rowInvoiceItem = invoice.invoiceItems
		.map((item, index) => {
			let invoiceItemName = ''
			if (item.type === InvoiceItemType.ProductBatch) {
				invoiceItemName = `<div style="font-weight: 500;">${item.productBatch?.product?.brandName}</div>`
				if (organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.substance) {
					invoiceItemName += `<div>${item.productBatch?.product?.substance}</div>`
				}
			}
			if (item.type === InvoiceItemType.Procedure) {
				invoiceItemName = `<div style="font-weight: 500;">${item.procedure.nameVi}</div>`
			}
			let expectedPrice = ''
			if (organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.expectedPrice && item.discountMoney) {
				expectedPrice = `<div style="color:red"><del><i><small>
						${formatNumber(item.expectedPrice * item.unit.rate)}
					</small></i></del></div>`
			}
			return `<tr>
			<td style="text-align: center">${index + 1}</td>
			<td>${invoiceItemName}</td>
			<td style="text-align: center">${item.unit.name}</td>
			<td style="text-align: right">${item.quantity / item.unit.rate}</td>
			<td style="text-align: right">
				${expectedPrice}
				<div>${formatNumber(item.actualPrice * item.unit.rate)}</div>
			</td>
			<td style="text-align: right">${formatNumber(item.quantity * item.actualPrice)}</td>
		</tr>`
		})
		.join('')

	let totalItemMoney = ''
	if (organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.totalItemMoney) {
		totalItemMoney = `<tr>
			<td colspan="5" style="text-align: right"><b>Tiền hàng</b></td>
			<td style="text-align: right"><b>${formatNumber(invoice.totalItemMoney)}</b></td>
		</tr>`
	}

	let discount = ''
	if (organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.discount) {
		discount = `<tr>
			<td colspan="5" style="text-align: right">Chiết khấu</td>
			<td style="text-align: right">${formatNumber(invoice.discountMoney)}</td>
		</tr>`
	}

	let surcharge = ''
	if (organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.surcharge) {
		surcharge = `<tr>
			<td colspan="5" style="text-align: right">Phụ phí</td>
			<td style="text-align: right">${formatNumber(invoice.surcharge)}</td>
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
							<p>${organizationStore.organizationInfo.organizationName} </p>
							<p>SĐT: ${organizationStore.organizationInfo.phone} </p>
						</td>
						<td style="width: 50%; text-align:right">Mã hóa đơn: HĐ${invoice.id} </td>
					</tr>
				</table>
				<div style="text-align: center; font-size: 1.8rem; font-weight: bold; line-height: 2.5">HÓA ĐƠN</div>
				<table class="print-invoice-customer">
					<tr>
						<td style="width: 100px">Khách hàng: </td>
						<td>${invoice.customer?.fullNameVi} </td>
					</tr>
					<tr>
						<td>Địa chỉ: </td>
						<td>
							${invoice.customer?.addressStreet},
							${invoice.customer?.addressWard},
							${invoice.customer?.addressDistrict},
							${invoice.customer?.addressProvince}
						</td>
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
						${totalItemMoney}
						${discount}
						${surcharge}
						<tr>
							<td colspan="4" style="text-align: right"><b>Thành tiền</b></td>
							<td style="text-align: right"><b>${formatNumber(invoice.totalMoney)}</b></td>
						</tr>
					</tbody>
				</table>
				<div style="text-align:right; font-style:italic; margin-top: 1rem">
					${timeToText(invoice.paymentTime, 'hh:mm:ss DD/MM/YYYY')}
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
