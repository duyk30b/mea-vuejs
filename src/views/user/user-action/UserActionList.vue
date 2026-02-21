<script setup lang="ts">
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CommissionCalculatorType, PositionType, PositionTypeText } from '@/modules/position'
import { TicketUser } from '@/modules/ticket-user'
import { TicketUserApi } from '@/modules/ticket-user/ticket-user.api'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import InputSearchRole from '@/views/component/InputSearchRole.vue'
import InputSearchUser from '@/views/component/InputSearchUser.vue'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import { onBeforeMount, reactive, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconApartment } from '../../../common/icon-antd'
import { InputDate, InputSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

const ticketUserList = ref<TicketUser[]>([])
const totalCommissionMoney = ref(0)

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PAGINATION_LIMIT')) || 10)
const total = ref(0)

const filter = reactive({
  userId: 0,
  roleId: 0,
  fromTime: ESTimer.startOfMonth(new Date()),
  toTime: ESTimer.endOfMonth(new Date()),
})

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const paginationResponse = await TicketUserApi.pagination({
      relation: {
        user: true,
        role: true,
        position: true,
        ticket: true,
        product: true,
        procedure: true,
        regimen: true,
        laboratory: true,
        laboratoryGroup: true,
        radiology: true,
      },
      page: page.value,
      limit: limit.value,
      filter: {
        userId: filter.userId || undefined,
        roleId: filter.roleId || undefined,
        createdAt:
          filter.fromTime || filter.toTime
            ? {
                GTE: filter.fromTime ? filter.fromTime : undefined,
                LT: filter.toTime ? ESTimer.endOfDate(filter.toTime).getTime() : undefined,
              }
            : undefined,
      },
      sort: { id: 'DESC' },
    })
    ticketUserList.value = paginationResponse.ticketUserList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ UserActionList.vue:50 ~ startFetchData ~ error:', error)
  }
}

const startTotalCommissionMoney = async () => {
  try {
    const response = await TicketUserApi.sumCommissionMoney({
      filter: {
        userId: filter.userId || undefined,
        roleId: filter.roleId || undefined,
        createdAt:
          filter.fromTime || filter.toTime
            ? {
                GTE: filter.fromTime ? filter.fromTime : undefined,
                LT: filter.toTime ? ESTimer.endOfDate(filter.toTime).getTime() : undefined,
              }
            : undefined,
      },
    })
    totalCommissionMoney.value = response.sumCommissionMoney
  } catch (error) {
    console.log('🚀 ~ UserActionList.vue:96 ~ startTotalCommissionMoney ~ error:', error)
  }
}

const startFilter = async () => {
  page.value = 1
  await Promise.all([startFetchData(), startTotalCommissionMoney()])
}

onBeforeMount(async () => {
  await startFilter()
})

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <IconApartment class="mr-1" />
        Danh sách hoạt động người dùng
      </div>
      <VueButton color="blue" icon="plus" @click="$router.push({ name: 'RoleUpsert' })">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex-grow: 1; flex-basis: 200px">
        <InputSearchRole v-model:roleId="filter.roleId" @selectRole="startFilter"></InputSearchRole>
      </div>

      <div style="flex-grow: 1; flex-basis: 200px">
        <InputSearchUser
          v-model:userId="filter.userId"
          label="Nhân viên"
          @selectUser="startFilter"
        />
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="filter.fromTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="filter.toTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 table-wrapper">
      <div class="flex gap-2">
        <span>Tổng tiền hoa hồng:</span>
        <span class="font-bold">{{ formatMoney(totalCommissionMoney) }}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>Nhân viên</th>
            <th>Vai trò</th>
            <th>Phiếu</th>
            <th>DV/SP/XN...</th>
            <th>Thời gian</th>
            <th>Đơn Giá</th>
            <th>SL</th>
            <th>Hoa hồng</th>
            <th>Tổng HH</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketUserList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="ticketUser in ticketUserList" :key="ticketUser.id">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="ticketUser" />
            </td>
            <td>{{ ticketUser.user?.fullName }}</td>
            <td>
              <div>{{ ticketUser.role?.name }}</div>
              <div style="font-size: 0.9em" v-if="ticketUser.position?.positionType">
                {{ PositionTypeText[ticketUser.position?.positionType] }}
              </div>
            </td>
            <td>
              <span v-if="[PositionType.ProductRequest].includes(ticketUser.positionType)">
                {{ ticketUser.product?.brandName }}
              </span>
              <span
                v-else-if="
                  [PositionType.ProcedureRequest, PositionType.ProcedureResult].includes(
                    ticketUser.positionType,
                  )
                "
              >
                {{ ticketUser.procedure?.name }}
              </span>
              <span v-else-if="[PositionType.RegimenRequest].includes(ticketUser.positionType)">
                {{ ticketUser.regimen?.name }}
              </span>
              <span v-else-if="[PositionType.LaboratoryRequest].includes(ticketUser.positionType)">
                {{ ticketUser.laboratory?.name }}
              </span>
              <span
                v-else-if="
                  [
                    PositionType.LaboratoryGroupRequest,
                    PositionType.LaboratoryGroupResult,
                  ].includes(ticketUser.positionType)
                "
              >
                {{ ticketUser.laboratoryGroup?.name }}
              </span>
              <span v-else-if="[PositionType.RadiologyRequest].includes(ticketUser.positionType)">
                {{ ticketUser.radiology?.name }}
              </span>
            </td>
            <td>
              <TicketLink
                :ticket="ticketUser.ticket!"
                :ticketId="ticketUser.ticketId"
                :target="'_blank'"
              />
            </td>
            <td class="text-center">
              {{ ESTimer.timeToText(ticketUser.createdAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-right">
              <template v-if="ticketUser.positionType !== PositionType.Reception">
                <div
                  v-if="ticketUser.ticketItemExpectedPrice !== ticketUser.ticketItemActualPrice"
                  class="text-xs italic text-red-500"
                >
                  <del>
                    {{ formatMoney(ticketUser.ticketItemExpectedPrice) }}
                  </del>
                </div>
                <div>
                  {{ formatMoney(ticketUser.ticketItemActualPrice) }}
                </div>
              </template>
            </td>
            <td class="text-center">
              <template v-if="ticketUser.positionType !== PositionType.Reception">
                {{ ticketUser.quantity }}
              </template>
            </td>
            <td class="text-right">
              <div v-if="ticketUser.commissionCalculatorType === CommissionCalculatorType.VND">
                {{ formatMoney(ticketUser.commissionMoney) }}
              </div>
              <div
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentExpected
                "
              >
                {{ ticketUser.commissionPercentExpected }} % Giá niêm yết
              </div>
              <div
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentActual
                "
              >
                {{ ticketUser.commissionPercentActual }} % Giá sau chiết khấu
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketUser.commissionMoney * ticketUser.quantity) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
