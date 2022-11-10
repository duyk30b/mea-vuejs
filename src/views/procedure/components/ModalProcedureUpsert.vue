
<script setup lang="ts">
import { Procedure } from '@/modules/procedure/procedure.model'
import { ProcedureService } from '@/modules/procedure/procedure.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success', value: Procedure, type: 'CREATE' | 'UPDATE'): void }>()
const organizationStore = useOrganizationStore()

const showModal = ref(false)
const procedure = ref(Procedure.blank())
const saveLoading = ref(false)

// const product = ref(Product.blank())
// const productList = ref<Product[]>([])

// const consumableList = ref<{ product?: Product, quantity: number }[]>([])

const openModal = async (p?: Procedure) => {
  showModal.value = true
  procedure.value = p ? Procedure.fromInstance(p) : Procedure.blank()

  // if (procedure.value.consumableHint) {
  //   const consumableHint = JSON.parse(procedure.value.consumableHint) as { productId: number, quantity: number }[]
  //   if (Array.isArray(consumableHint)) {
  //     const productListResponse = await ProductService.getManyByIds(consumableHint.map((i) => i.productId))
  //     consumableList.value = consumableHint.map((i) => {
  //       const productFind = productListResponse.find((j) => j.id === i.productId)
  //       return {
  //         product: productFind,
  //         quantity: i.quantity,
  //       }
  //     })
  //   }
  // }
}

const refreshModal = () => {
  procedure.value = Procedure.blank()
  // consumableList.value = []
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  // const consumableHint = consumableList.value.map((i) => ({ productId: i.product!.id, quantity: i.quantity }))
  // procedure.value.consumableHint = JSON.stringify(consumableHint)
  try {
    if (!procedure.value.id) {
      const response = await ProcedureService.createOne(procedure.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await ProcedureService.updateOne(procedure.value.id, procedure.value)
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

// const searchingProduct = async (text: string) => {
//   productList.value = []
//   if (text) {
//     productList.value = await ProductService.search(
//       text,
//       { productBatches: true },
//       { overdue: true, quantityZero: true }
//     )
//   }
// }

// const selectProduct = (p: Product) => {
//   consumableList.value.push({ product: p, quantity: 1 })
//   product.value = Product.blank()
// }

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px" :title="procedure.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ Mới'"
    :confirm-loading="saveLoading" :afterClose="refreshModal" @ok="handleSave">
    <div>
      <div class="flex items-center">
        <div class="w-[100px] flex-none">Tên dịch vụ</div>
        <a-input v-model:value="procedure.nameVi" class="flex-auto"></a-input>
      </div>
      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.group" class="flex items-center mt-2">
        <div class="w-[100px] flex-none">Nhóm</div>
        <a-select v-model:value="procedure.group" :filter-option="filterOption" class="flex-auto" show-search
          :options="Object.entries(organizationStore.PROCEDURE_GROUP).map(([value, label]) => ({ value, label }))">
        </a-select>
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none;">Giá dịch vụ</div>
        <div style="flex:1">
          <a-input-number style="width: 100%;" v-model:value="procedure.price" step="1000" :min="0"
            :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="(value: any) => value.replace(/(,*)/g, '')" />
        </div>
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch v-model:checked="procedure.isActive" />
      </div>

      <!-- <div class="mt-10 font-bold">
        <DoubleRightOutlined /> Vật tư tiêu hao khi sử dụng dịch vụ
      </div>
      <div class="mt-4">
        <div class="flex items-center">
          <div style="width: 100px; flex: none;">Tên hàng</div>
          <div class="flex-auto">
            <InputOptions ref="inputSearchProduct" :options="productList" v-model:searchText="product.brandName"
              @selectItem="selectProduct" @update:searchText="searchingProduct" :maxHeight="260"
              placeholder="Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm">
              <template v-slot:each="{ item: { brandName, substance, unit, lastCostPrice, lastRetailPrice } }">
                <div> <b>{{ brandName }}</b>
                  - Giá nhập <b>{{ formatNumber(lastCostPrice || 0, 0) }}</b>/{{ unit }}
                  - Giá bán <b>{{ formatNumber(lastRetailPrice || 0, 0) }}</b>/{{ unit }}
                </div>
                <div>{{ substance }} </div>
              </template>
            </InputOptions>
          </div>
        </div>
        <div class="table-wrapper mt-4">
          <table class="screen-setting">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên hàng hóa</th>
                <th>Số lượng</th>
                <th>Giá bán</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="consumableList.length === 0">
                <td colspan="20" class="text-center">No data</td>
              </tr>
              <tr v-for="(p, i) in consumableList" :key="i">
                <td class="index"></td>
                <td>{{ p.product!.brandName }}</td>
                <td> <a-input-number v-model:value="consumableList[i].quantity" class="w-full" :min="0" /></td>
                <td>{{ }}</td>
                <td class="text-center">
                  <a @click="consumableList.splice(i, 1)" class="text-red-500 text-xl">
                    <DeleteOutlined />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div> -->
    </div>
  </a-modal>
</template>
