<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight, IconSetting, IconSisternode } from '@/common/icon-antd'
import {
  InputCheckbox,
  InputFilter,
  InputHint,
  InputMoney,
  InputNumber,
  InputRadio,
  InputSelect,
  InputText,
  VueSwitch,
} from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store.ts'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service.ts'
import { useSettingStore } from '@/modules/_me/setting.store.ts'
import { Discount, DiscountInteractType } from '@/modules/discount'
import {
  ProductType,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
  type UnitType,
} from '@/modules/enum.ts'
import { PermissionId } from '@/modules/permission/permission.enum.ts'
import { Position, PositionInteractType } from '@/modules/position'
import { Product, ProductService } from '@/modules/product'
import { ProductGroup, ProductGroupService } from '@/modules/product-group'
import { Role, RoleService } from '@/modules/role'
import type { Warehouse } from '@/modules/warehouse'
import { WarehouseService } from '@/modules/warehouse/warehouse.service.ts'
import { customFilter, ESTimer } from '@/utils'
import DiscountTableAction from '@/views/master-data/discount/common/DiscountTableAction.vue'
import PositionTableAction from '@/views/user/position/common/PositionTableAction.vue'
import { computed, onMounted, ref } from 'vue'
import ModalDataProduct from '../list/ModalDataProduct.vue'
import ModalProductUpsertSettingScreen from './ModalProductUpsertSettingScreen.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  WAREHOUSE_AND_BATCH: 'WAREHOUSE_AND_BATCH',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const modalProductUpsertSettingScreen = ref<InstanceType<typeof ModalProductUpsertSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()

const emit = defineEmits<{
  (e: 'success', value: Product, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { isMobile, formatMoney } = settingStore
const { userPermission } = MeService

const productOrigin = ref(Product.blank())
const product = ref(Product.blank())
const productGroupOptions = ref<{ text: string; value: number; data: ProductGroup }[]>([])
const unit = ref<UnitType[]>([{ name: '', rate: 1, default: true }])

const warehouseAll = ref<Warehouse[]>([])
const warehouseMap = ref<Record<string, Warehouse>>({})

const showModal = ref(false)
const saveLoading = ref(false)

const warehouseIdSelect = ref<Record<string, boolean>>({})

const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])
const activeTab = ref(TABS_KEY.BASIC)
const randomId = computed(() => Math.random().toString(36).substring(2))

const hasInitQuantity = ref(false)

const hasChangeData = computed(() => {
  // hơi phức tạp, tạm thời bỏ logic này
  // if (!Product.equal(product.value, productOrigin.value)) {
  //   return true
  // }
  // if (
  //   !Commission.equalList(
  //     (product.value.positionList || []).filter((i) => !!i.roleId),
  //     productOrigin.value.positionList || []
  //   )
  // ) {
  //   return true
  // }
  return false
})

onMounted(async () => {
  try {
    warehouseAll.value = await WarehouseService.list({})
    warehouseMap.value = await WarehouseService.getMap()

    const productGroupAll = await ProductGroupService.list({})
    productGroupOptions.value = productGroupAll.map((i) => ({
      value: i.id,
      text: i.name,
      data: i,
    }))

    const roleAll = await RoleService.list({})
    roleOptions.value = roleAll.map((i) => ({ value: i.id, text: i.name, data: i }))
  } catch (error) {
    console.log('🚀 ~ ModalProductUpsert.vue:104 ~ onMounted ~ error:', error)
  }
})

