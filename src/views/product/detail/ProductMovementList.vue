<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { InputCheckbox, VueSelect } from '@/common/vue-form'
import type { VueSelectOption } from '@/common/vue-form/VueSelect.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Product } from '@/modules/product'
import { ProductMovementApi } from '@/modules/product-movement/product-movement.api'
import {
  MovementType,
  MovementTypeText,
  type ProductMovement,
} from '@/modules/product-movement/product-movement.model'
import { ESTypescript, timeToText } from '@/utils'
import PurchaseOrderStatusTag from '@/views/purchase-order/PurchaseOrderStatusTag.vue'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import StockCheckStatusTag from '@/views/stock-check/StockCheckStatusTag.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { userPermission } = MeService

const showAllInformation = ref(CONFIG.MODE === 'development')
const productMovementList = ref<ProductMovement[]>([])

const movementType = ref<MovementType>(MovementType.Unknown)
const movementTypeOptions: VueSelectOption<MovementType>[] = ESTypescript.keysEnum(
  MovementType,
).map((key) => ({
  value: MovementType[key],
  text: MovementTypeText[MovementType[key]],
}))

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await ProductMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        movementType: movementType.value ? movementType.value : undefined,
        productId: props.product.id,
      },
      relation: {
        ticket: true,
        purchaseOrder: true,
        stockCheck: true,
        distributor: true,
        customer: true,
        user: true,
      },
      sort: { id: 'DESC' },
    })
    productMovementList.value = paginationResponse.productMovementList
    total.value = paginationResponse.total

    productMovementList.value.forEach((i) => (i.product = props.product))
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:53 ~ error:', error)
  }
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) {
      await startFetchData()
    } else {
      productMovementList.value = []
    }
  },
  { immediate: true },
)

