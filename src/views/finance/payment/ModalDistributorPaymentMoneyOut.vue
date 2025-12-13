<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputOptions, InputSelect, InputText } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptions.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Distributor, DistributorService } from '@/modules/distributor'
import { WalletService } from '@/modules/wallet'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  PurchaseOrderQueryApi,
  PurchaseOrderStatus,
  type PurchaseOrder,
} from '@/modules/purchase-order'
import { ESString, ESTimer } from '@/utils'
import ModalDistributorDetail from '@/views/distributor/detail/ModalDistributorDetail.vue'
import ModalDistributorUpsert from '@/views/distributor/upsert/ModalDistributorUpsert.vue'
import LinkAndStatusPurchaseOrder from '@/views/purchase-order/LinkAndStatusPurchaseOrder.vue'
import { onMounted, ref } from 'vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()

const emit = defineEmits<{
  (e: 'success', value: { distributor: Distributor }): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const distributorOptions = ref<ItemOption[]>([])
const distributor = ref<Distributor>(Distributor.blank())

const money = ref(0)
const reason = ref('')
const walletId = ref<string>('')
const purchaseOrderPaymentList = ref<{ purchaseOrder: PurchaseOrder; money: number }[]>([])
const walletOptions = ref<{ value: any; label: string }[]>([])

const showModal = ref(false)
const purchaseOrderLoading = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  const walletAll = await WalletService.list({ sort: { code: 'ASC' } })
  walletOptions.value = walletAll.map((i) => ({ value: i.id, label: i.name }))
  walletId.value = walletAll[0]?.id || ''

  await DistributorService.getAll()
})

const searchingDistributor = async (text: string) => {
  distributor.value = Distributor.blank()
  if (text) {
    const distributorList = await DistributorService.search(text)
    distributorOptions.value = distributorList.map((i) => {
      return { text: i.fullName, value: i.id, data: i }
    })
  } else {
    distributorOptions.value = []
  }
}

const selectDistributor = async (data?: Distributor) => {
  distributor.value = data ? Distributor.from(data) : Distributor.blank()
  if (distributor.value.debt > 0) {
    try {
      purchaseOrderLoading.value = true
      const purchaseOrderDebtList = await PurchaseOrderQueryApi.list({
        filter: {
          distributorId: distributor.value.id,
          status: PurchaseOrderStatus.Debt,
        },
        sort: { id: 'ASC' },
      })
      purchaseOrderPaymentList.value = purchaseOrderDebtList.map((i) => ({
        purchaseOrder: i,
        money: 0,
      }))
    } catch (error) {
      console.log('🚀 ~ ModalPaymentMoneyIn.vue:82 ~ selectDistributor ~ error:', error)
    } finally {
      purchaseOrderLoading.value = false
    }
  } else {
    purchaseOrderPaymentList.value = []
  }
}

const openModal = async () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  purchaseOrderPaymentList.value = []
  money.value = 0
  reason.value = ''
  distributor.value = Distributor.blank()
  walletId.value = ''
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }
    // const data = await PaymentApi.distributorPayment({
    //   distributorId: distributor.value.id,
    //   walletId: walletId.value,
    //   totalMoney: money.value,
    //   reason: reason.value,
    //   note: '',
    //   paymentItemData: {
    //     moneyTopUpAdd: 0,
    //     payDebt: purchaseOrderPaymentList.value
    //       .map((i) => ({ purchaseOrderId: i.purchaseOrder.id, paidAmount: i.money }))
    //       .filter((i) => i.paidAmount > 0),
    //   },
    // })
    AlertStore.addSuccess(`NCC ${distributor.value.fullName} thanh toán thành công`)
    // emit('success', { distributor: data.distributorModified })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPaymentMoneyOut.vue:125 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAllDebt = () => {
  money.value = Math.max(distributor.value.debt, 0)
  calculatorEachVoucherPayment()
}

