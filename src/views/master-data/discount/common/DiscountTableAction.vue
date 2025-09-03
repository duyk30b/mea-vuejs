<script setup lang="ts">
import { IconDelete } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  Discount,
  DiscountInteractType,
  DiscountInteractTypeText,
  DiscountRepeatType,
} from '@/modules/discount'
import { DiscountType } from '@/modules/enum'
import { ESNumber, ESTimer } from '@/utils'
import { ref } from 'vue'
import ModalDiscountUpsert from '../../discount/upsert/ModalDiscountUpsert.vue'

const modalDiscountUpsert = ref<InstanceType<typeof ModalDiscountUpsert>>()

const emit = defineEmits<{ (e: 'update:discountList', value: Discount[]): void }>()

const props = withDefaults(
  defineProps<{
    discountList: Discount[]
    discountListExtra: Discount[]
    discountInteractType: DiscountInteractType
    discountInteractId: number
    editable?: boolean
  }>(),
  {
    discountList: () => [],
    discountListExtra: () => [],
    discountInteractType: DiscountInteractType.Procedure,
    discountInteractId: 0,
    editable: true,
  },
)

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const handleModalDiscountUpsertSuccess = async (
  discountData: Discount,
  mode: 'CREATE' | 'UPDATE',
) => {
  const discountListAction = [...props.discountList]
  if (mode === 'CREATE') {
    discountListAction.push(discountData)
  }
  if (mode === 'UPDATE') {
    const findIndex = discountListAction.findIndex((i) => {
      return i._localId === discountData._localId
    })
    discountListAction[findIndex] = discountData
  }
  emit('update:discountList', discountListAction)
}

const clickUpsertDiscount = (options: { discount?: Discount; mode: 'CREATE' | 'UPDATE' }) => {
  const discount = options.discount || Discount.blank()
  modalDiscountUpsert.value?.openModal({
    discount,
    requiredInteract: {
      discountInteractType: props.discountInteractType,
      discountInteractId: props.discountInteractId,
    },
    mode: options.mode,
  })
}

const clickRemoveDiscount = (_localId: string) => {
  const discountListAction = [...props.discountList]
  const findIndex = discountListAction.findIndex((i) => {
    return i._localId === _localId
  })
  discountListAction.splice(findIndex, 1)
  emit('update:discountList', discountListAction)
}
</script>

<template>
  <ModalDiscountUpsert ref="modalDiscountUpsert" @success="handleModalDiscountUpsertSuccess" />
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th style="width: 30px">Độ ưu tiên</th>
          <th>Khuyến mại</th>
          <th>Thời gian</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="discount in discountListExtra" :key="discount._localId">
          <td class="text-center">{{ discount.priority }}</td>
          <td class="text-center">
            <template v-if="discount.discountType === DiscountType.VND">
              {{ formatMoney(discount.discountMoney) }}
            </template>
            <template v-else>
              {{ ESNumber.format({ number: discount.discountPercent }) }}
            </template>
            {{ discount.discountType }}
          </td>
          <td class="">
            <div v-if="discount.discountRepeatType === DiscountRepeatType.Weekly">
              <div>{{ discount.periodsDayText }}</div>
              <div>
                {{ discount.periodsTimeParse.map((i) => i.join(' => ')).join('; ') }}
              </div>
            </div>
            <div v-if="discount.discountRepeatType === DiscountRepeatType.Once">
              <div v-for="(timeDistance, index) in discount.periodsTimeParse" :key="index">
                {{ ESTimer.timeToText(timeDistance[0], 'DD/MM/YYYY hh:mm') }} ==>
                {{ ESTimer.timeToText(timeDistance[1], 'DD/MM/YYYY hh:mm') }}
              </div>
            </div>
          </td>
          <td colspan="2">
            <span>Áp dụng tất cả {{ DiscountInteractTypeText[discountInteractType] }}</span>
          </td>
        </tr>
        <tr v-for="(discount, index) in discountList" :key="index">
          <td class="text-center">{{ discount.priority }}</td>
          <td class="text-center">
            <template v-if="discount.discountType === DiscountType.VND">
              {{ formatMoney(discount.discountMoney) }}
            </template>
            <template v-else>
              {{ ESNumber.format({ number: discount.discountPercent }) }}
            </template>
            {{ discount.discountType }}
          </td>
          <td class="">
            <div v-if="discount.discountRepeatType === DiscountRepeatType.Weekly">
              <div>{{ discount.periodsDayText }}</div>
              <div>
                {{ discount.periodsTimeParse.map((i) => i.join(' => ')).join('; ') }}
              </div>
            </div>
            <div v-if="discount.discountRepeatType === DiscountRepeatType.Once">
              <div v-for="(timeDistance, index) in discount.periodsTimeParse" :key="index">
                {{ ESTimer.timeToText(timeDistance[0], 'DD/MM/YYYY hh:mm') }} ==>
                {{ ESTimer.timeToText(timeDistance[1], 'DD/MM/YYYY hh:mm') }}
              </div>
            </div>
          </td>
          <td class="text-center">
            <a
              v-if="editable"
              style="color: #eca52b"
              class="text-xl"
              @click="clickUpsertDiscount({ discount, mode: 'UPDATE' })"
            >
              <IconEditSquare />
            </a>
          </td>
          <td class="text-center">
            <a
              v-if="editable"
              style="color: var(--text-red)"
              class="text-xl"
              @click="clickRemoveDiscount(discount._localId)"
            >
              <IconDelete width="18" height="18" />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-2">
      <a v-if="editable" @click="clickUpsertDiscount({ mode: 'CREATE' })">✚ Thêm khuyến mại mới</a>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
