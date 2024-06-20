<script setup lang="ts">
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Batch, BatchApi } from '../../../modules/batch'
import { BatchMovementApi } from '../../../modules/batch-movement/batch-movement.api'
import type { BatchMovement } from '../../../modules/batch-movement/batch-movement.model'
import { VoucherType } from '../../../modules/enum'
import { Product } from '../../../modules/product'
import { ProductMovementApi } from '../../../modules/product-movement/product-movement.api'
import type { ProductMovement } from '../../../modules/product-movement/product-movement.model'
import { customFilter, timeToText } from '../../../utils'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const movements = ref<ProductMovement[] | BatchMovement[]>([])
const batchAll = ref<Batch[]>([])
const batchList = ref<Batch[]>([])

const currentBatch = ref<Batch>(Batch.blank())
const voucherType = ref<VoucherType>()

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchProductMovements = async () => {
  try {
    const { data, meta } = await ProductMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        voucherType: voucherType.value != null ? voucherType.value : undefined,
        productId: currentBatch.value?.id ? undefined : props.product.id,
      },
      relation: { distributor: true, customer: true },
      sort: { id: 'DESC' },
    })
    data.forEach((i) => (i.product = props.product))
    movements.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:35 ~ error:', error)
  }
}

const startFetchBatchMovements = async () => {
  try {
    const { data, meta } = await BatchMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        voucherType: voucherType.value != null ? voucherType.value : undefined,
        productId: props.product.id,
        batchId: currentBatch.value.id,
      },
      relation: { distributor: true, customer: true },
      sort: { id: 'DESC' },
    })
    data.forEach((i) => (i.product = props.product))
    movements.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:35 ~ error:', error)
  }
}

const startFetchMovements = async () => {
  if (currentBatch.value.id) {
    await startFetchBatchMovements()
  } else {
    await startFetchProductMovements()
  }
}

const startFetchBatches = async () => {
  if (!props.product.hasManageBatches) return
  try {
    const { data } = await BatchApi.list({
      filter: { productId: props.product.id },
      sort: { id: 'DESC' },
    })
    batchAll.value = data
    batchList.value = data
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:47 ~ error:', error)
  }
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) {
      await startFetchProductMovements()
      await startFetchBatches()
    } else movements.value = []
  },
  { immediate: true }
)

const selectBatch = async (data?: Batch) => {
  if (data) {
    currentBatch.value = Batch.fromInstance(data)
    await startFetchBatchMovements()
  } else {
    currentBatch.value = Batch.blank()
    await startFetchProductMovements()
  }
}

