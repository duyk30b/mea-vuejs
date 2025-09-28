<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete } from '@/common/icon-antd'
import {
  InputCheckbox,
  InputDate,
  InputMoney,
  InputNumber,
  InputRadio,
  InputSelect,
  InputText,
  VueSwitch,
} from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import {
  Discount,
  DiscountInteractType,
  DiscountInteractTypeText,
  DiscountRepeatType,
} from '@/modules/discount'
import { DiscountType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ESTimer } from '@/utils'
import InputSearchLaboratory from '@/views/component/InputSearchLaboratory.vue'
import InputSearchProcedure from '@/views/component/InputSearchProcedure.vue'
import InputSearchProduct from '@/views/component/InputSearchProduct.vue'
import InputSearchRadiology from '@/views/component/InputSearchRadiology.vue'
import InputSearchRegimen from '@/views/component/InputSearchRegimen.vue'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', value: Discount, mode: 'UPDATE' | 'CREATE'): void
}>()

const { organizationPermission } = MeService

const mode = ref<'UPDATE' | 'CREATE'>('CREATE')

const discount = ref(Discount.blank())
const periodsDayMap = ref<Record<string, boolean>>({})
const periodsTimeWeekly = ref<string[][]>([])
const periodsTimeOnce = ref<string[][]>([])

const checkAllInteract = ref(false)
const requiredInteract = ref<{
  discountInteractType: DiscountInteractType
  discountInteractId: number
} | null>(null)

const showModal = ref(false)
const saveLoading = ref(false)

const getPeriodsTimeOnceItem = () => {
  const startDate = ESTimer.startOfMonth(Date.now())
  const endDate = ESTimer.endOfMonth(Date.now())
  return [startDate.toISOString(), endDate.toISOString()]
}

const getPeriodsTimeWeeklyItem = () => {
  return ['00:00', '23:59']
}

const openModal = async (options: {
  discount?: Discount
  mode: 'CREATE' | 'UPDATE'
  requiredInteract?: {
    discountInteractType: DiscountInteractType
    discountInteractId: number
  }
}) => {
  showModal.value = true
  mode.value = options.mode
  discount.value = options.discount ? Discount.from(options.discount) : Discount.blank()

  if (options.requiredInteract) {
    discount.value.discountInteractType = options.requiredInteract.discountInteractType
    discount.value.discountInteractId = options.requiredInteract.discountInteractId

    requiredInteract.value = options.requiredInteract
    checkAllInteract.value = false
  } else {
    requiredInteract.value = null
    checkAllInteract.value = true
  }

  try {
    if (discount.value.discountRepeatType === DiscountRepeatType.Once) {
      periodsTimeOnce.value = JSON.parse(discount.value.periodsTime)
    }
    if (discount.value.discountRepeatType === DiscountRepeatType.Weekly) {
      periodsTimeWeekly.value = JSON.parse(discount.value.periodsTime)
    }
    const periodsDayList: number[] = JSON.parse(discount.value.periodsDay)
    periodsDayList.forEach((i) => (periodsDayMap.value[i] = true))
  } catch (error) {
    periodsTimeWeekly.value = [getPeriodsTimeWeeklyItem()]
    periodsTimeOnce.value = [getPeriodsTimeOnceItem()]
    periodsDayMap.value = {}
  }
  if (!periodsTimeWeekly.value.length) {
    periodsTimeWeekly.value = [getPeriodsTimeWeeklyItem()]
  }
  if (!periodsTimeOnce.value.length) {
    periodsTimeOnce.value = [getPeriodsTimeOnceItem()]
  }

  checkAllInteract.value = !discount.value.discountInteractId
}

