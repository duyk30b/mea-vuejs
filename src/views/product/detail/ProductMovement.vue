<script setup lang="ts">
import { InputOptions, VueSelect } from '@/common/vue-form'
import {
  Product,
  ProductBatch,
  ProductBatchService,
  ProductMovement,
  ProductMovementService,
  ProductMovementType,
} from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { customFilter, timeToText } from '@/utils'
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const productMovements = ref<ProductMovement[]>([])
const productBatchAll = ref<ProductBatch[]>([])
const productBatchList = ref<ProductBatch[]>([])

const currentBatch = ref<ProductBatch>(ProductBatch.blank())
const productMovementType = ref<ProductMovementType>()

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchProductMovements = async () => {
  try {
    const movPagination = await ProductMovementService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        type: productMovementType.value != null ? productMovementType.value : undefined,
        productBatchId: currentBatch.value?.id ? currentBatch.value.id : undefined,
        productId: currentBatch.value?.id ? undefined : props.product.id,
      },
      relation: { productBatch: true, invoice: true, receipt: true },
      sort: { id: 'DESC' },
    })
    productMovements.value = movPagination.data
    total.value = movPagination.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:35 ~ error:', error)
  }
}

const startFetchProductBatches = async () => {
  try {
    const productBatches = await ProductBatchService.list({
      filter: { productId: props.product.id },
    })
    productBatchAll.value = productBatches
    productBatchList.value = productBatches
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:47 ~ error:', error)
  }
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) {
      await startFetchProductMovements()
      await startFetchProductBatches()
    } else productMovements.value = []
  },
  { immediate: true }
)

const selectBatch = async (data?: ProductBatch) => {
  currentBatch.value = ProductBatch.fromInstance(data || ProductBatch.blank())
  startFetchProductMovements()
}

const searchingBatch = async (text: string) => {
  currentBatch.value.id = 0
  if (text) {
    productBatchList.value = productBatchAll.value.filter((pr) => {
      const expiryDate = timeToText(pr.expiryDate, 'DD/MM/YYYY')
      return customFilter(pr.batch, text, 2) || customFilter(expiryDate, text, 1)
    })
  } else {
    productBatchList.value = [...productBatchAll.value]
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchProductMovements()
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
  <div class="flex gap-4 items-stretch">
    <div style="flex: 1">
      <span style="font-size: 0.8rem" class="whitespace-nowrap">Lô hàng</span>
      <div>
        <InputOptions
          v-model:searchText="currentBatch.batch"
          :options="productBatchList"
          :maxHeight="320"
          placeholder="Nhập tên lô hàng"
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
        v-model:value="productMovementType"
        allow-clear
        class="w-full"
        placeholder="Tất cả"
        @change="startFetchProductMovements"
      >
        <a-select-option :value="undefined"> Tất cả </a-select-option>
        <a-select-option :value="ProductMovementType.Receipt"> Nhập </a-select-option>
        <a-select-option :value="ProductMovementType.Invoice"> Xuất </a-select-option>
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
        <tr v-if="productMovements.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(mov, index) in productMovements" :key="index">
          <td>
            <div v-if="mov.type === ProductMovementType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(mov.invoice!.id)"> IV{{ mov.invoice!.id }} </a>
                <span class="ml-2">
                  <a-tag color="blue">{{ mov.invoice?.customer?.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(mov.invoice?.time, 'hh:mm DD/MM/YYYY') }}
                <span v-if="mov.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
            <div v-if="mov.type === ProductMovementType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(mov.receipt!.id)"> RC{{ mov.receipt!.id }} </a>
                <span class="ml-2">
                  <a-tag color="green">{{ mov.receipt?.distributor?.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(mov.createTime, 'hh:mm DD/MM/YYYY') }}
                <span v-if="mov.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
            <div style="white-space: nowrap">Lô: {{ mov.productBatch?.batch }}</div>
            <div style="white-space: nowrap">
              HSD: {{ timeToText(mov.productBatch?.expiryDate, 'DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div>Đầu kỳ: {{ mov.openQuantity }}</div>
            <div>
              <span v-if="mov.number > 0">Nhập: </span>
              <span v-if="mov.number < 0">Xuất: </span>
              <span class="font-bold">{{ mov.unitNumber }}</span>
              <span v-if="mov.unit.rate !== 1">{{ mov.unit.name }} ({{ mov.number }})</span>
            </div>
            <div>Cuối kỳ: {{ mov.closeQuantity }}</div>
            <div>Giá: {{ formatMoney(mov.price) }} / {{ product.unitBasicName }}</div>
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
  <div v-else class="table-wrapper mt-4">
    <table class="table">
      <thead>
        <tr>
          <th><a-tag color="blue"> K.Hàng </a-tag>- <a-tag color="green"> NCC </a-tag></th>
          <th>Lô</th>
          <th>SL trước</th>
          <th>Nhập/Xuất</th>
          <th>SL sau</th>
          <th>Giá</th>
          <th>T.Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovements.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(mov, index) in productMovements" :key="index">
          <td>
            <div v-if="mov.type === ProductMovementType.Invoice">
              <div>
                <a @click="openBlankInvoiceDetail(mov.invoice!.id)"> IV{{ mov.invoice!.id }} </a>
                <span class="ml-2">
                  <a-tag color="blue">{{ mov.invoice?.customer?.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(mov.invoice?.time, 'hh:mm DD/MM/YYYY') }}
                <span v-if="mov.isRefund">
                  <a-tag color="error">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Hoàn trả
                  </a-tag>
                </span>
              </div>
            </div>
            <div v-if="mov.type === ProductMovementType.Receipt">
              <div>
                <a @click="openBlankReceiptDetail(mov.receipt!.id)"> RC{{ mov.receipt!.id }} </a>
                <span class="ml-2">
                  <a-tag color="green">{{ mov.receipt?.distributor?.fullName }}</a-tag>
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(mov.createTime, 'hh:mm DD/MM/YYYY') }}
                <span v-if="mov.isRefund">
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
          <td>
            <div v-if="mov.productBatch?.batch" style="white-space: nowrap; font-size: 0.8rem">
              Lô: {{ mov.productBatch?.batch }}
            </div>
            <div style="white-space: nowrap; font-size: 0.8rem">
              HSD: {{ timeToText(mov.productBatch?.expiryDate, 'DD/MM/YYYY') }}
            </div>
          </td>
          <td class="text-center">
            {{ mov.openQuantity }}
          </td>
          <td class="text-center">
            <div>
              {{ mov.unitNumber }}
              <span v-if="mov.unit.rate !== 1">{{ mov.unit.name }} ({{ mov.number }})</span>
            </div>
          </td>
          <td class="text-center">
            {{ mov.closeQuantity }}
          </td>
          <td class="text-right">
            <div>
              {{ formatMoney(mov.unitPrice) }}
              <span v-if="mov.unit.rate !== 1">({{ formatMoney(mov.price) }})</span>
            </div>
          </td>
          <td class="text-right">
            {{ formatMoney(mov.totalMoney) }}
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
