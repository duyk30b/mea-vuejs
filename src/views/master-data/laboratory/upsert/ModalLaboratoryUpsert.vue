<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputText, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Discount, DiscountInteractType } from '@/modules/discount'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '@/modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '@/modules/laboratory-group'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Position, PositionType } from '@/modules/position'
import PositionTableAction from '@/views/master-data/position/common/PositionTableAction.vue'
import { computed, ref } from 'vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

type LaboratoryUpsertType = Omit<Laboratory, 'children'> & {
  optionsParse?: string[]
  children?: LaboratoryUpsertType[]
}

const activeTab = ref(TABS_KEY.BASIC)

let laboratoryOrigin = Laboratory.blank()
const laboratory = ref<LaboratoryUpsertType>(Laboratory.blank())

const laboratoryGroupAll = ref<LaboratoryGroup[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (laboratoryId?: number) => {
  showModal.value = true

  if (!laboratoryId) {
    laboratoryOrigin = Laboratory.blank()
    laboratory.value = Laboratory.blank()
    laboratory.value.optionsParse = ['Âm tính', 'Dương tính', 'Không xác định']
    laboratory.value.children = [Laboratory.blank()]
    const laboratoryAll = await LaboratoryService.list({})
    laboratory.value.priority = laboratoryAll.length + 1
  } else {
    laboratoryOrigin = await LaboratoryService.detail(
      laboratoryId,
      {
        relation: {
          children: true,
          laboratoryGroup: false,
          discountList: true,
          positionList: true,
        },
      },
      { query: true },
    )
    laboratory.value = Laboratory.from(laboratoryOrigin)

    if (!laboratory.value.children) laboratory.value.children = []
    if (laboratory.value.valueType === LaboratoryValueType.Options) {
      try {
        laboratory.value.optionsParse = JSON.parse(laboratory.value.options)
      } catch (error) {
        laboratory.value.optionsParse = []
      }
    }
    if (laboratory.value.valueType === LaboratoryValueType.Children) {
      laboratory.value.children.forEach((i: LaboratoryUpsertType) => {
        try {
          i.optionsParse = JSON.parse(i.options)
        } catch (error) {
          i.optionsParse = []
        }
      })
    }
  }
  laboratoryGroupAll.value = await LaboratoryGroupService.list({})
}

const closeModal = () => {
  showModal.value = false
  laboratory.value = Laboratory.blank()
  laboratoryOrigin = Laboratory.blank()
}

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(
    laboratory.value.discountList || [],
    laboratoryOrigin.discountList || [],
  )
})

const hasChangePositionRequestList = computed(() => {
  return !Position.equalList(
    (laboratory.value.positionRequestList || []).filter((i) => !!i.roleId),
    laboratoryOrigin.positionRequestList || [],
  )
})

const hasChangeData = computed(() => {
  if (!Laboratory.equal(laboratory.value, laboratoryOrigin, { children: true })) {
    return true
  }
  if (hasChangeDiscountList.value) {
    return true
  }
  if (hasChangePositionRequestList.value) {
    return true
  }
  return false
})

const handleChangeLaboratoryOptionsParse = (optionsParse: string[]) => {
  laboratory.value.options = JSON.stringify(optionsParse)
}

const handleChangeLaboratoryChildOptionsParse = (index: number, optionsParse: string[]) => {
  laboratory.value.children![index].options = JSON.stringify(optionsParse)
}

const handleAddChildren = () => {
  const child = Laboratory.blank()
  child.priority = laboratory.value.children!.length + 1
  laboratory.value.children!.push(child)
}

const cleanLaboratory = (ins: LaboratoryUpsertType) => {
  if (ins.valueType === LaboratoryValueType.Number) {
    ins.options = JSON.stringify([])
    ins.children = []
  }
  if (ins.valueType === LaboratoryValueType.String) {
    ins.options = JSON.stringify([])
    ins.highValue = 0
    ins.lowValue = 0
    ins.unit = ''
    ins.children = []
  }
  if (ins.valueType === LaboratoryValueType.Options) {
    if (ins.optionsParse) {
      ins.options = JSON.stringify(ins.optionsParse)
    } else {
      try {
        ins.optionsParse = JSON.parse(ins.options)
      } catch (error) {
        ins.optionsParse = []
      }
    }
    ins.highValue = 0
    ins.lowValue = 0
    ins.unit = ''
    ins.children = []
  }
  if (ins.valueType === LaboratoryValueType.Children) {
    ins.options = JSON.stringify([])
    ins.highValue = 0
    ins.lowValue = 0
    ins.unit = ''
    if (!ins.children) ins.children = []
  }
}

