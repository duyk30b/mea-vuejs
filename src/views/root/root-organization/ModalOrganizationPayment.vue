<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputDate, InputMoney, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { Organization, OrganizationPayment } from '@/modules/organization'
import { RootOrganizationApi } from '@/modules/root/root-organization/root-organization.api'
import { ESString, ESTimer } from '@/utils'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const organizationPayment = ref<OrganizationPayment>(OrganizationPayment.blank())

const saveLoading = ref(false)

const nowTime = Date.now()
const nextYearTime = nowTime + 365 * 24 * 60 * 60 * 1000
organizationPayment.value.createdAt = nowTime
organizationPayment.value.expiryAt = nextYearTime

const openModal = async (orgProp: Organization) => {
  showModal.value = true
  organization.value = Organization.from(orgProp)
}

const closeModal = () => {
  showModal.value = false
  organization.value = Organization.blank()
}

const handleSave = async () => {
  saveLoading.value = true

  try {
    await RootOrganizationApi.paymentMoney(organization.value.id, {
      money: organizationPayment.value.money,
      createdAt: organizationPayment.value.createdAt,
      expiryAt: organizationPayment.value.expiryAt,
      note: organizationPayment.value.note,
    })

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalOrganizationPayment.vue:44 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thông tin thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div class="italic">Đã thanh toán</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Thời gian</th>
                <th>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="orgPaymentItem in organization.organizationPaymentList"
                :key="orgPaymentItem.id"
              >
                <td class="text-center">{{ orgPaymentItem.id }}</td>
                <td class="text-center">{{ ESTimer.timeToText(orgPaymentItem.createdAt) }}</td>
                <td class="text-right">{{ ESString.formatMoney(orgPaymentItem.money) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-8 flex flex-wrap gap-4">
          <div style="flex-basis: 40%; min-width: 300px; flex-grow: 1">
            <div>Thời gian thanh toán</div>
            <div class="flex-auto">
              <InputDate v-model:value="organizationPayment.createdAt" typeParser="number" />
            </div>
          </div>
          <div style="flex-basis: 40%; min-width: 300px; flex-grow: 1">
            <div>Số tiền thanh toán</div>
            <div class="flex">
              <InputMoney v-model:value="organizationPayment.money" textAlign="right" />
            </div>
          </div>
          <div style="flex-basis: 40%; min-width: 300px; flex-grow: 1">
            <div>Gia hạn thời gian sử dụng</div>
            <div class="flex-auto">
              <InputDate v-model:value="organizationPayment.expiryAt" typeParser="number" />
            </div>
          </div>
          <div style="flex-basis: 40%; min-width: 300px; flex-grow: 1">
            <div>Note</div>
            <div class="flex-auto">
              <InputText v-model:value="organizationPayment.note" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton style="margin-left: auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Thanh toán
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
