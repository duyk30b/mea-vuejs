<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete, IconDoubleRight } from '@/common/icon-antd'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { AlertStore } from '@/common/vue-alert'
import { InputDate, InputNumber, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { PickupStrategy } from '@/modules/enum'
import type { Image } from '@/modules/image/image.model'
import { PositionType } from '@/modules/position'
import type { Product } from '@/modules/product'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketRegimen } from '@/modules/ticket-regimen'
import { TicketUser } from '@/modules/ticket-user'
import { ESImage } from '@/utils'
import { BugDevelopment } from '@/views/component'
import InputSearchProduct from '@/views/component/InputSearchProduct.vue'
import TicketChangeTicketUserPosition from '@/views/room/room-user/TicketChangeTicketUserPosition.vue'
import { nextTick, ref } from 'vue'

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()

const emit = defineEmits<{
  (e: 'success', value: { ticketRegimen: TicketRegimen }): void
}>()

const { userPermission, organization } = MeService

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketUserResultList = ref<TicketUser[]>([])
const ticketProductConsumableList = ref<TicketProduct[]>([])
const productId = ref(0)

const hasChangeImageList = ref(false)
const loadingImage = ref(false)
const saveLoading = ref(false)
const showModal = ref(false)

const openModal = async (data: { ticketProcedure: TicketProcedure }) => {
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)

  ticketUserResultList.value = TicketUser.fromList(data.ticketProcedure.ticketUserResultList || [])
  ticketProductConsumableList.value = TicketProduct.fromList(
    data.ticketProcedure.ticketProductProcedureList || [],
  )

  if (
    [
      TicketProcedureStatus.NoEffect,
      TicketProcedureStatus.NoAction,
      TicketProcedureStatus.Pending,
    ].includes(ticketProcedure.value.status)
  ) {
    ticketProcedure.value.completedAt = Date.now()
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketUserResultList.value = []
  ticketProductConsumableList.value = []
}

