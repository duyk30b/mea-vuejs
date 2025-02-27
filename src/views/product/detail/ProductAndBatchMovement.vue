<script setup lang="ts">
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { InputText, VueSelect } from '../../../common/vue-form'
import VueTag from '../../../common/VueTag.vue'
import { CONFIG } from '../../../config'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchApi } from '../../../modules/batch'
import { BatchMovementApi } from '../../../modules/batch-movement/batch-movement.api'
import type { BatchMovement } from '../../../modules/batch-movement/batch-movement.model'
import { MovementType } from '../../../modules/enum'
import { Product } from '../../../modules/product'
import { ProductMovementApi } from '../../../modules/product-movement/product-movement.api'
import type { ProductMovement } from '../../../modules/product-movement/product-movement.model'
import { timeToText } from '../../../utils'
import LinkAndStatusTicket from '../../customer/detail/LinkAndStatusTicket.vue'
import ReceiptStatusTag from '../../receipt/ReceiptStatusTag.vue'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const typeHistory = ref<'PRODUCT' | 'BATCH'>('PRODUCT')

const productMovementList = ref<ProductMovement[]>([])
const batchMovementList = ref<BatchMovement[]>([])
const batchAll = ref<Batch[]>([])
const batchList = ref<Batch[]>([])

const batchId = ref<number>(0)
const movementType = ref<MovementType>()

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchProductMovements = async () => {
  try {
    const { data, meta } = await ProductMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        movementType: movementType.value != null ? movementType.value : undefined,
        productId: props.product.id,
      },
      relation: {
        ticket: true,
        receipt: true,
        distributor: true,
        customer: true,
        user: true,
      },
      sort: { id: 'DESC' },
    })
    data.forEach((i) => (i.product = props.product))
    productMovementList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:53 ~ error:', error)
  }
}

const startFetchBatchMovements = async () => {
  try {
    const { data, meta } = await BatchMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        movementType: movementType.value != null ? movementType.value : undefined,
        productId: props.product.id,
        batchId: batchId.value ? batchId.value : undefined,
      },
      relation: {
        ticket: true,
        receipt: true,
        distributor: true,
        customer: true,
        user: true,
      },
      sort: { id: 'DESC' },
    })
    data.forEach((i) => (i.product = props.product))
    batchMovementList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:74 ~ error:', error)
  }
}

const startFetchData = async () => {
  if (typeHistory.value === 'PRODUCT') {
    await startFetchProductMovements()
  } else {
    await startFetchBatchMovements()
  }
}

const startFetchBatchList = async () => {
  try {
    const { data } = await BatchApi.list({
      filter: { productId: props.product.id },
      sort: { id: 'DESC' },
    })
    batchAll.value = data
    batchList.value = data
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:96 ~ error:', error)
  }
}