const handleSave = async () => {
  if (!laboratory.value.laboratoryGroupId) {
    return AlertStore.addError('Lỗi: Bắt buộc phải chọn nhóm xét nghiệm')
  }

  cleanLaboratory(laboratory.value)
  if (laboratory.value.children?.length) {
    laboratory.value.children.forEach((i) => cleanLaboratory(i))
  }

  try {
    saveLoading.value = true
    if (!laboratory.value.id) {
      await LaboratoryService.create({
        laboratory: laboratory.value,
        laboratoryChildren: laboratory.value.children,
        discountList: hasChangeDiscountList.value ? laboratory.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? laboratory.value.positionRequestList
          : undefined,
      })
      AlertStore.addSuccess('Tạo mới thành công', 1000)
    } else {
      await LaboratoryService.update(laboratory.value.id, {
        laboratory: laboratory.value,
        laboratoryChildren: laboratory.value.children,
        discountList: hasChangeDiscountList.value ? laboratory.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? laboratory.value.positionRequestList
          : undefined,
      })
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryUpsert.vue:91 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa xét nghiệm này',
    content: ['Xét nghiệm đã xóa không thể khôi phục lại được.', 'Bạn chắc chắn vẫn muốn xóa ?'],
    async onOk() {
      try {
        const response = await LaboratoryService.destroyOne(laboratory.value.id)
        if (response.success) {
          emit('success')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa xét nghiệm khi đã được chỉ định',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám liên quan trước',
              `Phiếu khám liên quan: ${response.ticketLaboratoryList
                .map((i) => i.ticketId)
                .join(', ')}`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalLaboratoryUpsert.vue:82 ~ handleDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 1000px" @close="closeModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ laboratory.id ? 'Cập nhật xét nghiệm: ' : 'Tạo xét nghiệm mới: ' }}
          {{ laboratory.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4 pb-20">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.DISCOUNT">Khuyến mại</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_POSITION">Vai trò và hoa hồng</VueTabMenu>
          </template>

          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.BASIC">
              <div class="flex flex-wrap gap-4 mt-4">
                <div style="flex-basis: 70%; flex-grow: 5">
                  <div class="flex gap-4 justify-start">
                    <span>Tên xét nghiệm</span>
                  </div>
                  <div>
                    <InputText v-model:value="laboratory.name" required />
                  </div>
                </div>

                <div style="flex-basis: 200px; flex-grow: 1">
                  <div class="">Mã</div>
                  <div>
                    <InputText v-model:value="laboratory.laboratoryCode" />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
                  <div class="">Nhóm</div>
                  <div>
                    <VueSelect
                      v-model:value="laboratory.laboratoryGroupId"
                      required
                      :options="
                        laboratoryGroupAll.map((group) => ({ value: group.id, text: group.name }))
                      "
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
                  <div>Giá vốn</div>
                  <div>
                    <InputMoney
                      v-model:value="laboratory.costPrice"
                      :validate="{ GTE: 0 }"
                      style="width: 100%"
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
                  <div>Giá bán</div>
                  <div>
                    <InputMoney
                      v-model:value="laboratory.price"
                      :validate="{ GTE: 0 }"
                      style="width: 100%"
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
                  <div>Kiểu giá trị</div>
                  <div>
                    <VueSelect
                      v-model:value="laboratory.valueType"
                      :options="[
                        {
                          value: LaboratoryValueType.Number,
                          text: 'Giá trị là số. VD: GOT, GPT, CRP có ngưỡng từ 9->40 với đơn vị U/L)',
                        },
                        {
                          value: LaboratoryValueType.String,
                          text: 'Giá trị là chữ. VD trường hợp điền tên vi khuẩn',
                        },
                        {
                          value: LaboratoryValueType.Options,
                          text: 'Lựa chọn trong danh sách (VD: Danh sách gồm: Âm tính, Dương tính, Âm tính giả,...)',
                        },
                        {
                          value: LaboratoryValueType.Children,
                          text: 'Bao gồm nhiều giá trị con. VD: công thức máu (có HC,BC,TC), nước tiểu (có pH, protein), điện giải đồ (có Na+, K+, Cl-)',
                        },
                      ]"
                    />
                  </div>
                </div>
              </div>

              <template v-if="laboratory.valueType === LaboratoryValueType.Number">
                <div class="table-wrapper mt-4">
                  <table>
                    <thead>
                      <tr>
                        <th>Ngưỡng thấp</th>
                        <th>Ngưỡng cao</th>
                        <th>Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input
                            v-model="laboratory.lowValue"
                            type="number"
                            step="0.001"
                            style="width: 100%"
                          />
                        </td>
                        <td>
                          <input
                            v-model="laboratory.highValue"
                            type="number"
                            step="0.001"
                            style="width: 100%"
                          />
                        </td>
                        <td>
                          <input v-model="laboratory.unit" type="text" style="width: 100%" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <template v-if="laboratory.valueType === LaboratoryValueType.String"></template>

              <template v-if="laboratory.valueType === LaboratoryValueType.Options">
                <div class="mt-4">
                  <div class="italic">Danh sách các lựa chọn:</div>
                  <div>
                    <a-select
                      v-model:value="laboratory.optionsParse"
                      mode="tags"
                      style="width: 100%"
                      placeholder="Điền các lựa chọn ở đây"
                      @change="handleChangeLaboratoryOptionsParse"
                    ></a-select>
                  </div>
                </div>
              </template>

              <template v-if="laboratory.valueType === LaboratoryValueType.Children">
                <div class="mt-4">
                  <div class="italic">Danh sách các giá trị con</div>
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên giá trị</th>
                          <th>Kiểu giá trị</th>
                          <th>Ngưỡng thấp</th>
                          <th>Ngưỡng cao</th>
                          <th>Đơn vị</th>
                          <th>Lựa chọn</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(laboratoryChild, index) in laboratory.children" :key="index">
                          <td class="text-center">
                            <input
                              v-model="laboratory.children![index].priority"
                              type="number"
                              step="1"
                              style="width: 50px; text-align: center"
                            />
                          </td>
                          <td>
                            <input
                              v-model="laboratory.children![index].name"
                              type="string"
                              style="width: 100%"
                            />
                          </td>
                          <td>
                            <a-select
                              ref="select"
                              v-model:value="laboratory.children![index].valueType"
                              style="width: 140px"
                            >
                              <a-select-option :value="LaboratoryValueType.Number">
                                Số
                              </a-select-option>
                              <a-select-option :value="LaboratoryValueType.String">
                                Chữ
                              </a-select-option>
                              <a-select-option :value="LaboratoryValueType.Options">
                                Nhiều lựa chọn
                              </a-select-option>
                            </a-select>
                          </td>

                          <td>
                            <input
                              v-if="
                                laboratory.children![index].valueType === LaboratoryValueType.Number
                              "
                              v-model="laboratory.children![index].lowValue"
                              type="number"
                              step="0.001"
                              style="width: 100%"
                            />
                          </td>
                          <td>
                            <input
                              v-if="
                                laboratory.children![index].valueType === LaboratoryValueType.Number
                              "
                              v-model="laboratory.children![index].highValue"
                              type="number"
                              step="0.001"
                              style="width: 100%"
                            />
                          </td>
                          <td>
                            <input
                              v-if="
                                laboratory.children![index].valueType === LaboratoryValueType.Number
                              "
                              v-model="laboratory.children![index].unit"
                              type="text"
                              style="width: 100%"
                            />
                          </td>
                          <td>
                            <div>
                              <a-select
                                v-if="
                                  laboratory.children![index].valueType ===
                                  LaboratoryValueType.Options
                                "
                                v-model:value="laboratory.children![index].optionsParse"
                                mode="tags"
                                style="min-width: 200px; width: 100%"
                                placeholder="Danh sách các lựa chọn"
                                @change="
                                  (v: string[]) => handleChangeLaboratoryChildOptionsParse(index, v)
                                "
                              ></a-select>
                            </div>
                          </td>
                          <td class="text-center">
                            <a
                              style="color: var(--text-red)"
                              @click="laboratory.children!.splice(index, 1)"
                            >
                              <IconDelete />
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="mt-2">
                    <a @click="handleAddChildren">✚ Thêm giá trị con</a>
                  </div>
                </div>
              </template>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="laboratory.discountList!"
                  :discountInteractId="laboratory.id"
                  :discountInteractType="DiscountInteractType.Laboratory"
                  :discountListExtra="laboratory.discountListExtra || []"
                  :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
              <div class="mt-4">
                <PositionTableAction
                  v-model:positionList="laboratory.positionRequestList!"
                  :positionListCommon="laboratory.positionRequestListCommon || []"
                  :positionType="PositionType.LaboratoryRequest"
                  :positionInteractId="laboratory.id"
                  :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
                />
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton v-if="laboratory.id" color="red" icon="trash" @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="!hasChangeData"
          >
            {{ laboratory.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped>
td input {
  border: none;
  border-bottom: 1px solid #cdcdcd;
}
</style>