const handleSave = async () => {
  try {
    saveLoading.value = true
    const { filesPosition, imageIdListKeep, files, imageUrls, imageIdWaitList } =
      imageUploadMultipleRef.value?.getData() || {
        filesPosition: [],
        imageIdWaitList: [],
        imageIdListKeep: [],
        files: [],
        imageUrls: [],
      }

    await TicketChangeProcedureApi.processResultTicketProcedure({
      ticketId: ticketProcedure.value.ticketId,
      ticketProcedureResult: ticketProcedure.value,
      imagesChange: hasChangeImageList.value
        ? { files, imageIdWaitList, externalUrlList: imageUrls }
        : undefined,
      ticketUserResultList: ticketUserResultList.value,
      ticketProductConsumableList: ticketProductConsumableList.value,
    })

    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalAppointmentClinicSuccess.vue:41  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const cancelResultTicketProcedure = async () => {
  try {
    saveLoading.value = true
    await TicketChangeProcedureApi.cancelResultTicketProcedure({
      ticketId: ticketProcedure.value.ticketId,
      ticketProcedureId: ticketProcedure.value.id,
    })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalProcessTicketProcedure.vue:100 ~  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleFixTicketUserResultList = (tuListData: TicketUser[]) => {
  ticketUserResultList.value = TicketUser.fromList(tuListData)
}

const selectProduct = async (productData: Product) => {
  if (productData) {
    if (productData.quantity <= 0) {
      AlertStore.addError('Không đủ số lượng tồn kho')
    } else {
      const findIndex = ticketProductConsumableList.value.findIndex((i) => {
        return i.productId === productData.id
      })
      if (findIndex === -1) {
        const temp = new TicketProduct()
        temp.unitQuantity = 1
        temp.unitRate = 1
        temp.productId = productData.id
        temp.product = productData
        temp.warehouseIds = '[]'
        temp.pickupStrategy = PickupStrategy.AutoWithFIFO
        ticketProductConsumableList.value.push(temp)
      } else {
        ticketProductConsumableList.value[findIndex].unitQuantity++
      }
    }
  }

  await nextTick()
  productId.value = 0
}

const removeConsumable = (productId: number) => {
  const findIndex = ticketProductConsumableList.value.findIndex((i) => {
    return i.productId === productId
  })
  if (findIndex !== -1) {
    ticketProductConsumableList.value.splice(findIndex, 1)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 800px" @close="closeModal">
    <form class="bg-white pb-2" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>{{ ticketProcedure.procedure?.name }}</span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="mx-4 mt-4">
        <div class="flex flex-wrap gap-4">
          <!-- <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
            <div>Số lượng</div>
            <div>
              <InputNumber
                v-model:value="ticketProcedure.quantity"
                type-parser="number"
                class="w-full"
                show-time
                :disabled="!!ticketProcedure.id"
              />
            </div>
          </div> -->

          <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
            <div>Thời gian thực hiện</div>
            <div>
              <InputDate
                v-model:value="ticketProcedure.completedAt"
                type-parser="number"
                class="w-full"
                show-time
              />
            </div>
          </div>

          <div style="flex-basis: 90%; flex-grow: 1; min-width: 300px">
            <div>Kết luận</div>
            <div>
              <InputText v-model:value="ticketProcedure.result" />
            </div>
          </div>

          <div style="flex-basis: 90%; flex-grow: 1; min-width: 300px">
            <div>Hình ảnh</div>
            <ImageUploadCloudinary
              ref="imageUploadMultipleRef"
              :height="100"
              :oid="organization.id"
              :customerId="ticketProcedure.customerId"
              @changeImage="hasChangeImageList = true"
              @loading="(v) => (loadingImage = v)"
              :rootImageList="
                (ticketProcedure.imageList || []).map((i: Image) => ({
                  thumbnail: ESImage.getImageLink(i, { size: 200 }),
                  enlarged: ESImage.getImageLink(i, { size: 1000 }),
                  id: i.id,
                }))
              "
            />
          </div>
        </div>

        <div class="mt-4">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketUserResultList!"
            :positionType="PositionType.ProcedureResult"
            :positionInteractId="ticketProcedure.procedureId"
            @fix:ticketUserList="handleFixTicketUserResultList"
            title="Nhân viên thực hiện dịch vụ"
          />
        </div>

        <div class="mt-4">
          <div class="font-bold">
            <IconDoubleRight />
            Vật tư tiêu hao sử dụng khi thực hiện
          </div>
          <div>
            <InputSearchProduct
              v-model:productId="productId"
              :searchIncludeZeroQuantity="false"
              @selectProduct="selectProduct"
              removeLabelWrapper
            />
          </div>
          <div class="mt-2 table-wrapper">
            <table>
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>#</th>
                  <th>Tên sản phẩm</th>
                  <th style="width: 200px">Số lượng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!ticketProductConsumableList.length">
                  <td class="text-center" colspan="100">Không sử dụng vật tư</td>
                </tr>
                <tr
                  v-for="(consumable, index) in ticketProductConsumableList"
                  :key="consumable.productId"
                >
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="consumable" />
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span>{{ consumable.product?.brandName }}</span>
                      <span style="font-weight: 500">
                        (Tồn {{ consumable.product?.quantity }}
                        {{ consumable.product?.unitBasicName }})
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputNumber
                        v-model:value="consumable.unitQuantity"
                        textAlign="right"
                        controlHorizontal
                      />
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center justify-center">
                      <a
                        style="color: var(--text-red); font-size: 18px"
                        @click="removeConsumable(consumable.productId)"
                      >
                        <IconDelete />
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4 mt-4 flex flex-wrap gap-10 justify-center">
        <div v-if="ticketProcedure.status === TicketProcedureStatus.Completed">
          <VueButton
            :loading="saveLoading"
            color="red"
            type="button"
            icon="close"
            @click="cancelResultTicketProcedure"
          >
            Hủy kết quả
          </VueButton>
        </div>
        <div>
          <VueButton
            color="blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="loadingImage"
          >
            Lưu kết quả
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
