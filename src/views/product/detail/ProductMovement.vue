<script setup lang="ts">
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { InputOptions } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Batch, BatchApi } from '../../../modules/batch'
import { MovementType } from '../../../modules/enum'
import type { BatchMovement } from '../../../modules/movement/bat-movement.model'
import { MovementApi } from '../../../modules/movement/movement.api'
import type { ProductMovement } from '../../../modules/movement/product-movement.model'
import { Product } from '../../../modules/product'
import { customFilter, timeToText } from '../../../utils'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const movements = ref<ProductMovement[] | BatchMovement[]>([])
const batchAll = ref<Batch[]>([])
const batchList = ref<Batch[]>([])

const currentBatch = ref<Batch>(Batch.blank())
const movementType = ref<MovementType>()

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchProductMovements = async () => {
  try {
    const { data, meta } = await MovementApi.paginationProduct({
      page: page.value,
      limit: limit.value,
      filter: {
        type: movementType.value != null ? movementType.value : undefined,
        productId: currentBatch.value?.id ? undefined : props.product.id,
      },
      relation: { invoice: true, receipt: true },
      sort: { id: 'DESC' },
    })
    movements.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:35 ~ error:', error)
  }
}

const startFetchBatchMovements = async () => {
  try {
    const { data, meta } = await MovementApi.paginationBatch({
      page: page.value,
      limit: limit.value,
      filter: {
        type: movementType.value != null ? movementType.value : undefined,
        productId: props.product.id,
        batchId: currentBatch.value.id,
      },
      relation: { invoice: true, receipt: true },
      sort: { id: 'DESC' },
    })
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
          v-model:searchText="currentBatch.lotNumber"
          :options="batchList"
          :maxHeight="320"
          placeholder="Chọn lô hàng"
          @selectItem="selectBatch"
          @update:searchText="searchingBatch"
        >
          <template #each="{ item: { batch, expiryDate, quantity } }">
            <div>
              <b>{{ batch }}</b> {{ timeToText(expiryDate) }} - ({{ quantity }}
              {{ product.unitBasicName }})
            </div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div style="flex: 1">
      <span style="font-size: 0.8rem">Chọn loại</span>
      <a-select
        v-model:value="movementType"
        allow-clear
        class="w-full"
        placeholder="Tất cả"
        @change="startFetchMovements"
      >
        <a-select-option :value="undefined"> Tất cả </a-select-option>
        <a-select-option :value="MovementType.Receipt"> Nhập </a-select-option>
        <a-select-option :value="MovementType.Invoice"> Xuất </a-select-option>
      </a-select>
    </div>
  </div>
  <div v-if="isMobile">
    <table class="table-mobile mt-2">
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
            <div v-if="movement.type === MovementType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(movement.invoice!.id)">
                  IV{{ movement.invoice!.id }}
                </a>
              </div>
              <div>
                <a-tag color="blue">{{ movement.invoice?.customer?.fullName }}</a-tag>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.invoice?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="movement.type === MovementType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(movement.receipt!.id)">
                  RC{{ movement.receipt!.id }}
                </a>
              </div>
              <div>
                <a-tag color="green">{{ movement.receipt?.distributor?.fullName }}</a-tag>
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
            <div>
              <span v-if="movement.quantity > 0">Nhập: </span>
              <span v-if="movement.quantity < 0">Xuất: </span>
              <span class="font-bold"> {{ movement.unitQuantity }} </span>
              <span v-if="movement.unit.rate !== 1">
                &nbsp;{{ movement.unit.name }} ({{ movement.quantity }} {{ product.unitBasicName }})
              </span>
            </div>
            <div>
              Giá: {{ formatMoney(movement.price * movement.unit.rate) }} / {{ movement.unit.name }}
            </div>
            <div>SL: {{ movement.openQuantity }} ➞ {{ movement.closeQuantity }}</div>
            <div>
              Vốn: {{ formatMoney(movement.openCostAmount) }} ➞
              {{ formatMoney(movement.closeCostAmount) }}
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
    <table class="table">
      <thead>
        <tr>
          <th><a-tag color="blue"> K.Hàng </a-tag>- <a-tag color="green"> NCC </a-tag></th>
          <th>Nhập/Xuất</th>
          <th>SL ({{ product.unitBasicName }})</th>
          <th>Giá</th>
          <th>Vốn</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="movements.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(movement, index) in movements" :key="index">
          <td>
            <div v-if="movement.type === MovementType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(movement.invoice!.id)">
                  IV{{ movement.invoice!.id }}
                </a>
                <span class="ml-2">
                  <a-tag color="blue">{{ movement.invoice?.customer?.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(movement.invoice?.startedAt, 'hh:mm DD/MM/YYYY') }}
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
            <div v-if="movement.type === MovementType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(movement.receipt!.id)">
                  RC{{ movement.receipt!.id }}
                </a>
                <span class="ml-2">
                  <a-tag color="green">{{ movement.receipt?.distributor?.fullName }}</a-tag>
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
              <span v-if="movement.unit.rate !== 1">
                {{ movement.unit.name }}
              </span>
            </div>
            <div v-if="movement.unit.rate !== 1" class="text-xs">
              ({{ movement.quantity }} {{ product.unitBasicName }})
            </div>
          </td>
          <td class="text-center">{{ movement.openQuantity }} ➞ {{ movement.closeQuantity }}</td>
          <td class="text-right">
            <div>
              {{ formatMoney(movement.unitPrice) }}
              <span v-if="movement.unit.rate !== 1"> / {{ movement.unit.name }} </span>
            </div>
            <div v-if="movement.unit.rate !== 1" class="text-xs">
              ({{ formatMoney(movement.price) }} / {{ product.unitBasicName }})
            </div>
          </td>
          <td class="text-center">
            {{ formatMoney(movement.openCostAmount) }} ➞ {{ formatMoney(movement.closeCostAmount) }}
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
