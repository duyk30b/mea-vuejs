<script setup lang="ts">
import { ArrivalService, type Arrival } from '@/modules/arrival'
import { ScheduleOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref, watch } from 'vue'
import ModalCustomerDetail from '../customer/detail/ModalCustomerDetail.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const loadingComponent = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const arrivals = ref<Arrival[]>([])

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const activeKey = ref(['1', '2'])
const tabsKey = ref<'product' | 'procedure'>('procedure')

watch(activeKey, (val) => {
  console.log(val)
})

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await ArrivalService.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      // filter: {
      //   from_time: timeRanger.value?.[0].startOf('day').valueOf(),
      //   to_time: timeRanger.value?.[1].endOf('day').valueOf(),
      //   types: JSON.stringify([ArrivalType.Invoice]),
      //   payment_status: paymentStatus.value || undefined,
      // },
      sort,
    })

    arrivals.value = response.data
    total.value = response.total
    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceList.vue:50 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleChangeTabs = (activeKey: any) => {
  localStorage.setItem('ARRIVAL_INVOICE_UPSERT_TABS', activeKey)
}
</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem">
        <ScheduleOutlined style="margin-right: 1rem" />
        Khám bệnh
      </div>
      <!-- <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
            <SettingOutlined />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div> -->
    </div>
  </div>

  <div class="mx-4 mt-4 flex-1 flex gap-4">
    <div style="width: 300px; background: green; overflow: scroll">
      <a-collapse v-model:activeKey="activeKey">
        <a-collapse-panel key="1" header="Danh sách chờ khám">
          <div v-for="(item, index) in arrivals" :key="index" class="arrival-item">
            {{ item.customer?.fullName }}
          </div>
        </a-collapse-panel>
        <a-collapse-panel key="2" header="Danh sách đang khám">
          <div v-for="(item, index) in arrivals" :key="index" class="arrival-item">
            {{ item.customer?.fullName }}
          </div>
        </a-collapse-panel>
        <a-collapse-panel key="3" header="Danh sách hoàn thành">
          <div v-for="(item, index) in arrivals" :key="index" class="arrival-item">
            {{ item.customer?.fullName }}
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
    <div class="bg-violet-500 p-2" style="flex: 1">
      <a-tabs v-model:activeKey="tabsKey" :tabBarGutter="10" type="card">
        <a-tab-pane key="1" tab="Chẩn đoán"> Content of Tab Pane 1 </a-tab-pane>
        <a-tab-pane key="2" tab="Dịch vụ"> Content of Tab Pane 2 </a-tab-pane>
        <a-tab-pane key="3" tab="Vật tư tiêu hao"> Content of Tab Pane 2 </a-tab-pane>
        <a-tab-pane key="4" tab="Đơn thuốc"> Content of Tab Pane 3 </a-tab-pane>
        <a-tab-pane key="4" tab="Thanh toán"> Content of Tab Pane 3 </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style lang="scss">
.arrival-diagnosis-content {
  height: 100%;
  width: 100%;
  background-color: #ccc;
  overflow: scroll;
}

.arrival-item {
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 1rem;
  margin: 0 -1rem;

  &:hover {
    background-color: #ccc;
  }
}
</style>
