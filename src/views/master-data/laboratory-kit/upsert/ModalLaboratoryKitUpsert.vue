<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputOptions, InputText } from '../../../../common/vue-form'
import InputNumber from '../../../../common/vue-form/InputNumber.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import {
  LaboratoryKit,
  LaboratoryKitApi,
  LaboratoryKitService,
} from '../../../../modules/laboratory-kit'
import { arrayToKeyValue, DString } from '../../../../utils'
import { IconDelete } from '../../../../common/icon-google'
import { useSettingStore } from '../../../../modules/_me/setting.store'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const laboratoryKitRoot = ref<LaboratoryKit>(LaboratoryKit.blank())
const laboratoryKit = ref<LaboratoryKit>(LaboratoryKit.blank())
const laboratoryKitItem = ref<Laboratory[]>([])
const laboratoryAll = ref<Laboratory[]>([])
const laboratoryOptions = ref<{ value: number; text: string; data: Laboratory }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const laboratoryMap = computed(() => {
  return arrayToKeyValue(laboratoryAll.value, 'id')
})

const openModal = async (laboratoryKitId?: number) => {
  showModal.value = true

  if (!laboratoryKitId) {
    laboratoryKit.value = LaboratoryKit.blank()
    laboratoryKitRoot.value = LaboratoryKit.blank()
    const laboratoryKitAll = await LaboratoryKitService.list({})
    laboratoryKit.value.priority = laboratoryKitAll.length + 1
    laboratoryAll.value = await LaboratoryService.list({})
  } else {
    const laboratoryKitResponse = await LaboratoryKitApi.detail(laboratoryKitId, {})
    laboratoryKitRoot.value = laboratoryKitResponse
    laboratoryKit.value = LaboratoryKit.from(laboratoryKitResponse)
    laboratoryAll.value = await LaboratoryService.list({})
    searchingLaboratory('')
    try {
      const laboratoryIdList: number[] = JSON.parse(laboratoryKitResponse.laboratoryIds)
      if (!Array.isArray(laboratoryIdList)) return
      laboratoryKitItem.value = laboratoryIdList
        .map((id) => laboratoryMap.value[id])
        .filter((i) => !!i)
    } catch (error) {
      console.log('🚀 ~ file: ModalLaboratoryKitUpsert.vue:61 ~ openModal ~ error:', error)
    }
  }
}

const closeModal = () => {
  showModal.value = false
  laboratoryKitRoot.value = LaboratoryKit.blank()
  laboratoryKit.value = LaboratoryKit.blank()
  laboratoryKitItem.value = []
  laboratoryOptions.value = []
}

const disabledButtonSave = computed(() => {
  return LaboratoryKit.equal(laboratoryKit.value, laboratoryKitRoot.value)
})

const searchingLaboratory = async (text: string) => {
  const laboratoryList = laboratoryAll.value.filter((i) => DString.customFilter(i.name, text))
  laboratoryOptions.value = laboratoryList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const selectLaboratory = (laboratorySelected?: Laboratory) => {
  if (laboratorySelected) {
    laboratoryKitItem.value.push(Laboratory.from(laboratorySelected))
  }
  laboratoryKit.value.laboratoryIds = JSON.stringify(laboratoryKitItem.value.map((i) => i.id))
}

const removeLaboratory = (index: number) => {
  laboratoryKitItem.value.splice(index, 1)
  laboratoryKit.value.laboratoryIds = JSON.stringify(laboratoryKitItem.value.map((i) => i.id))
}

const handleSave = async () => {
  saveLoading.value = true

  try {
    if (!laboratoryKit.value.id) {
      await LaboratoryKitService.createOne(laboratoryKit.value)
      AlertStore.addSuccess('Tạo mới thành công', 1000)
    } else {
      await LaboratoryKitService.updateOne(laboratoryKit.value.id, laboratoryKit.value)
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
    title: 'Bạn có chắc chắn muốn xóa bộ xét nghiệm này',
    content: ['Bộ xét nghiệm đã xóa không thể khôi phục lại được.', 'Bạn chắc chắn vẫn muốn xóa ?'],
    async onOk() {
      try {
        await LaboratoryKitService.destroyOne(laboratoryKit.value.id)
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: ModalLaboratoryUpsert.vue:82 ~ handleDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 1000px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ laboratoryKit.id ? 'Cập nhật bộ xét nghiệm' : 'Tạo bộ xét nghiệm mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="p-4 pb-20">
        <div class="flex flex-wrap gap-4">
          <div style="flex-basis: 70%; min-width: 400px; flex-grow: 5">
            <div class="flex gap-4 justify-start">
              <span>Tên bộ xét nghiệm</span>
            </div>
            <div>
              <InputText v-model:value="laboratoryKit.name" required />
            </div>
          </div>

          <div style="flex-basis: 200px; flex-grow: 1">
            <div class="">STT</div>
            <div>
              <InputNumber v-model:value="laboratoryKit.priority" />
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div>Chọn xét nghiệm</div>
          <div style="height: 40px">
            <InputOptions
              :options="laboratoryOptions"
              :maxHeight="320"
              placeholder="Tìm kiếm tên dịch vụ"
              clear-after-selected
              @selectItem="({ data }: any) => selectLaboratory(data)"
              @update:text="searchingLaboratory">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.name }}</b>
                  - {{ formatMoney(data.price) }}
                </div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div class="mt-4">
          <div>Danh sách các xét nghiệm trong bộ</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="laboratoryKitItem!.length === 0">
                  <td colspan="20" class="text-center">Không có dữ liệu</td>
                </tr>

                <tr v-for="(item, index) in laboratoryKitItem" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td class="text-right">{{ formatMoney(item.price) }}</td>
                  <td class="text-center">
                    <a class="text-red-500" @click="removeLaboratory(index)">
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" class="text-right">
                    <b>Tổng tiền</b>
                  </td>
                  <td class="text-right font-bold">
                    {{ formatMoney(laboratoryKitItem.reduce((acc, item) => acc + item.price, 0)) }}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton v-if="laboratoryKit.id" color="red" icon="trash" @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left:auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="disabledButtonSave">
            {{ laboratoryKit.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
