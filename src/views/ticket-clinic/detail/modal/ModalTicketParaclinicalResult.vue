<script setup lang="ts">
import { ref } from 'vue'
import { BasicEditor } from '../../../../ckeditor/class-editor'
import { IconClose } from '../../../../common/icon'
import ImageUpload from '../../../../common/ImageUpload.vue'
import { InputDate } from '../../../../common/vue-form'
import InputText from '../../../../common/vue-form/InputText.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../../common/VueButton.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { ImageHost } from '../../../../modules/image/image.model'
import { TicketParaclinical, TicketParaclinicalApi } from '../../../../modules/ticket-paraclinical'
import {
  Paraclinical,
  ParaclinicalApi,
  ParaclinicalAttribute,
  ParaclinicalService,
} from '../../../../modules/paraclinical'

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const meStore = useMeStore()

const showModal = ref(false)

const ticketParaclinical = ref<TicketParaclinical>(TicketParaclinical.blank())
const descriptionObj = ref<Record<string, any>>({})

const saveLoading = ref(false)

const disabled = ref(true)

const generateDescriptionDefault = (paraclinicalAttributeList: ParaclinicalAttribute[]) => {
  for (let i = 0; i < paraclinicalAttributeList.length; i++) {
    const attribute = paraclinicalAttributeList[i]
    descriptionObj.value[attribute.code] = attribute.default
  }
}

const openModalByInstance = async (
  ticketParaclinicalProp: TicketParaclinical,
  editable: boolean
) => {
  showModal.value = true
  if (!ticketParaclinicalProp.paraclinical?.paraclinicalAttributeList) {
    ticketParaclinicalProp.paraclinical = await ParaclinicalApi.detail(
      ticketParaclinicalProp.paraclinicalId,
      { relation: { paraclinicalAttributeList: true, printHtml: false, paraclinicalGroup: false } }
    )
  }

  ticketParaclinical.value = TicketParaclinical.from(ticketParaclinicalProp)

  if (!ticketParaclinicalProp.id) {
    generateDescriptionDefault(ticketParaclinicalProp.paraclinical?.paraclinicalAttributeList || [])
    ticketParaclinical.value.result = ticketParaclinical.value.paraclinical?.conclusionDefault || ''
  } else {
    try {
      descriptionObj.value = JSON.parse(ticketParaclinicalProp.description)
    } catch (error) {
      generateDescriptionDefault(
        ticketParaclinicalProp.paraclinical?.paraclinicalAttributeList || []
      )
    }
  }

  if (ticketParaclinical.value.startedAt == null) {
    ticketParaclinical.value.startedAt = Date.now()
  }

  disabled.value = !editable
}

const openModalById = async (paraclinicalId: number) => {
  showModal.value = true
  ticketParaclinical.value = await TicketParaclinicalApi.detail(paraclinicalId, {
    relation: {
      imageList: true,
      paraclinical: { printHtml: false, paraclinicalAttributeList: true },
    },
  })
  disabled.value = true
}

const closeModal = () => {
  showModal.value = false
}

const startSave = async () => {
  try {
    saveLoading.value = true
    ticketParaclinical.value.description = JSON.stringify(descriptionObj.value)

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    if (!ticketParaclinical.value.id) {
      await TicketParaclinicalApi.createCompleted({
        ticketParaclinical: ticketParaclinical.value,
        files,
      })
    } else {
      await TicketParaclinicalApi.update({
        ticketParaclinical: ticketParaclinical.value,
        imageIdsKeep,
        files,
        filesPosition,
      })
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketParaclinicalResult.vue:61 ~ startSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModalByInstance, openModalById })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketParaclinical.paraclinical?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4" @submit.prevent="startSave">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1">
            <div>Thời gian</div>
            <div>
              <InputDate v-model:value="ticketParaclinical.startedAt" show-time />
            </div>
          </div>
          <!-- <div class="flex-1">
            <div>BS thực hiện</div>
            <div>
              <InputText disabled :value="ticketParaclinical.doctor?.fullName" />
            </div>
          </div> -->
        </div>
        <div class="mt-3">
          <div>Mô tả</div>
          <template v-if="ticketParaclinical.paraclinical?.attributeLayout === 'Table'">
            <table class="table-attribute">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(attribute, index) in ticketParaclinical.paraclinical
                    .paraclinicalAttributeList || []"
                  :key="index">
                  <td class="name">{{ attribute.name }}</td>
                  <td><input v-model="descriptionObj[attribute.code]" /></td>
                </tr>
              </tbody>
            </table>
          </template>
          <!-- <div class="description">
            <ckeditor v-model="ticketParaclinical.description" :editor="BasicEditor"></ckeditor>
          </div> -->
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUpload
            ref="imageUploadRef"
            :height="100"
            :rootImageList="
              (ticketParaclinical.imageList || [])
                .filter((i) => i.hostType === ImageHost.GoogleDriver)
                .map((i) => ({
                  thumbnail: i.link({ size: 200 }),
                  enlarged: i.link({ size: 1000 }),
                  id: i.id,
                }))
            " />
        </div>
        <div class="mt-3">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketParaclinical.result" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton
            :disabled="disabled"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save">
            {{ ticketParaclinical.id ? 'Cập nhật' : 'Lưu lại' }}
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
:deep(.description .ck-editor__editable) {
  height: 400px !important;
}
table.table-attribute {
  width: 100%;

  th {
    white-space: normal;
    padding: 5px;
    border: 1px solid #cdcdcd;
  }

  td {
    &.name {
      padding: 0 6px;
      text-align: left;
    }
    border: 1px solid #cdcdcd;
    input {
      width: 100%;
      height: 100%;
      border: none;
      padding: 6px;
      border-radius: 2px;
      &:focus {
        outline: 2px solid #40a9ff;
      }
    }
  }
}
</style>