const searchingBatch = async (text: string) => {
  currentBatch.value.id = 0
  if (text) {
    batchList.value = batchAll.value.filter((b) => {
      const expiryDate = timeToText(b.expiryDate, 'DD/MM/YYYY')
      return customFilter(b.lotNumber, text, 2) || customFilter(expiryDate, text, 1)
    })
  } else {
    batchList.value = [...batchAll.value]
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchMovements()
}

const openBlankReceiptDetail = async (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}

const openBlankInvoiceDetail = async (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="flex justify-end gap-4 items-stretch">
    <div v-if="product.hasManageBatches" style="flex: 1">
      <span style="font-size: 0.8rem" class="whitespace-nowrap">Xem theo lô</span>
      <div>
        <InputOptions
          :options="batchList.map((i) => ({ value: i.id, text: i.lotNumber, data: i }))"
          :maxHeight="260"
          placeholder="Chọn lô hàng"
          @selectItem="({ data }) => selectBatch(data)"
          @update:text="searchingBatch"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.batch }}</b> {{ timeToText(data.expiryDate) }} - ({{ data.quantity }}
              {{ product.unitBasicName }})
            </div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div style="flex: 1">
      <span style="font-size: 0.8rem">Chọn loại</span>
      <div>
        <VueSelect
          v-model:value="voucherType"
          placeholder="Tất cả"
          :options="[
            { value: null, text: 'Tất cả' },
            { value: VoucherType.Receipt, text: 'Nhập hàng' },
            { value: VoucherType.Invoice, text: 'Bán hàng' },
            { value: VoucherType.Visit, text: 'Phòng Khám' },
          ]"
          @selectItem="startFetchMovements"
        />
      </div>
    </div>
  </div>
  <div v-if="isMobile" class="table-wrapper mt-2">
    <table>
      <thead>
        <tr>
          <th><a-tag color="blue"> K.Hàng </a-tag>- <a-tag color="green"> NCC </a-tag></th>
          <th>Số lượng</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="movements.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(movement, index) in movements" :key="index">
          <td>
            <div v-if="movement.voucherType === VoucherType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(movement.voucherId)">
                  RC{{ movement.voucherId }}
                </a>
              </div>
              <div>
                <a-tag color="green">{{ movement.distributor!.fullName }}</a-tag>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="movement.voucherType === VoucherType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(movement.voucherId)">
                  IV{{ movement.voucherId }}
                </a>
              </div>
              <div>
                <a-tag color="blue">{{ movement.customer!.fullName }}</a-tag>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="movement.voucherType === VoucherType.Visit">
              <div>
                <a @click="openBlankInvoiceDetail(movement.voucherId)">
                  VS{{ movement.voucherId }}
                </a>
              </div>
              <div>
                <a-tag color="blue">{{ movement.customer!.fullName }}</a-tag>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div>
              <span v-if="movement.isRefund">
                <a-tag color="error">
                  <template #icon>
                    <MinusCircleOutlined />
                  </template>
                  Hoàn trả
                </a-tag>
              </span>
            </div>
          </td>
          <td>
            <div class="flex justify-between">
              <span v-if="movement.quantity > 0">Nhập: </span>
              <span v-if="movement.quantity < 0">Xuất: </span>
              <span class="font-bold"> {{ movement.unitQuantity }} </span>
              <span v-if="movement.unitRate !== 1">
                &nbsp;{{ movement.unitName }} ({{ movement.quantity }} {{ product.unitBasicName }})
              </span>
            </div>
            <div class="flex justify-between">
              <span>Giá: </span>
              <span>
                {{ formatMoney(movement.unitActualPrice) }}
                <span v-if="movement.unitName">/ {{ movement.unitName }}</span>
              </span>
            </div>
            <div class="flex justify-between">
              <span>SL:</span>
              <span>{{ movement.openQuantity }} ➞ {{ movement.closeQuantity }}</span>
            </div>
            <div v-if="!currentBatch.id" class="flex justify-between">
              <span>Vốn:</span>
              <span
                >{{ formatMoney((movement as ProductMovement).openCostAmount) }} ➞
                {{ formatMoney((movement as ProductMovement).closeCostAmount) }}</span
              >
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 float-right mb-2">
      <a-pagination
        v-model:current="page"
        v-model:pageSize="limit"
        size="small"
        :total="total"
        show-size-changer
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
      />
    </div>
  </div>
  <div v-if="!isMobile" class="table-wrapper mt-4">
    <table>
      <thead>
        <tr>
          <th><a-tag color="blue"> K.Hàng </a-tag>- <a-tag color="green"> NCC </a-tag></th>
          <th>Nhập/Xuất</th>
          <th>Tồn kho ({{ product.unitBasicName }})</th>
          <th>Giá</th>
          <th v-if="!currentBatch.id">Vốn</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="movements.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(movement, index) in movements" :key="index">
          <td>
            <div v-if="movement.voucherType === VoucherType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(movement.voucherId)">
                  RC{{ movement.voucherId }}
                </a>
                <span class="ml-2">
                  <a-tag color="green">{{ movement.distributor!.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
                <span v-if="movement.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
            <div v-if="movement.voucherType === VoucherType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(movement.voucherId)">
                  IV{{ movement.voucherId }}
                </a>
                <span class="ml-2">
                  <a-tag color="blue">{{ movement.customer!.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
                <span v-if="movement.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
            <div v-if="movement.voucherType === VoucherType.Visit">
              <div>
                <a @click="openBlankInvoiceDetail(movement.voucherId)">
                  VS{{ movement.voucherId }}
                </a>
                <span class="ml-2">
                  <a-tag color="blue">{{ movement.customer!.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.createdAt, 'hh:mm DD/MM/YYYY') }}
                <span v-if="movement.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
          </td>
          <td class="text-center">
            <div>
              {{ movement.unitQuantity }}
              <span v-if="movement.unitRate !== 1">
                {{ movement.unitName }}
              </span>
            </div>
            <div v-if="movement.unitRate !== 1" class="text-xs">
              ({{ movement.quantity }} {{ product.unitBasicName }})
            </div>
          </td>
          <td class="text-center">{{ movement.openQuantity }} ➞ {{ movement.closeQuantity }}</td>
          <td class="text-right">
            <div
              v-if="movement.expectedPrice !== movement.actualPrice"
              style="
                font-size: 0.8rem;
                text-decoration: line-through;
                font-style: italic;
                white-space: nowrap;
                color: var(--text-red);
              "
            >
              {{ formatMoney(movement.unitExpectedPrice) }}
              <span v-if="movement.unitRate !== 1"> / {{ movement.unitName }} </span>
            </div>
            <div>
              {{ formatMoney(movement.unitActualPrice) }}
              <span v-if="movement.unitRate !== 1"> / {{ movement.unitName }} </span>
            </div>
            <div v-if="movement.unitRate !== 1" class="text-xs">
              ({{ formatMoney(movement.actualPrice) }} / {{ product.unitBasicName }})
            </div>
          </td>
          <td v-if="!currentBatch.id" class="text-center">
            {{ formatMoney((movement as ProductMovement).openCostAmount) }} ➞
            {{ formatMoney((movement as ProductMovement).closeCostAmount) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 float-right mb-2">
      <a-pagination
        v-model:current="page"
        v-model:pageSize="limit"
        :total="total"
        show-size-changer
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
      />
    </div>
  </div>
</template>
