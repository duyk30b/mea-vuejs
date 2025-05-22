<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PaymentMethodService, type PaymentMethod } from '../../../modules/payment-method'
import { PermissionId } from '../../../modules/permission/permission.enum'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalPaymentMethodUpsert from './ModalPaymentMethodUpsert.vue'

const modalPaymentMethodUpsert = ref<InstanceType<typeof ModalPaymentMethodUpsert>>()

const meStore = useMeStore()

const { permissionIdMap } = meStore

const paymentMethodList = ref<PaymentMethod[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await PaymentMethodService.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    paymentMethodList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ PaymentMethodList.vue:45 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleModalPaymentMethodUpsertSuccess = async (
  data: PaymentMethod,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}
</script>

<template>
  <ModalPaymentMethodUpsert
    ref="modalPaymentMethodUpsert"
    @success="handleModalPaymentMethodUpsertSuccess"
  />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalPaymentMethodUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="dataLoading">
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
        <tbody v-if="!dataLoading">
          <tr v-if="paymentMethodList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="paymentMethod in paymentMethodList" :key="paymentMethod.id">
            <td class="text-center" style="width: 100px">{{ paymentMethod.priority }}</td>
            <td>{{ paymentMethod.name }}</td>
            <td
              v-if="permissionIdMap[PermissionId.MASTER_DATA_PAYMENT_METHOD]"
              class="text-center"
              style="width: 100px"
            >
              <a
                style="color: var(--text-orange)"
                @click="modalPaymentMethodUpsert?.openModal(paymentMethod.id)"
              >
                <IconEditSquare width="24px" height="24px" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