watch(
  () => [props.product.id, props.product.quantity],
  async (newValue) => {
    if (newValue) {
      await startFetchData()
    } else {
      productMovementList.value = []
      batchMovementList.value = []
    }
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

let loadedBatchList = false
const handleChangeTypeHistory = async (value: 'PRODUCT' | 'BATCH') => {
  await startFetchData()
  if (value === 'BATCH' && !loadedBatchList) {
    await startFetchBatchList()
    loadedBatchList = true
  }
}

const openBlankReceiptDetail = async (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-3 flex flex-wrap justify-end gap-4 items-stretch">
    <div style="flex-basis: 500px; flex-grow: 1">
      <span style="font-size: 0.8rem" class="whitespace-nowrap">Loại</span>
      <div class="flex">
        <div style="width: 180px">
          <VueSelect
            v-model:value="typeHistory"
            :options="[
              { value: 'PRODUCT', text: 'Xem sản phẩm' },
              { value: 'BATCH', text: 'Xem lô hàng' },
            ]"
            @selectItem="({ value }) => handleChangeTypeHistory(value)"></VueSelect>
        </div>
        <div style="flex-grow: 1">
          <InputText v-if="typeHistory === 'PRODUCT'" disabled :value="product.brandName" />
          <VueSelect
            v-if="typeHistory === 'BATCH'"
            v-model:value="batchId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...batchList.map((i) => ({
                value: i.id,
                text: `Lô ${i.id} - ${timeToText(i.expiryDate)} - (${i.quantity} ${
                  product.unitBasicName
                })`,
              })),
            ]"
            :maxHeight="260"
            placeholder="Chọn lô hàng"
            @selectItem="startFetchData"></VueSelect>
        </div>
      </div>
    </div>

    <div style="flex-basis: 300px; flex-grow: 1">
      <span style="font-size: 0.8rem">Loại</span>
      <div>
        <VueSelect
          v-model:value="movementType"
          placeholder="Tất cả"
          :options="[
            { value: null, text: 'Tất cả' },
            { value: MovementType.Receipt, text: 'Nhập hàng' },
            { value: MovementType.Ticket, text: 'Bán hàng' },
            { value: MovementType.UserChange, text: 'Người dùng sửa' },
          ]"
          @selectItem="startFetchData" />
      </div>
    </div>
  </div>
  <div v-if="isMobile" class="table-wrapper mt-2">
    <table v-if="typeHistory === 'PRODUCT'">
      <thead>
        <tr>
          <th>Phiếu</th>
          <th>Số lượng</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(productMovement, index) in productMovementList" :key="index">
          <td>
            <div v-if="productMovement.movementType === MovementType.Receipt">
              <div>
                {{ productMovement.distributor!.fullName }}
              </div>
              <div style="font-size: 0.8rem">
                <a @click="openBlankReceiptDetail(productMovement.voucherId)">
                  N{{ productMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="productMovement.receipt" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.Ticket">
              <div>
                {{ productMovement.customer!.fullName }}
              </div>
              <LinkAndStatusTicket :ticket="productMovement.ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.UserChange">
              <div>
                <VueTag bg-color="violet">{{ productMovement.user!.fullName }}</VueTag>
              </div>
              <div style="font-size: 0.8rem; font-style: italic">Sửa số lượng</div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div>
              <VueTag v-if="productMovement.isRefund" icon="minus" color="red">Hoàn trả</VueTag>
            </div>
          </td>
          <td>
            <div class="flex justify-between">
              <span v-if="productMovement.quantity > 0">Nhập:</span>
              <span v-if="productMovement.quantity < 0">Xuất:</span>
              <span class="font-bold">{{ productMovement.unitQuantity }}</span>
              <span v-if="productMovement.unitRate !== 1">
                &nbsp;{{ productMovement.unitName }} ({{ productMovement.quantity }}
                {{ product.unitBasicName }})
              </span>
            </div>
            <div class="flex justify-between">
              <span>Giá:</span>
              <span>
                {{ formatMoney(productMovement.unitActualPrice) }}
                <span v-if="productMovement.unitName">/ {{ productMovement.unitName }}</span>
              </span>
            </div>
            <div class="flex justify-between">
              <span>SL:</span>
              <span>{{ productMovement.openQuantity }} ➞ {{ productMovement.closeQuantity }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="typeHistory === 'BATCH'">
      <thead>
        <tr>
          <th>Phiếu</th>
          <th>Số lượng</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="batchMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(batchMovement, index) in batchMovementList" :key="index">
          <td>
            <div v-if="batchMovement.movementType === MovementType.Receipt">
              <div>
                {{ batchMovement.distributor!.fullName }}
              </div>
              <div style="font-size: 0.8rem">
                <a @click="openBlankReceiptDetail(batchMovement.voucherId)">
                  N{{ batchMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="batchMovement.receipt" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(batchMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="batchMovement.movementType === MovementType.Ticket">
              <div>
                {{ batchMovement.customer!.fullName }}
              </div>
              <LinkAndStatusTicket :ticket="batchMovement.ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(batchMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="batchMovement.movementType === MovementType.UserChange">
              <div>
                <VueTag bg-color="violet">{{ batchMovement.user!.fullName }}</VueTag>
              </div>
              <div style="font-size: 0.8rem; font-style: italic">Sửa số lượng</div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(batchMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div>
              <VueTag v-if="batchMovement.isRefund" icon="minus" color="red">Hoàn trả</VueTag>
            </div>
          </td>
          <td>
            <div class="flex justify-between">
              <span v-if="batchMovement.quantity > 0">Nhập:</span>
              <span v-if="batchMovement.quantity < 0">Xuất:</span>
              <span class="font-bold">{{ batchMovement.unitQuantity }}</span>
              <span v-if="batchMovement.unitRate !== 1">
                &nbsp;{{ batchMovement.unitName }} ({{ batchMovement.quantity }}
                {{ product.unitBasicName }})
              </span>
            </div>
            <div class="flex justify-between">
              <span>Giá:</span>
              <span>
                {{ formatMoney(batchMovement.unitActualPrice) }}
                <span v-if="batchMovement.unitName">/ {{ batchMovement.unitName }}</span>
              </span>
            </div>
            <div class="flex justify-between">
              <span>SL:</span>
              <span>{{ batchMovement.openQuantity }} ➞ {{ batchMovement.closeQuantity }}</span>
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
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
  <div v-if="!isMobile" class="table-wrapper mt-4">
    <table v-if="typeHistory === 'PRODUCT'">
      <thead>
        <tr>
          <th>Loại</th>
          <th>Tên</th>
          <th>Phiếu</th>
          <th>Thời gian</th>
          <th>Nhập/Xuất</th>
          <th>Tồn kho ({{ product.unitBasicName }})</th>
          <th v-if="CONFIG.MODE === 'development'">costPrice</th>
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(productMovement, index) in productMovementList" :key="index">
          <template v-if="productMovement.movementType === MovementType.Receipt">
            <td>Nhập</td>
            <td>{{ productMovement.distributor!.fullName }}</td>
            <td>
              <a
                style="font-size: 0.8rem"
                @click="openBlankReceiptDetail(productMovement.voucherId)">
                NH{{ productMovement.voucherId }}
              </a>
              <span class="ml-2">
                <ReceiptStatusTag :receipt="productMovement.receipt" />
              </span>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.Ticket">
            <td>Xuất</td>
            <td>{{ productMovement.customer!.fullName }}</td>
            <td>
              <LinkAndStatusTicket
                :ticket="productMovement.ticket!"
                :ticketId="productMovement.voucherId" />
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.UserChange">
            <td>Sửa</td>
            <td>
              <VueTag bg-color="violet">{{ productMovement.user!.fullName }}</VueTag>
            </td>
            <td></td>
          </template>

          <td>
            <div>
              {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <VueTag v-if="productMovement.isRefund" icon="minus" color="red">Hoàn trả</VueTag>
            </div>
          </td>
          <td class="text-center">
            <div>
              {{ (productMovement.quantity > 0 ? '+' : '') + productMovement.unitQuantity }}
              <span v-if="productMovement.unitRate !== 1">
                {{ productMovement.unitName }}
              </span>
            </div>
            <div v-if="productMovement.unitRate !== 1" class="text-xs">
              ({{ productMovement.quantity }} {{ product.unitBasicName }})
            </div>
          </td>
          <td class="text-center">
            {{ productMovement.openQuantity }} ➞ {{ productMovement.closeQuantity }}
          </td>
          <td v-if="CONFIG.MODE === 'development'" class="text-right">
            {{ formatMoney(productMovement.unitCostPrice) }}
            <span v-if="productMovement.unitRate !== 1">/ {{ productMovement.unitName }}</span>
          </td>
          <td class="text-right">
            <div
              v-if="productMovement.expectedPrice !== productMovement.actualPrice"
              style="
                font-size: 0.8rem;
                text-decoration: line-through;
                font-style: italic;
                white-space: nowrap;
                color: var(--text-red);
              ">
              {{ formatMoney(productMovement.unitExpectedPrice) }}
              <span v-if="productMovement.unitRate !== 1">/ {{ productMovement.unitName }}</span>
            </div>
            <div>
              {{ formatMoney(productMovement.unitActualPrice) }}
              <span v-if="productMovement.unitRate !== 1">/ {{ productMovement.unitName }}</span>
            </div>
            <div v-if="productMovement.unitRate !== 1" class="text-xs">
              ({{ formatMoney(productMovement.actualPrice) }} / {{ product.unitBasicName }})
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="typeHistory === 'BATCH'">
      <thead>
        <tr>
          <th>Loại</th>
          <th>Tên</th>
          <th>Phiếu</th>
          <th>Thời gian</th>
          <th>Nhập/Xuất</th>
          <th>Tồn kho ({{ product.unitBasicName }})</th>
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="batchMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(batchMovement, index) in batchMovementList" :key="index">
          <template v-if="batchMovement.movementType === MovementType.Receipt">
            <td>Nhập</td>
            <td>{{ batchMovement.distributor!.fullName }}</td>
            <td>
              <a style="font-size: 0.8rem" @click="openBlankReceiptDetail(batchMovement.voucherId)">
                NH{{ batchMovement.voucherId }}
              </a>
              <span class="ml-2">
                <ReceiptStatusTag :receipt="batchMovement.receipt" />
              </span>
            </td>
          </template>
          <template v-if="batchMovement.movementType === MovementType.Ticket">
            <td>Xuất</td>
            <td>{{ batchMovement.customer!.fullName }}</td>
            <td>
              <LinkAndStatusTicket
                :ticket="batchMovement.ticket!"
                :ticketId="batchMovement.voucherId" />
            </td>
          </template>
          <template v-if="batchMovement.movementType === MovementType.UserChange">
            <td>Sửa</td>
            <td>
              <VueTag bg-color="violet">{{ batchMovement.user!.fullName }}</VueTag>
            </td>
            <td></td>
          </template>
          <td>
            <div>
              {{ timeToText(batchMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <VueTag v-if="batchMovement.isRefund" icon="minus" color="red">Hoàn trả</VueTag>
            </div>
          </td>
          <td class="text-center">
            <div>
              {{ (batchMovement.quantity > 0 ? '+' : '') + batchMovement.unitQuantity }}
              <span v-if="batchMovement.unitRate !== 1">
                {{ batchMovement.unitName }}
              </span>
            </div>
            <div v-if="batchMovement.unitRate !== 1" class="text-xs">
              ({{ batchMovement.quantity }} {{ product.unitBasicName }})
            </div>
          </td>
          <td class="text-center">
            {{ batchMovement.openQuantity }} ➞ {{ batchMovement.closeQuantity }}
          </td>
          <td class="text-right">
            <div
              v-if="batchMovement.expectedPrice !== batchMovement.actualPrice"
              style="
                font-size: 0.8rem;
                text-decoration: line-through;
                font-style: italic;
                white-space: nowrap;
                color: var(--text-red);
              ">
              {{ formatMoney(batchMovement.unitExpectedPrice) }}
              <span v-if="batchMovement.unitRate !== 1">/ {{ batchMovement.unitName }}</span>
            </div>
            <div>
              {{ formatMoney(batchMovement.unitActualPrice) }}
              <span v-if="batchMovement.unitRate !== 1">/ {{ batchMovement.unitName }}</span>
            </div>
            <div v-if="batchMovement.unitRate !== 1" class="text-xs">
              ({{ formatMoney(batchMovement.actualPrice) }} / {{ product.unitBasicName }})
            </div>
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
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
