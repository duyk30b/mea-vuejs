<script setup lang="ts">
import { Invoice } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { ref } from 'vue'

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const showModal = ref(false)
const invoice = ref(Invoice.blank())

const openModal = async (data: Invoice) => {
  showModal.value = true
  invoice.value = data
}

const refreshModal = () => {
  showModal.value = false
  invoice.value = Invoice.blank()
}

defineExpose({ openModal })
</script>

<template>
  <a-modal wrapClassName="modal-invoice-preview" v-model:visible="showModal" width="820px" title="Hóa đơn"
    :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-between">
        <div></div>
        <a-button @click="showModal = false">Đóng</a-button>
      </div>
    </template>
    <div class="flex justify-between">
      <div class="flex flex-col items-center">
        <div>{{ organizationStore.organizationInfo.organizationName }}</div>
        <div>SĐT: {{ organizationStore.organizationInfo.phone }}</div>
      </div>
      <div class="flex flex-col items-center">
        <div>Mã hóa đơn</div>
        <div>HĐ{{ invoice.id }}</div>
      </div>
    </div>
    <div style="text-align: center; font-size: 1.2rem; font-weight: bold; line-height: 2.5">HÓA ĐƠN</div>
    <div>
      <div class="flex">
        <div style="width: 6rem;">Khách hàng:</div>
        <div>{{ invoice.customer?.fullName }}</div>
      </div>
      <div class="flex">
        <div style="width: 6rem;">Địa chỉ:</div>
        <div>
          {{ invoice.customer?.addressStreet }}
          {{ invoice.customer?.addressWard }}
          {{ invoice.customer?.addressDistrict }}
          {{ invoice.customer?.addressProvince }}
        </div>
      </div>
    </div>
    <div>
      <table class="mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th>Đ.Vị</th>
            <th>SL</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in invoice.invoiceItems" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td>{{ item.productBatch?.product?.brandName || item.procedure?.name }}</td>
            <td class="text-center">{{ item.unit.name || 'Lần' }}</td>
            <td class="text-center">{{ item.quantity }}</td>
            <td class="text-right">
              <div v-if="item.discountMoney != 0" style="color:rgb(255, 102, 0)">
                <del><i><small>
                      {{ formatMoney(item.expectedPrice) }}
                    </small></i></del>
              </div>
              <div>{{ formatMoney(item.actualPrice) }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(item.actualPrice * item.quantity) }}
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: right"><b>Tiền hàng</b></td>
            <td style="text-align: right">
              <b>
                {{ formatMoney(invoice.totalItemMoney) }}
              </b>
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: right">Chiết khấu</td>
            <td style="text-align: right">
              {{ formatMoney(invoice.discountMoney) }}
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: right">Phụ phí</td>
            <td style="text-align: right">
              {{ formatMoney(invoice.surcharge) }}
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: right"><b>Thành tiền</b></td>
            <td style="text-align: right">
              <b>
                {{ formatMoney(invoice.totalMoney) }}
              </b>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-end mt-4">Ngày tạo đơn:
      {{ timeToText(invoice.createTime, 'hh:mm DD/MM/YY') }}
    </div>
  </a-modal>
</template>

<style lang="scss">
.modal-invoice-preview {
  .ant-modal-body {
    padding: 12px;
    font-size: 12px;
  }

  table {
    width: 100%;

    td,
    th {
      padding: 0.2em 0.5em;
      border: 1px solid #c9c9c9;
      white-space: normal;
      word-wrap: break-word !important;
    }
  }
}
</style>