const calculatorEachVoucherPayment = () => {
  let totalMoney = money.value
  purchaseOrderPaymentList.value.forEach((item) => {
    const number = Math.min(totalMoney, item.purchaseOrder.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
    <div class="pl-4 py-3 flex items-center bg-white" style="border-bottom: 1px solid #dedede">
      <div class="flex-1 font-medium" style="font-size: 16px">Tạo phiếu thu</div>
      <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
        <IconClose />
      </div>
    </div>
    <form class="bg-white p-4" @submit.prevent="handleSave">
      <div>
        <div class="flex gap-1 flex-wrap">
          <span>Tên khách hàng</span>
          <template v-if="distributor.id">
            <a @click="modalDistributorDetail?.openModal(distributor.id)">
              <IconFileSearch />
            </a>
            <span v-if="distributor.debt > 0">
              (Nợ cũ:
              <b style="color: var(--text-red)">{{ formatMoney(distributor.debt) }}</b>
              )
            </span>
            <span v-if="distributor.debt < 0">
              (Ví:
              <b style="color: var(--text-green)">{{ formatMoney(-distributor.debt) }}</b>
              )
            </span>
            <a
              v-if="userPermission[PermissionId.CUSTOMER_UPDATE]"
              @click="modalDistributorUpsert?.openModal(distributor.id)"
            >
              Sửa thông tin NCC
            </a>
          </template>
          <div style="margin-left: auto">
            <a
              v-if="!distributor.id && userPermission[PermissionId.CUSTOMER_CREATE]"
              @click="modalDistributorUpsert?.openModal()"
            >
              Thêm NCC mới
            </a>
          </div>
        </div>

        <div style="height: 40px">
          <InputOptions
            ref="inputOptionsDistributor"
            :options="distributorOptions"
            :maxHeight="320"
            placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
            required
            @selectItem="({ data }) => selectDistributor(data)"
            @update:text="searchingDistributor"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ ESString.formatPhone(data.phone) }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                <span v-if="data.debt > 0">
                  Nợ:
                  <strong style="color: var(--text-red)">{{ formatMoney(data.debt) }}</strong>
                </span>
                <span v-if="data.debt < 0">
                  Ví:
                  <strong style="color: var(--text-green)">{{ formatMoney(-data.debt) }}</strong>
                </span>
              </div>
              <div>{{ ESString.formatAddress(data) }}</div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div v-if="distributor.debt > 0" class="mt-4">
        <div class="flex flex-wrap justify-between">
          <span>Chọn phiếu trả nợ (tự động)</span>
          <span>
            Tổng nợ
            <strong>{{ formatMoney(distributor.debt) }}</strong>
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Nợ</th>
                <th>Số tiền trả</th>
              </tr>
            </thead>
            <tbody v-if="purchaseOrderLoading">
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr v-for="(purchaseOrderPayment, index) in purchaseOrderPaymentList" :key="index">
                <td>
                  <LinkAndStatusPurchaseOrder :purchaseOrder="purchaseOrderPayment.purchaseOrder" />
                  <div>
                    {{
                      ESTimer.timeToText(
                        purchaseOrderPayment.purchaseOrder.startedAt,
                        'DD/MM/YYYY hh:mm',
                      )
                    }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(purchaseOrderPayment.purchaseOrder.debt) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(purchaseOrderPayment.money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 mt-4">
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            <div>Phương thức thanh toán</div>
            <div>
              <InputSelect v-model:value="walletId" :options="walletOptions" />
            </div>
          </div>
          <div class="mt-4">
            <div>Lý do nộp</div>
            <div>
              <InputText v-model:value="reason" />
            </div>
          </div>
        </div>
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="">
            <div class="flex flex-wrap justify-between">
              <span>Số tiền thanh toán</span>
            </div>
            <div>
              <div class="flex">
                <VueButton color="blue" @click="handleClickPayAllDebt">Tất cả</VueButton>
                <InputMoney
                  ref="inputMoneyPay"
                  v-model:value="money"
                  textAlign="right"
                  :validate="{ gt: 0 }"
                  required
                  @update:value="calculatorEachVoucherPayment"
                />
              </div>
            </div>
          </div>
          <div v-if="distributor.debt - money >= 0" class="mt-4">
            <div>Số nợ còn lại</div>
            <div>
              <InputMoney :value="distributor.debt - money" disabled textAlign="right" />
            </div>
          </div>
          <div v-else class="mt-4">
            <div>Số dư quỹ</div>
            <div>
              <InputMoney :value="money - distributor.debt" disabled textAlign="right" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" color="blue" :loading="saveLoading" icon="save">
            Xác nhận thanh toán
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalDistributorUpsert ref="modalDistributorUpsert" />
</template>
