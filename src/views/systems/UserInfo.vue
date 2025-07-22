<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconSetting } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputDate, InputRadio, InputText } from '../../common/vue-form'
import { MeApi } from '../../modules/_me/me.api'
import { useSettingStore } from '../../modules/_me/setting.store'
import { User } from '../../modules/user'
import ModalChangePassword from './modal/ModalChangePassword.vue'
import { MeService } from '../../modules/_me/me.service'
import { ESImage } from '@/utils'
import { ImageHost } from '@/modules/image/image.model'
import ImageUploadMultiple from '@/common/image-upload/ImageUploadMultiple.vue'

const modalChangePassword = ref<InstanceType<typeof ModalChangePassword>>()
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()

const settingStore = useSettingStore()
const { isMobile } = settingStore
const hasChangeImage = ref(false)

const user = ref<User>(User.from(MeService.user.value || User.blank()))
const saveLoading = ref(false)

onBeforeMount(async () => {
  user.value = await MeApi.info()
})

const saveUser = async () => {
  try {
    saveLoading.value = true

    const { filesPosition, imageIdsKeep, files } = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    const userModified = await MeApi.updateInfo({
      files,
      imagesChange: hasChangeImage.value ? { imageIdsKeep, filesPosition } : undefined,
      userInfo: {
        fullName: user.value.fullName,
        birthday: user.value.birthday,
        phone: user.value.phone,
        gender: user.value.gender,
      },
    })
    user.value = userModified
    MeService.user.value = User.from(userModified)
    AlertStore.addSuccess('Cập nhật thông tin cá nhân thành công')
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeData = computed(() => {
  if (!User.equal(user.value, MeService.user.value!)) {
    return true
  }
  if (hasChangeImage.value) {
    return true
  }
  return false
})
</script>

<template>
  <ModalChangePassword ref="modalChangePassword" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <IconSetting style="margin-right: 1rem" />
        Thông tin cá nhân
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4 px-4 pt-2 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Họ Tên</div>
        <InputText v-model:value="user.fullName" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Tên đăng nhập</div>
        <InputText disabled :value="user.username" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Mật khẩu</div>
        <div style="display: flex; width: 100%">
          <InputText value="********************" style="width: calc(100% - 120px)" />
          <VueButton
            color="blue"
            style="width: 120px"
            @click="modalChangePassword?.openModal(user)"
          >
            Đổi mật khẩu
          </VueButton>
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Ngày sinh</div>
        <div style="flex: 1">
          <InputDate
            v-model:value="user.birthday"
            format="DD/MM/YYYY"
            type-parser="number"
            class="w-full"
          />
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Giới tính</div>
        <div style="flex: 1">
          <InputRadio
            v-model:value="user.gender"
            :options="[
              { key: 1, label: 'Nam' },
              { key: 0, label: 'Nữ' },
            ]"
          />
        </div>
      </div>

      <div class="mt-3">
        <div>Hình ảnh</div>
        <ImageUploadMultiple
          ref="imageUploadMultipleRef"
          :height="100"
          :rootImageList="
            (user?.imageList || [])
              .filter((i) => i.hostType === ImageHost.GoogleDriver)
              .map((i) => ({
                thumbnail: ESImage.getImageLink(i, { size: 200 }),
                enlarged: ESImage.getImageLink(i, { size: 1000 }),
                id: i.id,
              }))
          "
          @changeImage="hasChangeImage = true"
        />
      </div>

      <div class="my-8 text-center flex justify-center">
        <VueButton color="blue" :disabled="!handleChangeData" icon="save" @click="saveUser">
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
