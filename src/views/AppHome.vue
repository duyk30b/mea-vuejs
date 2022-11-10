
<script setup lang="ts">
import { timeToText } from '@/utils'
import { DeploymentUnitOutlined, ScheduleOutlined, ShopOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons-vue'
// 2 màu khác trông cũng đẹp:  9dc183 ff6761 ff6f61 daa520 708090 ff7f50
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { ref, onBeforeMount, reactive } from 'vue'
import { StatisticsService } from '@/modules/statistics'
import dayjs, { Dayjs } from 'dayjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const loaded = ref(false)
const barData = reactive<{ labels: string[], datasets: any[] }>({ labels: [], datasets: [] })

const time = ref<Dayjs>(dayjs())

const startFetchData = async () => {
  try {
    loaded.value = false
    const response = await StatisticsService.revenueMonth({
      year: time.value.year(),
      month: time.value.month() + 1,
    })
    barData.labels = response.data.map((i) => String(i.date))
    barData.datasets = []
    barData.datasets.push({
      label: 'Chi phí',
      data: response.data.map((i) => i.revenue - i.profit),
      backgroundColor: ['rgba(54, 162, 235, 0.2)'],
      borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
      stack: 'Stack 0',
    })
    barData.datasets.push({
      label: 'Lợi nhuận',
      data: response.data.map((i) => i.profit),
      backgroundColor: ['rgba(255, 99, 132, 0.2)'],
      borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
      stack: 'Stack 0',
    })
  } catch (error) {
    console.log('🚀 ~ file: AppHome.vue:27 ~ onBeforeMount ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const options = { responsive: true }

</script>

<template>
  <div class="mx-4 mt-4">
    <div class="">
      <div class="flex flex-wrap justify-between">

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div @click="$router.push({ name: 'ArrivalInvoiceUpsert' })"
            class="bg-[#008080] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500;"> Tiếp đón nhanh </div>
              <div class="mt-4">Tạo hóa đơn nhanh bán hàng, dịch vụ cho khách lẻ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <DeploymentUnitOutlined />
            </div>
          </div>
        </div>

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div @click="$router.push({ name: 'Customer' })"
            class="bg-[#ff6f61] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500;"> Khách hàng </div>
              <div class="mt-4">Quản lý thông tin khách hàng, quản lý nợ, lịch sử mua hàng</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <TeamOutlined />
            </div>
          </div>
        </div>

        <!-- <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div class="bg-[#0094ff] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500;"> Khám bệnh </div>
              <div class="mt-4">Tiếp đón, chẩn đoán và kê đơn thuốc</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ScheduleOutlined />
            </div>
          </div>
        </div> -->

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div @click="$router.push({ name: 'Product' })"
            class="bg-[#2fb388] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500;"> Kho hàng </div>
              <div class="mt-4">Quản lý hàng tồn, nhập thuốc vào kho, danh sách nhà cung cấp</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShopOutlined />
            </div>
          </div>
        </div>

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div @click="$router.push({ name: 'Procedure' })"
            class="bg-[#9859e9] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500;"> DỊCH VỤ </div>
              <div class="mt-4">Quản lý thông tin các dịch vụ, lịch sử khách hàng đã sử dụng dịch vụ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  <div class="mx-4 mt-4">
    <div class="bg-white p-4">
      <div>Doanh thu tháng: &nbsp;
        <a-date-picker v-model:value="time" picker="month" @change="startFetchData" />
      </div>
      <div class="mt-4" style="max-width: 1200px;">
        <Bar v-if="loaded" :data="barData" :options="options" />
      </div>
    </div>
  </div>
</template>

<style></style>