const splitBatchByWarehouseOptions = [
  { value: SplitBatchByWarehouse.Inherit, label: '-' },
  { value: SplitBatchByWarehouse.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByWarehouse.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByWarehouseOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByWarehouse) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const splitBatchByDistributorOptions = [
  { value: SplitBatchByDistributor.Inherit, label: '-' },
  { value: SplitBatchByDistributor.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByDistributor.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByDistributorOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByDistributor) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const splitBatchByExpiryDateOptions = [
  { value: SplitBatchByExpiryDate.Inherit, label: '-' },
  { value: SplitBatchByExpiryDate.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByExpiryDate.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByExpiryDateOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByExpiryDate) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const splitBatchByCostPriceOptions = [
  { value: SplitBatchByCostPrice.Inherit, label: '-' },
  {
    value: SplitBatchByCostPrice.OverrideAndMAC,
    label: 'Ghi đè giá nhập cũ, giá vốn sử dụng công thức tính bình quân gia quyền',
  },
  { value: SplitBatchByCostPrice.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByCostPriceOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByCostPrice) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const handleAddPosition = () => {
  const positionBlank = Position.blank()
  positionBlank.positionType = PositionInteractType.Product
  positionBlank.positionInteractId = product.value.id

  product.value.positionList!.push(positionBlank)
}

const openModal = async (productId?: number, options?: { hasInitQuantity?: boolean }) => {
  showModal.value = true
  hasInitQuantity.value = !!options?.hasInitQuantity

  if (!productId) {
    productOrigin.value = Product.blank()
    product.value = Product.blank()
    unit.value = [{ name: '', rate: 1, default: true }]
  } else {
    try {
      const productFetch = await ProductService.detail(
        productId,
        { relation: { positionList: true, discountList: true } },
        { query: true },
      )
      productOrigin.value = Product.from(productFetch)
      product.value = productFetch
    } catch (error) {
      productOrigin.value = Product.blank()
    }

    try {
      let unitParse: UnitType[] = JSON.parse(
        product.value.unit || JSON.stringify([{ name: '', rate: 1, default: true }]),
      )
      if (!Array.isArray(unitParse) || !unitParse.length) {
        unitParse = [{ name: '', rate: 1, default: true }]
      }
      unit.value = unitParse
    } catch (error) {
      unit.value = [{ name: '', rate: 1, default: true }]
    }
  }
  if (product.value.positionList?.length == 0) {
    handleAddPosition()
  }

  try {
    const warehouseIdList: number[] = JSON.parse(product.value.warehouseIds)
    warehouseIdList.forEach((id) => {
      warehouseIdSelect.value[id] = true
    })
  } catch (error) {
    warehouseIdSelect.value = { '0': true }
  }
}

const handleAddUnit = () => {
  unit.value.push({ name: '', rate: Math.pow(10, unit.value.length) })
}

const handleChangeUnitDefault = (e: Event, index: number) => {
  const value = (e.target as HTMLInputElement).checked
  unit.value.forEach((u, i) => {
    if (i === index && value) u.default = true
    else delete u.default
  })
}

const closeModal = () => {
  showModal.value = false
  product.value = Product.blank()
  productOrigin.value = Product.blank()
  warehouseIdSelect.value = {}
}

const handleChangeSelectWarehouse = (e: Event, warehouseId: number) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    warehouseIdSelect.value[warehouseId] = true
    warehouseIdSelect.value['0'] = false
  } else {
    warehouseIdSelect.value[warehouseId] = false
  }
}

const handleChangeSelectWarehousePrime = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    warehouseIdSelect.value = { '0': true }
  } else {
    warehouseIdSelect.value = {}
  }
}

const handleChangeSelectNoWarehouse = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    warehouseIdSelect.value = {}
  } else {
    warehouseIdSelect.value = { '0': true }
  }
}

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(
    product.value.discountList || [],
    productOrigin.value.discountList || [],
  )
})

const hasChangePositionList = computed(() => {
  return !Position.equalList(
    (product.value.positionList || []).filter((i) => !!i.roleId),
    productOrigin.value.positionList || [],
  )
})

