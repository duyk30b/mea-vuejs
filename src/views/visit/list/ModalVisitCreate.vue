<script setup lang="ts">
import {
  CloseOutlined,
  LoadingOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { InputDate, InputHint, InputOptions, InputText } from '../../../common/vue-form'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { VisitApi } from '../../../modules/visit/visit.api'
import { useCustomerStore } from '../../../modules/customer'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { convertViToEn, customFilter, timeToText } from '../../../utils'
import ModalVisitCreateSettingScreen from './ModalVisitCreateSettingScreen.vue'

const modalVisitCreateSettingScreen = ref<InstanceType<typeof ModalVisitCreateSettingScreen>>()
const visitCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const customerStore = useCustomerStore()
const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const customer = ref<Customer>(Customer.blank())
const rootCustomer = ref<Customer>(Customer.blank())
const customerListOptions = ref<{ value: number; text: string; data: Customer }[]>([])

const openModal = async () => {
  try {
    showModal.value = true
    provinceList.value = await AddressInstance.getAllProvinces()
  } catch (e) {
    console.log('🚀 ~ file: ModalVisitCreate.vue:53 ~ openModal ~ e:', e)
  }
}

const closeModal = () => {
  customer.value = Customer.blank()
  customerListOptions.value = []
  showModal.value = false
  districtList.value = []
  wardList.value = []
}

const handleRegisterVisit = async () => {
  saveLoading.value = true
  try {
    if (!customer.value.id) {
      await VisitApi.registerWithNewCustomer({
        customer: customer.value,
        registeredAt: Date.now(),
      })
    } else {
      await VisitApi.registerWithExistCustomer({
        customerId: customer.value.id,
        registeredAt: Date.now(),
      })
    }
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleRegisterVisit ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleUpdateCustomer = async () => {
  const validForm = visitCreateForm.value?.checkValidity()
  if (!validForm) {
    return visitCreateForm.value?.reportValidity()
  }
  if (!customer.value.id) return
  const data = await customerStore.updateOne(customer.value.id, customer.value)
  customer.value = Customer.fromInstance(data)
  rootCustomer.value = Customer.fromInstance(data)
}

const handleChangeProvince = async (province: string) => {
  if (!province) {
    districtList.value = []
    wardList.value = []
    return
  }
  try {
    districtList.value = await AddressInstance.getDistrictsByProvince(province)
  } catch (error) {
    console.log('🚀 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (district: string) => {
  if (!district) {
    wardList.value = []
    return
  }
  try {
    wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
      customer.value.addressProvince,
      district
    )
  } catch (error) {
    console.log('🚀 ~ handleChangeDistrict ~ error:', error)
  }
}

const selectCustomer = async (data: Customer) => {
  try {
    if (data) {
      customer.value = Customer.fromInstance(data)
      rootCustomer.value = Customer.fromInstance(data)

      if (data.addressProvince) {
        districtList.value = await AddressInstance.getDistrictsByProvince(data.addressProvince)
      } else {
        districtList.value = []
        wardList.value = []
      }

      if (data.addressProvince && data.addressDistrict) {
        wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
          data.addressProvince,
          data.addressDistrict
        )
      } else {
        wardList.value = []
      }
    } else {
      customer.value = Customer.blank()
      rootCustomer.value = Customer.blank()
    }
  } catch (e) {
    console.log('🚀 ~ file: ModalVisitCreate.vue:140 ~ selectCustomer ~ e:', e)
  }
}

const searchingCustomer = async (text: string) => {
  customer.value = Customer.blank()
  customer.value.fullName = text
  if (text) {
    const customerList = await customerStore.search(text)
    customerListOptions.value = customerList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  } else {
    customerListOptions.value = []
  }
}

const disabledUpdateCustomer = computed(() => {
  for (const key in customer.value) {
    const value1 = customer.value[key as keyof Customer] || ''
    const value2 = rootCustomer.value[key as keyof Customer] || ''
    if (value1 != value2) return false
  }
  return true
})

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form ref="visitCreateForm" class="bg-white" @submit.prevent="handleRegisterVisit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thêm phiếu khám mới</div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalVisitCreateSettingScreen?.openModal()"
        >
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div class="grow basis-[300px]">
          <div>
            Họ tên
            <span v-if="customer.debt" style="font-weight: 500" class="ml-2">
              (Nợ cũ: {{ formatMoney(customer.debt) }})
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputSearchCustomer"
              :options="customerListOptions"
              :maxHeight="260"
              no-clear-text-when-not-selected
              placeholder="Tìm kiếm bằng tên hoặc SĐT"
              required
              @selectItem="({ data }) => selectCustomer(data)"
              @update:text="searchingCustomer"
            >
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b> - {{ data.phone }} -
                  {{ timeToText(data.birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ data.addressString }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div class="grow basis-[300px]">
          <div>Số điện thoại</div>
          <div style="height: 40px">
            <InputText
              v-model:value="customer.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (customer.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_CUSTOMER_UPSERT.birthday"
          style="flex-grow: 1; flex-basis: 250px"
        >
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="customer.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full"
            />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_CUSTOMER_UPSERT.identityCard"
          style="flex-grow: 1; flex-basis: 250px"
        >
          <div style="width: 100px; flex: none">Số CCCD</div>
          <div class="flex-auto">
            <InputText v-model:value="customer.identityCard" placeholder="Số căn cước" />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_CUSTOMER_UPSERT.gender"
          style="flex-grow: 1; flex-basis: 150px"
        >
          <div>Giới tính</div>
          <div>
            <a-radio-group v-model:value="customer.gender">
              <a-radio :value="1"> Nam </a-radio>
              <a-radio :value="0"> Nữ </a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_CUSTOMER_UPSERT.address"
          class="grow basis-[80%]"
          style="margin-bottom: -1rem"
        >
          Địa chỉ
        </div>
        <div v-if="screenStore.SCREEN_CUSTOMER_UPSERT.address" class="grow basis-[250px]">
          <InputHint
            v-model:value="customer.addressProvince"
            :options="provinceList"
            :maxHeight="180"
            placeholder="Thành Phố / Tỉnh"
            :logic-filter="(item: string, text: string) => customFilter(item, text)"
            @update:value="handleChangeProvince"
          />
        </div>
        <div v-if="screenStore.SCREEN_CUSTOMER_UPSERT.address" class="grow basis-[250px]">
          <InputHint
            v-model:value="customer.addressDistrict"
            :maxHeight="180"
            :options="districtList"
            :logic-filter="(item: string, text: string) => customFilter(item, text)"
            placeholder="Quận / Huyện"
            @update:value="handleChangeDistrict"
          />
        </div>
        <div v-if="screenStore.SCREEN_CUSTOMER_UPSERT.address" class="grow basis-[250px]">
          <InputHint
            v-model:value="customer.addressWard"
            :maxHeight="180"
            :options="wardList"
            placeholder="Phường / Xã"
            :logic-filter="(item: string, text: string) => customFilter(item, text)"
          />
        </div>

        <div v-if="screenStore.SCREEN_CUSTOMER_UPSERT.address" class="grow basis-[80%]">
          <InputText
            v-model:value="customer.addressStreet"
            placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
          />
        </div>

        <div v-if="screenStore.SCREEN_CUSTOMER_UPSERT.relative" class="grow basis-[80%]">
          <div>Người thân</div>
          <div>
            <InputText
              v-model:value="customer.relative"
              placeholder="Tên người thân, số điện thoại"
            />
          </div>
        </div>

        <div class="grow basis-[80%]">
          <div>Ghi chú</div>
          <div>
            <InputText v-model:value="customer.note" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <button class="mr-auto btn" type="reset" @click="closeModal">
            <CloseOutlined /> Hủy bỏ
          </button>
          <button
            v-if="!!customer.id"
            class="btn btn-blue"
            type="button"
            :disabled="disabledUpdateCustomer"
            @click="handleUpdateCustomer"
          >
            <SaveOutlined /> Cập nhật thông tin
          </button>
          <button class="btn btn-blue" type="submit">
            <LoadingOutlined v-if="saveLoading" />
            <SaveOutlined v-if="!saveLoading" /> ĐĂNG KÝ KHÁM
          </button>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalVisitCreateSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalVisitCreateSettingScreen"
  />
</template>

<style lang="scss">
.ant-btn-primary[disabled] {
  color: rgba(255, 255, 255, 0.25);
  opacity: 0.7;
}
</style>
