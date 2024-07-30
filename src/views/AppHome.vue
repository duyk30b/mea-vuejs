<script setup lang="ts">
import {
  AreaChartOutlined,
  ForkOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
// 2 màu khác trông cũng đẹp:  9dc183 ff6761 daa520
import AppHomeStatistic from './AppHomeStatistic.vue'
</script>

<template>
  <div class="mt-2">
    <div class="">
      <div class="flex flex-wrap justify-between">
        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#ff6f61] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'TicketClinic' })">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">PHÒNG KHÁM</div>
              <div class="mt-4">Tiếp đón bệnh nhân, chẩn đoán, sử dụng dịch vụ và kê đơn thuốc</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ForkOutlined />
            </div>
          </div>
        </div>

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#0094ff] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'TicketOrder' })">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">BÁN HÀNG</div>
              <div class="mt-4">Tạo hóa đơn bán hàng, dịch vụ cho khách lẻ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div>

        <!-- <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#008080] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
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
        </div> -->

        <!-- <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#ff7f50] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Receipt' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Nhập hàng</div>
              <div class="mt-4">Nhập hàng vào kho</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ScheduleOutlined />
            </div>
          </div>
        </div> -->

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#2fb388] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Product' })">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Tồn kho</div>
              <div class="mt-4">Quản lý số lượng sản phẩm, quản lý theo lô và hạn sử dụng</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShopOutlined />
            </div>
          </div>
        </div>

        <!-- <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#708090] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Procedure' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Nhà cung cấp</div>
              <div class="mt-4">Quản lý thông tin nhà cung cấp, quản lý nợ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div> -->

        <!-- <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#daa520] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Procedure' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">DỊCH VỤ</div>
              <div class="mt-4">Quản lý thông tin các dịch vụ, thủ thuật</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div> -->

        <div class="w-[100%] md:w-[50%] xl:w-[25%] p-4">
          <div
            class="bg-[#9859e9] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Statistic' })">
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Thống kê</div>
              <div class="mt-4">Thống kê thu chi, sản phẩm bán chạy</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <AreaChartOutlined />
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

<style scoped></style>