const handleSave = async () => {
  saveLoading.value = true
  let warehouseIdList = Object.entries(warehouseIdSelect.value)
    .filter(([key, value]) => value)
    .map(([key, value]) => Number(key))

  product.value.warehouseIds = JSON.stringify(warehouseIdList)
  product.value.unit = JSON.stringify(unit.value)

  try {
    if (!product.value.id) {
      const data = await ProductService.createOne({
        product: product.value,
        discountList: hasChangeDiscountList.value ? product.value.discountList : undefined,
        positionList: hasChangePositionList.value ? product.value.positionList : undefined,
      })
      emit('success', data, 'CREATE')
      closeModal()
    } else {
      const response = await ProductService.updateOne(product.value.id, {
        product: product.value,
        discountList: hasChangeDiscountList.value ? product.value.discountList : undefined,
        positionList: hasChangePositionList.value ? product.value.positionList : undefined,
      })
      if (response.success) {
        emit('success', response.data.product, 'UPDATE')
        closeModal()
      } else {
        ModalStore.alert({
          title: 'Không thể cập nhật kho hàng quản lý',
          content: response.data.batchError.map((batch) => {
            const timeString = ESTimer.timeToText(batch.expiryDate)
            const warehouseName = warehouseMap.value[batch.warehouseId]?.name || ''
            return (
              `- S.Lô ${batch.lotNumber} - HSD ${timeString} ` +
              `- đang được quản lý bởi "${warehouseName}". ` +
              `Bắt buộc phải chọn "${warehouseName}" hoặc chọn "Tất cả kho"`
            )
          }),
        })
      }
    }
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:66 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  if (product.value.quantity != 0) {
    return ModalStore.alert({
      title: 'Không thể xóa sản phẩm có số lượng > 0',
      content: [
        '- Nếu bắt buộc phải xoá, bạn cần phải hủy bỏ tất cả các phiếu nhập hàng đã từng nhập sản phẩm này',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa sản phẩm này',
    content: 'Sản phẩm đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await ProductService.destroyOne(product.value.id)
        if (response.success) {
          emit('success', product.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa sản phầm khi đã được nhập hàng hoặc bán hàng',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu nhập hàng và phiếu bán hàng trước',
              `- Phiếu nhập hàng liên quan ${response.data.receiptItemList
                .map((i) => i.receiptId)
                .join(', ')}`,
              `- Phiếu bán hàng liên quan ${response.data.ticketProductList
                .map((i) => i.ticketId)
                .join(', ')}`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalProductUpsert.vue:139 ~ handleDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span v-if="!product.id">Thêm sản phẩm</span>
          <span v-if="product.id">Sửa sản phẩm</span>
        </div>
        <div
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDataProduct?.openModal()"
        >
          <IconSisternode />
        </div>
        <div
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalProductUpsertSettingScreen?.openModal()"
        >
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.WAREHOUSE_AND_BATCH">Kho và lô</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.DISCOUNT">Khuyến mại</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_POSITION">Vai trò và hoa hồng</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.BASIC">
              <div class="mt-4 flex flex-wrap gap-4">
                <div style="flex-grow: 1; flex-basis: 400px">
                  <div class="">Tên sản phẩm</div>
                  <div class="">
                    <InputText v-model:value="product.brandName" required />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 150px">
                  <div class="">Mã sản phẩm</div>
                  <div class="">
                    <InputText v-model:value="product.productCode" placeholder="Tạo tự động" />
                  </div>
                </div>

                <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.substance" class="grow basis-[600px]">
                  <div class="">Hoạt chất</div>
                  <div class="">
                    <InputText v-model:value="product.substance" />
                  </div>
                </div>

                <div
                  v-if="settingStore.SCREEN_PRODUCT_UPSERT.unit"
                  :class="unit.length === 1 ? 'basis-[300px]' : 'basis-[600px]'"
                  class="grow"
                >
                  <div class="">Đơn vị</div>
                  <div class="">
                    <div v-if="unit.length === 1">
                      <InputHint
                        v-model:value="unit[0].name"
                        :options="settingStore.PRODUCT_UNIT"
                        :logic-filter="(item: string, text: string) => customFilter(item, text)"
                      />
                    </div>
                    <div v-else class="mt-2">
                      <table style="width: 100%">
                        <tbody>
                          <tr>
                            <td colspan="2"><small>Đơn vị cơ bản</small></td>
                            <td style="padding-left: 12px"><small>Mặc định</small></td>
                          </tr>
                          <tr>
                            <td colspan="2">
                              <InputHint
                                v-model:value="unit[0].name"
                                required
                                :options="settingStore.PRODUCT_UNIT"
                                :logic-filter="
                                  (item: string, text: string) => customFilter(item, text)
                                "
                              />
                            </td>
                            <td style="padding-left: 12px">
                              <InputCheckbox
                                :checked="!!unit[0].default"
                                @change="(e: Event) => handleChangeUnitDefault(e, 0)"
                              ></InputCheckbox>
                            </td>
                          </tr>
                          <tr>
                            <td><small>Đơn vị phụ</small></td>
                            <td><small>Quy đổi ra đơn vị cơ bản</small></td>
                            <td></td>
                          </tr>
                          <tr v-for="(item, index) in unit" :key="index" class="py-2">
                            <template v-if="index > 0">
                              <td style="width: 30%; padding: 0 10px 8px 0">
                                <InputHint
                                  v-model:value="unit[index].name"
                                  required
                                  :options="settingStore.PRODUCT_UNIT"
                                  :logic-filter="
                                    (item: string, text: string) => customFilter(item, text)
                                  "
                                />
                              </td>
                              <td style="padding: 0 0 8px 0">
                                <InputNumber
                                  v-model:value="unit[index].rate"
                                  :append="unit[0].name"
                                  :disabled="index == 0"
                                />
                              </td>
                              <td style="padding: 0 12px 8px 12px">
                                <div class="flex flex-nowrap justify-between items-center">
                                  <InputCheckbox
                                    :checked="!!unit[index].default"
                                    @change="(e: Event) => handleChangeUnitDefault(e, index)"
                                  ></InputCheckbox>
                                  <a style="color: var(--text-red)" @click="unit.splice(index, 1)">
                                    Xóa
                                  </a>
                                </div>
                              </td>
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div><a @click="handleAddUnit">Thêm đơn vị</a></div>
                  </div>
                </div>

                <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.group" class="grow basis-[300px]">
                  <div class="">Nhóm</div>
                  <div>
                    <InputFilter
                      v-model:value="product.productGroupId"
                      :options="productGroupOptions"
                      :maxHeight="200"
                    />
                  </div>
                </div>

                <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.route" class="grow basis-[40%]">
                  <div class="">Đường dùng</div>
                  <div>
                    <InputHint
                      v-model:value="product.route"
                      :options="settingStore.PRODUCT_ROUTE"
                      :logic-filter="(item: string, text: string) => customFilter(item, text)"
                    />
                  </div>
                </div>

                <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.source" class="grow basis-[40%]">
                  <div class="">Nguồn gốc</div>
                  <div class="">
                    <InputText v-model:value="product.source" />
                  </div>
                </div>

                <div
                  v-if="settingStore.SCREEN_PRODUCT_UPSERT.hintUsage"
                  style="flex-basis: 600px; flex-grow: 1"
                  class=""
                >
                  <div class="">Cách sử dụng</div>
                  <div>
                    <InputHint
                      v-model:value="product.hintUsage"
                      :options="settingStore.PRODUCT_HINT_USAGE"
                      :logic-filter="(item: string, text: string) => customFilter(item, text)"
                    />
                  </div>
                </div>

                <template v-if="hasInitQuantity">
                  <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                    <div class="font-bold italic">
                      <IconDoubleRight />
                      Khởi tạo số lượng ban đầu
                    </div>
                    <div class="">
                      <InputMoney
                        :disabled="!!product.id"
                        v-model:value="product.quantity"
                        :prepend="product.unitDefaultName"
                      />
                    </div>
                  </div>
                </template>
                <div
                  v-if="userPermission[PermissionId.PRODUCT_READ_COST_PRICE]"
                  style="flex-grow: 1; flex-basis: 40%; min-width: 300px"
                >
                  <div class="">
                    <span>Giá nhập</span>
                    <span v-if="Object.keys(warehouseIdSelect).length" style="margin-left: 0.5rem">
                      (tự động cập nhật mỗi khi nhập hàng)
                    </span>
                    <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
                      ({{ formatMoney(product.costPrice) }}/{{ unit.find((i) => i.default)?.name }})
                    </span>
                  </div>
                  <div class="">
                    <InputMoney
                      :value="product.costPrice * (unit.find((i) => i.default)?.rate || 1)"
                      :prepend="product.unitDefaultName"
                      :disabled="!!product.id && !!Object.keys(warehouseIdSelect).length"
                      @update:value="
                        (value) =>
                          (product.costPrice = value / (unit.find((i) => i.default)?.rate || 1))
                      "
                    />
                  </div>
                </div>

                <div
                  v-if="settingStore.SYSTEM_SETTING.wholesalePrice"
                  style="flex-grow: 1; flex-basis: 40%; min-width: 300px"
                >
                  <div class="">
                    <span>Giá bán sỉ</span>
                    <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
                      ({{ formatMoney(product.wholesalePrice) }}/{{
                        unit.find((i) => i.default)?.name
                      }})
                    </span>
                  </div>
                  <div class="">
                    <InputMoney
                      :value="product.wholesalePrice * (unit.find((i) => i.default)?.rate || 1)"
                      :prepend="product.unitDefaultName"
                      @update:value="
                        (value) =>
                          (product.wholesalePrice =
                            value / (unit.find((i) => i.default)?.rate || 1))
                      "
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">
                    <span>Giá bán lẻ</span>
                    <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
                      ({{ formatMoney(product.retailPrice) }}/{{
                        unit.find((i) => i.default)?.name
                      }})
                    </span>
                  </div>
                  <div class="">
                    <InputMoney
                      :value="product.retailPrice * (unit.find((i) => i.default)?.rate || 1)"
                      :prepend="product.unitDefaultName"
                      @update:value="
                        (value) =>
                          (product.retailPrice = value / (unit.find((i) => i.default)?.rate || 1))
                      "
                    />
                  </div>
                </div>

                <div class="mt-2 grow basis-[600px] flex items-stretch">
                  <div class="w-[60px] flex-none">
                    <VueSwitch v-model="product.isActive" type-parser="number" />
                  </div>
                  <div>
                    <span v-if="product.isActive">Active</span>
                    <span v-else>Inactive (Ngừng kinh doanh)</span>
                  </div>
                </div>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.WAREHOUSE_AND_BATCH">
              <div class="mt-4 flex flex-wrap gap-4">
                <div style="flex-basis: 90%; flex-grow: 1">
                  <div class="italic font-bold">* Kho quản lý</div>
                  <div>
                    <div class="mt-2">
                      <input
                        :id="'MEA_' + randomId + '_' + 0"
                        style="cursor: pointer"
                        :checked="warehouseIdSelect['0']"
                        type="checkbox"
                        @change="(e) => handleChangeSelectWarehousePrime(e)"
                      />
                      <label class="mx-2 cursor-pointer" :for="'MEA_' + randomId + '_' + 0">
                        Tất cả kho
                      </label>
                    </div>
                    <div class="mt-2 flex flex-wrap">
                      <div
                        v-for="warehouse in warehouseAll"
                        :key="warehouse.id"
                        style="flex-grow: 1; flex-basis: 30%; min-width: 200px"
                      >
                        <input
                          :id="'MEA_' + randomId + '_' + warehouse.id"
                          style="cursor: pointer"
                          :checked="warehouseIdSelect[warehouse.id]"
                          type="checkbox"
                          @change="(e) => handleChangeSelectWarehouse(e, warehouse.id)"
                        />
                        <label
                          class="mx-2 cursor-pointer"
                          :for="'MEA_' + randomId + '_' + warehouse.id"
                        >
                          {{ warehouse.name }}
                        </label>
                      </div>
                    </div>
                    <div class="mt-2">
                      <input
                        :id="'MEA_' + randomId + '_'"
                        style="cursor: pointer"
                        :checked="!Object.keys(warehouseIdSelect).length"
                        type="checkbox"
                        @change="(e) => handleChangeSelectNoWarehouse(e)"
                      />
                      <label class="mx-2 cursor-pointer" :for="'MEA_' + randomId + '_'">
                        *** Không quản lý số lượng (số lượng luôn luôn = 0)
                      </label>
                    </div>
                  </div>
                </div>

                <div style="flex-basis: 90%; flex-grow: 1">
                  <div class="italic font-bold">* Phân loại sản phẩm</div>
                  <div class="mt-2">
                    <InputRadio
                      v-model:value="product.productType"
                      :options="[
                        { key: ProductType.Basic, label: 'Sản phẩm thường' },
                        { key: ProductType.SplitBatch, label: 'Sản phẩm có lô' },
                      ]"
                    />
                  </div>
                </div>

                <div
                  v-if="product.productType === ProductType.SplitBatch"
                  style="flex-basis: 90%; flex-grow: 1; padding-left: 1rem"
                >
                  <div class="italic underline">-- Quản lý logic tách lô hàng</div>
                  <div class="mt-4">
                    <div>Kho hàng</div>
                    <div>
                      <InputSelect
                        v-model:value="product.splitBatchByWarehouse"
                        :options="splitBatchByWarehouseOptions"
                      />
                    </div>
                  </div>
                  <div class="mt-2">
                    <div>Nhà cung cấp</div>
                    <div>
                      <InputSelect
                        v-model:value="product.splitBatchByDistributor"
                        :options="splitBatchByDistributorOptions"
                      />
                    </div>
                  </div>
                  <div class="mt-2">
                    <div>Hạn sử dụng</div>
                    <div>
                      <InputSelect
                        v-model:value="product.splitBatchByExpiryDate"
                        :options="splitBatchByExpiryDateOptions"
                      />
                    </div>
                  </div>
                  <div class="mt-2">
                    <div>Giá nhập</div>
                    <div>
                      <InputSelect
                        v-model:value="product.splitBatchByCostPrice"
                        :options="splitBatchByCostPriceOptions"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="product.discountList!"
                  :discountInteractId="product.id"
                  :discountInteractType="DiscountInteractType.Product"
                  :discountListExtra="product.discountListExtra || []"
                  :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
              <div class="mt-4">
                <PositionTableAction
                  v-model:positionList="product.positionList!"
                  :positionType="PositionInteractType.Product"
                  :positionInteractId="product.id"
                  :editable="userPermission[PermissionId.POSITION]"
                />
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="px-4 pb-6 pt-8">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.PRODUCT_DELETE] && product.id"
            color="red"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton style="margin-left: auto" icon="close" type="reset" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalProductUpsertSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalProductUpsertSettingScreen"
  />
  <ModalDataProduct
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalDataProduct"
  />
</template>