const closeModal = () => {
  showModal.value = false
  discount.value = Discount.blank()
  periodsDayMap.value = {}
  periodsTimeWeekly.value = []
  periodsTimeOnce.value = []

  requiredInteract.value = null
  checkAllInteract.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (discount.value.discountRepeatType === DiscountRepeatType.Once) {
      discount.value.periodsTime = JSON.stringify(periodsTimeOnce.value)
      discount.value.periodsDay = JSON.stringify([])
    }
    if (discount.value.discountRepeatType === DiscountRepeatType.Weekly) {
      discount.value.periodsTime = JSON.stringify(periodsTimeWeekly.value)

      const periodsDayList = Object.entries(periodsDayMap.value)
        .filter(([key, value]) => !!value)
        .map(([key, value]) => Number(key))
      periodsDayList.sort()
      discount.value.periodsDay = JSON.stringify(periodsDayList)
    }
    emit('success', discount.value, mode.value)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCommissionUpsert.vue:80 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const changeCheckboxAll = (v: any) => {
  if (v) {
    discount.value.discountInteractId = 0
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 900px; margin-top: 50px" @close="closeModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ discount.id ? 'Cập nhật thông tin khuyến mại' : 'Tạo khuyến mại mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap items-center">
        <div v-if="!requiredInteract" style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Hàng hóa</div>
          <div>
            <InputSelect
              v-model:value="discount.discountInteractType"
              :disabled="!!discount.id"
              :options="[
                {
                  value: DiscountInteractType.Product,
                  label: DiscountInteractTypeText[DiscountInteractType.Product],
                },
                {
                  value: DiscountInteractType.Procedure,
                  label: DiscountInteractTypeText[DiscountInteractType.Procedure],
                },
                {
                  value: DiscountInteractType.Regimen,
                  label: DiscountInteractTypeText[DiscountInteractType.Regimen],
                },
                {
                  value: DiscountInteractType.Laboratory,
                  label: DiscountInteractTypeText[DiscountInteractType.Laboratory],
                },
                {
                  value: DiscountInteractType.Radiology,
                  label: DiscountInteractTypeText[DiscountInteractType.Radiology],
                },
              ]"
              @update:value="discount.discountInteractId = 0"
            ></InputSelect>
          </div>
        </div>
        <div v-if="!requiredInteract" style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Loại áp dụng</div>
          <div class="flex items-center">
            <InputRadio
              v-model:value="checkAllInteract"
              :disabled="!!discount.id"
              @update:value="changeCheckboxAll"
              :options="[
                {
                  key: true,
                  label: 'Tất cả ' + DiscountInteractTypeText[discount.discountInteractType],
                },
                {
                  key: false,
                  label: 'Chọn ' + DiscountInteractTypeText[discount.discountInteractType],
                },
              ]"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <template v-if="checkAllInteract">
            <!-- <div><InputText :value="''" disabled /></div> -->
          </template>
          <template v-else>
            <template v-if="discount.discountInteractType === DiscountInteractType.Product">
              <InputSearchProduct
                v-model:productId="discount.discountInteractId"
                required
                :disabled="!!discount.id || !!requiredInteract"
                :showQuantity="false"
                :showEditProduct="false"
              />
            </template>
            <template v-if="discount.discountInteractType === DiscountInteractType.Procedure">
              <InputSearchProcedure
                v-model:procedureId="discount.discountInteractId"
                required
                :disabled="!!discount.id || !!requiredInteract"
              />
            </template>
            <template v-if="discount.discountInteractType === DiscountInteractType.Regimen">
              <InputSearchRegimen
                v-model:regimenId="discount.discountInteractId"
                required
                :disabled="!!discount.id || !!requiredInteract"
              />
            </template>
            <template v-if="discount.discountInteractType === DiscountInteractType.Laboratory">
              <InputSearchLaboratory
                v-model:laboratoryId="discount.discountInteractId"
                required
                :disabled="!!discount.id || !!requiredInteract"
              />
            </template>
            <template v-if="discount.discountInteractType === DiscountInteractType.Radiology">
              <InputSearchRadiology
                v-model:radiologyId="discount.discountInteractId"
                required
                :disabled="!!discount.id || !!requiredInteract"
              />
            </template>
          </template>
        </div>

        <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Công thức</div>
          <div class="flex">
            <div style="min-width: 150px">
              <InputSelect
                v-model:value="discount.discountType"
                :options="[
                  { value: DiscountType.Percent, label: '%' },
                  { value: DiscountType.VND, label: 'VNĐ' },
                ]"
              ></InputSelect>
            </div>
            <div style="flex-grow: 1">
              <InputMoney
                v-if="discount.discountType === DiscountType.VND"
                v-model:value="discount.discountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                v-model:value="discount.discountPercent"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Độ ưu tiên</div>
          <div>
            <InputNumber v-model:value="discount.priority" />
          </div>
        </div>

        <div
          style="flex-grow: 1; flex-basis: 90%; min-width: 300px"
          class="flex flex-wrap gap-4 mb-4"
        >
          <div style="width: 100px">Chọn kiểu:</div>
          <div style="flex: 1">
            <InputRadio
              v-model:value="discount!.discountRepeatType"
              :options="[
                { key: DiscountRepeatType.Once, label: 'Thời gian cố định' },
                { key: DiscountRepeatType.Weekly, label: 'Lặp lại hàng tuần' },
              ]"
            />
          </div>
        </div>

        <template v-if="discount.discountRepeatType === DiscountRepeatType.Weekly">
          <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px" class="flex flex-wrap gap-4">
            <div style="width: 100px">Ngày:</div>
            <div style="flex-grow: 1; display: flex; flex-wrap: wrap" class="gap-6">
              <InputCheckbox :label="'Chủ nhật'" v-model:value="periodsDayMap[0]" />
              <InputCheckbox :label="'Thứ 2'" v-model:value="periodsDayMap[1]" />
              <InputCheckbox :label="'Thứ 3'" v-model:value="periodsDayMap[2]" />
              <InputCheckbox :label="'Thứ 4'" v-model:value="periodsDayMap[3]" />
              <InputCheckbox :label="'Thứ 5'" v-model:value="periodsDayMap[4]" />
              <InputCheckbox :label="'Thứ 6'" v-model:value="periodsDayMap[5]" />
              <InputCheckbox :label="'Thứ 7'" v-model:value="periodsDayMap[6]" />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px" class="flex flex-wrap gap-4">
            <div style="width: 100px">Giờ:</div>
            <div style="flex: 1">
              <div
                v-for="(time, index) in periodsTimeWeekly"
                :key="index"
                class="flex flex-wrap gap-2 items-center mt-1"
              >
                <div style="width: 100px">
                  <InputText
                    v-model:value="periodsTimeWeekly[index][0]"
                    pattern="^([01][0-9]|2[0-3]):[0-5][0-9]"
                    title="Thời gian hợp lệ trong khoảng: 00:00 -> 23:59"
                  />
                </div>
                <div>==></div>
                <div style="width: 100px">
                  <InputText
                    v-model:value="periodsTimeWeekly[index][1]"
                    pattern="^([01][0-9]|2[0-3]):[0-5][0-9]"
                    title="Thời gian hợp lệ trong khoảng: 00:00 -> 23:59"
                  />
                </div>
                <a style="color: var(--text-orange)" @click="periodsTimeWeekly.splice(index, 1)">
                  <IconDelete width="18" height="18" />
                </a>
              </div>
              <div>
                <VueButton
                  icon="plus"
                  size="text"
                  @click="periodsTimeWeekly.push(getPeriodsTimeWeeklyItem())"
                >
                  Thêm khoảng thời gian
                </VueButton>
              </div>
            </div>
          </div>
        </template>

        <template v-if="discount.discountRepeatType === DiscountRepeatType.Once">
          <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px" class="flex flex-wrap gap-4">
            <div style="width: 100px">Thời gian:</div>
            <div style="flex: 1">
              <div
                v-for="(time, index) in periodsTimeOnce"
                :key="index"
                class="flex flex-wrap gap-2 items-center mt-2"
              >
                <div>
                  <InputDate
                    v-model:value="periodsTimeOnce[index][0]"
                    :typeParser="'string'"
                    showTime
                  />
                </div>
                <div>==></div>
                <div>
                  <InputDate
                    v-model:value="periodsTimeOnce[index][1]"
                    :typeParser="'string'"
                    showTime
                  />
                </div>
                <a style="color: var(--text-orange)" @click="periodsTimeOnce.splice(index, 1)">
                  <IconDelete width="18" height="18" />
                </a>
              </div>
              <div>
                <VueButton
                  icon="plus"
                  size="text"
                  @click="periodsTimeOnce.push(getPeriodsTimeOnceItem())"
                >
                  Thêm khoảng thời gian
                </VueButton>
              </div>
            </div>
          </div>
        </template>

        <div
          style="flex-grow: 1; flex-basis: 90%; min-width: 300px"
          class="flex flex-wrap gap-4 mb-4"
        >
          <div style="width: 100px">Trạng thái:</div>
          <div class="w-[60px] flex-none">
            <VueSwitch v-model="discount.isActive" type-parser="number" />
          </div>
          <div>
            <span v-if="discount.isActive">Hoạt động</span>
            <span v-else>Inactive (Ngừng hoạt động)</span>
          </div>
        </div>
      </div>

      <div class="p-4 mt-10">
        <div class="flex gap-4 justify-between">
          <VueButton icon="close" type="reset" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Xác nhận
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
