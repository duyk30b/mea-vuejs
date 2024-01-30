<script setup lang="ts">
import {
  DeploymentUnitOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'
// 2 màu khác trông cũng đẹp:  9dc183 ff6761 ff6f61 daa520 708090 ff7f50
import AppHomeStatistic from './AppHomeStatistic.vue'
</script>

<template>
  <div class="mt-2">
    <div class="">
      <div class="flex flex-wrap justify-between">
        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#008080] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Invoice' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">HÓA ĐƠN</div>
              <div class="mt-4">Tạo hóa đơn bán hàng, dịch vụ cho khách lẻ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <DeploymentUnitOutlined />
            </div>
          </div>
        </div>

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#ff6f61] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Customer' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Khách hàng</div>
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
          <div
            class="bg-[#2fb388] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Product' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Kho hàng</div>
              <div class="mt-4">Quản lý hàng tồn, nhập thuốc vào kho, danh sách nhà cung cấp</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShopOutlined />
            </div>
          </div>
        </div>

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#9859e9] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Procedure' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">DỊCH VỤ</div>
              <div class="mt-4">
                Quản lý thông tin các dịch vụ, lịch sử khách hàng đã sử dụng dịch vụ
              </div>
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
    <AppHomeStatistic />
  </div>
</template>

<style></style>
