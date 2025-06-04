<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VuePagination from '../../../common/VuePagination.vue'
import VueTag from '../../../common/VueTag.vue'
import { VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { MovementType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product } from '../../../modules/product'
import { ProductMovementApi } from '../../../modules/product-movement/product-movement.api'
import type { ProductMovement } from '../../../modules/product-movement/product-movement.model'
import { timeToText } from '../../../utils'
import ReceiptStatusTag from '../../receipt/ReceiptStatusTag.vue'
import StockCheckStatusTag from '../../stock-check/StockCheckStatusTag.vue'
import LinkAndStatusTicket from '../../ticket-base/LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const meStore = useMeStore()
const { permissionIdMap } = meStore

const productMovementList = ref<ProductMovement[]>([])

const movementType = ref<MovementType>()

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
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
        stockCheck: true,
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

watch(
  () => [props.product.id, props.product.quantity],
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
    localStorage.setItem('PRODUCT_MOVEMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const openBlankReceiptDetail = async (voucherId: number) => {
  const route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: voucherId },
  })
  window.open(route.href, '_blank')
}

const openBlankStockCheckDetail = async (voucherId: number) => {
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
          :options="[
            { value: null, text: 'Tất cả' },
            { value: MovementType.Receipt, text: 'Nhập hàng' },
            { value: MovementType.Ticket, text: 'Bán hàng' },
            { value: MovementType.UserChange, text: 'Người dùng sửa' },
            { value: MovementType.StockCheck, text: 'Kiểm hàng' },
          ]"
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
            <div v-if="productMovement.movementType === MovementType.Receipt">
              <div>
                {{ productMovement.distributor!.fullName }}
              </div>
              <div style="font-size: 0.8rem">
                <a @click="openBlankReceiptDetail(productMovement.voucherId)">
                  NH{{ productMovement.voucherId }}
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
              <span class="font-bold">{{ productMovement.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span>Giá:</span>
              <span>{{ formatMoney(productMovement.actualPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span>SL:</span>
              <span>{{ productMovement.openQuantity }} ➞ {{ productMovement.closeQuantity }}</span>
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
          <th v-if="permissionIdMap[PermissionId.READ_COST_PRICE]">Vốn</th>
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovementList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(productMovement, index) in productMovementList" :key="index">
          <template v-if="productMovement.movementType === MovementType.Receipt">
            <td>Nhập hàng</td>
            <td>
              <div>{{ productMovement.distributor!.fullName }}</div>
              <div v-if="productMovement.isRefund">
                <VueTag icon="minus" color="red">Hoàn trả</VueTag>
              </div>
            </td>
            <td>
              <div>
                <a
                  style="font-size: 0.8rem"
                  @click="openBlankReceiptDetail(productMovement.voucherId)"
                >
                  NH{{ productMovement.voucherId }}
                </a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="productMovement.receipt" />
                </span>
              </div>
              <div>{{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.Ticket">
            <td>Xuất hàng</td>
            <td>
              <div>{{ productMovement.customer!.fullName }}</div>
              <div v-if="productMovement.isRefund">
                <VueTag icon="minus" color="red">Hoàn trả</VueTag>
              </div>
            </td>
            <td>
              <div>
                <LinkAndStatusTicket
                  :ticket="productMovement.ticket!"
                  :ticketId="productMovement.voucherId"
                />
              </div>
              <div>{{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
          </template>
          <template v-if="productMovement.movementType === MovementType.UserChange">
            <td>Sửa</td>
            <td>
              <VueTag bg-color="violet">{{ productMovement.user!.fullName }}</VueTag>
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
              <div>{{ productMovement.user!.fullName }}</div>
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
          <td class="text-center">B{{ productMovement.batchId }}</td>
          <td class="text-center">
            {{ (productMovement.quantity > 0 ? '+' : '') + productMovement.quantity }}
          </td>
          <td class="text-center">
            {{ productMovement.openQuantity }} ➞ {{ productMovement.closeQuantity }}
          </td>
          <td v-if="permissionIdMap[PermissionId.READ_COST_PRICE]" class="text-right">
            {{
              (productMovement.costAmount > 0 ? '+' : '') + formatMoney(productMovement.costAmount)
            }}
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
  </div>
</template>
