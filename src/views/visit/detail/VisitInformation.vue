<script lang="ts" setup>
import {
  ClockCircleOutlined,
  DollarOutlined,
  IdcardOutlined,
  PhoneOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  FileSearchOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { PaymentViewType } from '../../../modules/enum'
import { VisitStatus } from '../../../modules/visit'
import { timeToText } from '../../../utils'
import VisitStatusTag from '../VisitStatusTag.vue'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalVisitPayment from './ModalVisitPayment.vue'
import { visit } from './visit.ref'

const modalVisitPayment = ref<InstanceType<typeof ModalVisitPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const updateCustomer = () => {}
</script>
<template>
  <ModalVisitPayment ref="modalVisitPayment" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <div class="bg-white p-4">
    <div class="flex justify-between">
      <div class="uppercase font-medium">
        <IdcardOutlined />
        <span class="ml-4">{{ visit.customer?.fullName }}</span>
        <a class="ml-2" @click="modalCustomerDetail?.openModal(visit.customerId!)">
          <FileSearchOutlined />
        </a>
      </div>
      <div>
        {{ visit.customer?.gender === 0 ? 'Nữ' : ' ' }}
        {{ visit.customer?.gender === 1 ? 'Nam' : ' ' }}
        <span class="ml-2"> {{ timeToText(visit.customer?.birthday, 'DD/MM/YYYY') }}</span>
      </div>
    </div>
    <div class="mt-2 flex justify-between">
      <div class="">
        <PhoneOutlined />
        <span class="ml-4">{{ visit.customer?.phone }}</span>
      </div>
      <div>{{ visit.customer?.addressString }}</div>
    </div>
    <div class="mt-2">
      <WarningOutlined /><span class="ml-4">{{ visit.visitDiagnosis?.diagnosis }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <ClockCircleOutlined />
        <div>{{ timeToText(visit.startedAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <VisitStatusTag :visitStatus="visit.visitStatus" />
      </div>
    </div>
    <a-divider />
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <DollarOutlined />
        <div>Thanh toán :</div>
      </div>
      <div class="flex gap-4 items-center">
        <div>
          <VueButton
            v-if="
              [VisitStatus.Scheduled, VisitStatus.Waiting, VisitStatus.InProgress].includes(
                visit.visitStatus
              )
            "
            size="small"
            color="green"
            @click="modalVisitPayment?.openModal(PaymentViewType.Prepayment)"
          >
            <DollarOutlined />
            <span class="font-bold"> TẠM ỨNG </span>
          </VueButton>
          <VueButton
            v-if="[VisitStatus.Debt].includes(visit.visitStatus)"
            size="small"
            color="green"
            @click="modalVisitPayment?.openModal(PaymentViewType.PayDebt)"
          >
            <DollarOutlined />

            <span class="font-bold"> TRẢ NỢ </span>
          </VueButton>
          <VueButton
            v-if="[VisitStatus.Completed].includes(visit.visitStatus)"
            size="small"
            color="green"
            @click="modalVisitPayment?.openModal(PaymentViewType.Success)"
          >
            <DollarOutlined />
            <span class="font-bold"> THANH TOÁN </span>
          </VueButton>
        </div>
        <span> {{ formatMoney(visit.paid) }} / {{ formatMoney(visit.totalMoney) }} </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <DollarOutlined />
        <div v-if="visit.totalMoney >= visit.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div class="text-lg" :class="visit.paid < visit.totalMoney ? 'text-red-500 font-bold' : ''">
        {{ formatMoney(Math.abs(visit.totalMoney - visit.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <SendOutlined />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <a-tag v-if="!visit.productsMoney" color="default">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          Không có thuốc
        </a-tag>
        <a-tag v-if="visit.productsMoney && !visit.isSent" color="warning">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          Chưa xuất thuốc
        </a-tag>
        <a-tag v-if="visit.productsMoney && visit.isSent" color="success">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          Đã xuất thuốc
        </a-tag>
      </div>
    </div>
  </div>
</template>
<script lang="scss" scope></script>