watch(
  () => props.product.quantity,
  async (newValue) => {
    if (newValue) {
      await startFetchData()
    } else {
      productMovementList.value = []
    }
  },
  { immediate: true },
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

const openBlankPurchaseOrderDetail = async (voucherId: string) => {
  const route = router.resolve({
    name: 'PurchaseOrderDetailContainer',
    params: { id: voucherId },
  })
  window.open(route.href, '_blank')
}

const openBlankStockCheckDetail = async (voucherId: string) => {
  const route = router.resolve({
    name: 'StockCheckDetail',
    params: { id: voucherId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-3 flex flex-wrap justify-end gap-4 items-stretch">
    <div style="flex-basis: 300px; flex-grow: 1">
      <span style="font-size: 0.8rem">Loại</span>
      <div>
        <VueSelect
          v-model:value="movementType"
          placeholder="Tất cả"
          :options="movementTypeOptions"
          @selectItem="startFetchData"
        />
      </div>
    </div>
  </div>
  <div v-if="isMobile" class="table-wrapper mt-2">
    <table>
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
            <div v-if="productMovement.movementType === MovementType.PurchaseOrder">
              <div>
                {{ productMovement.distributor?.fullName }}
              </div>
              <div style="font-size: 0.8rem">
                <a @click="openBlankPurchaseOrderDetail(productMovement.voucherId)">
                  NH{{ productMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <PurchaseOrderStatusTag :purchaseOrder="productMovement.purchaseOrder" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.Ticket">
              <div>
                {{ productMovement.customer?.fullName }}
              </div>
              <TicketLink :ticket="productMovement.ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.UserChange">
              <div>
                <VueTag bg-color="violet">{{ productMovement.user?.fullName }}</VueTag>
              </div>
              <div style="font-size: 0.8rem; font-style: italic">Sửa số lượng</div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.StockCheck">
              <div>
                <VueTag bg-color="violet">{{ productMovement.user?.fullName }}</VueTag>
              </div>
              <div style="font-size: 0.8rem; font-style: italic">Kiểm hàng</div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </div>
            <div v-if="productMovement.movementType === MovementType.Excel">
              <div>
                <VueTag bg-color="#1890ff">{{ productMovement.user?.fullName }}</VueTag>
              </div>
              <div style="font-size: 0.8rem; font-style: italic">Excel</div>
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
              <span class="font-bold">{{ productMovement.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span>Giá:</span>
              <span>{{ formatMoney(productMovement.actualPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span>SL:</span>
              <span>
                {{ productMovement.openQuantityProduct }} ➞
                {{ productMovement.closeQuantityProduct }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="!isMobile" class="table-wrapper mt-4">
    <table>
      <thead>
        <tr>
          <th>Loại</th>
          <th>Tên</th>
          <th>Phiếu</th>
          <th>Lô</th>
          <th>Nhập/Xuất</th>
          <th>Tồn kho</th>
          <th>Giá</th>
          <th v-if="showAllInformation">Giá Vốn</th>
          <th v-if="showAllInformation">Tồn Lô</th>
          <th v-if="showAllInformation">Tồn Vốn</th>
          <th v-if="showAllInformation">N/X Vốn</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(productMovement, index) in productMovementList" :key="index">
          <template v-if="productMovement.movementType === MovementType.PurchaseOrder">
            <td>Nhập hàng</td>
            <td>
              <div>{{ productMovement.distributor?.fullName }}</div>
              <div v-if="productMovement.isRefund">
                <VueTag icon="minus" color="red">Hoàn trả</VueTag>
              </div>
            </td>
            <td>
              <div>
                <a
                  style="font-size: 0.8rem"
                  @click="openBlankPurchaseOrderDetail(productMovement.voucherId)"
                >
                  NH{{ productMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <PurchaseOrderStatusTag :purchaseOrder="productMovement.purchaseOrder" />
                </span>
              </div>
              <div>{{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.Ticket">
            <td>Xuất hàng</td>
            <td>
              <div>{{ productMovement.customer?.fullName }}</div>
              <div v-if="productMovement.isRefund">
                <VueTag icon="minus" color="red">Hoàn trả</VueTag>
              </div>
            </td>
            <td>
              <div>
                <TicketLink :ticket="productMovement.ticket!" />
              </div>
              <div>{{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.UserChange">
            <td>Sửa</td>
            <td>
              <VueTag bg-color="violet">{{ productMovement.user?.fullName }}</VueTag>
            </td>
            <td>
              <div>
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.StockCheck">
            <td>Kiểm hàng</td>
            <td>
              <VueTag bg-color="violet">{{ productMovement.user?.fullName }}</VueTag>
            </td>
            <td>
              <div>
                <a
                  style="font-size: 0.8rem"
                  @click="openBlankStockCheckDetail(productMovement.voucherId)"
                >
                  SC{{ productMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <StockCheckStatusTag :stockCheck="productMovement.stockCheck" />
                </span>
              </div>
              <div>{{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.Excel">
            <td>Excel</td>
            <td>
              <VueTag bg-color="#1890ff">{{ productMovement.user?.fullName }}</VueTag>
            </td>
            <td>
              <div>
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
          </template>
          <td class="text-center">B{{ productMovement.batchId }}</td>
          <td class="text-center">
            {{ (productMovement.quantity > 0 ? '+' : '') + productMovement.quantity }}
          </td>
          <td class="text-center">
            {{ productMovement.openQuantityProduct }} ➞ {{ productMovement.closeQuantityProduct }}
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
              "
            >
              {{ formatMoney(productMovement.expectedPrice) }}
            </div>
            <div>
              {{ formatMoney(productMovement.actualPrice) }}
            </div>
          </td>
          <td v-if="showAllInformation" class="text-center">
            {{
              formatMoney(
                Math.round(
                  productMovement.openCostAmountBatch / (productMovement.openQuantityBatch || 1),
                ),
              )
            }}
            ➞
            {{
              formatMoney(
                Math.round(
                  productMovement.closeCostAmountBatch / (productMovement.closeQuantityBatch || 1),
                ),
              )
            }}
          </td>
          <td v-if="showAllInformation" class="text-center">
            {{ productMovement.openQuantityBatch }} ➞ {{ productMovement.closeQuantityBatch }}
          </td>
          <td v-if="showAllInformation" class="text-center">
            {{ formatMoney(productMovement.openCostAmountBatch) }} ➞
            {{ formatMoney(productMovement.closeCostAmountBatch) }}
          </td>
          <td v-if="showAllInformation" class="text-right">
            {{
              (productMovement.costAmount > 0 ? '+' : '') + formatMoney(productMovement.costAmount)
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-4 flex flex-wrap justify-between">
    <div>
      <InputCheckbox v-model:value="showAllInformation" label="Hiện đầy đủ thông tin" />
    </div>
    <div class="">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
