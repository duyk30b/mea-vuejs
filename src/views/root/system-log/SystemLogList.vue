<script setup lang="ts">
import { VueButton } from '@/common'
import VuePagination from '@/common/VuePagination.vue'
import { IconApartment, IconBug } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { InputHint, InputSelect, InputText, VueSwitch } from '@/common/vue-form'
import { CONFIG } from '@/config'
import type { ConditionString } from '@/modules/_base/base-condition'
import { RootSystemLogApi } from '@/modules/root/system-log/root-system-log.api'
import type { SystemLog, SystemLogGetFilter } from '@/modules/system-log'
import { ESTimer } from '@/utils'
import { computed, onBeforeMount, ref } from 'vue'

type FilterCondition = {
  id: number
  isActive: boolean
  key: keyof SystemLog
  condition: keyof ConditionString
  value: any
  valueType: 'Number' | 'String' | 'Object' | 'Boolean'
}

const systemLogList = ref<SystemLog[]>([])
const dataLoading = ref(false)

const page = ref(1)
const limit = ref(50)
const total = ref(0)

const filterConditions = ref<FilterCondition[]>([])

const filterConditionHintList: FilterCondition[] = [
  { id: 1, isActive: false, key: 'oid', condition: '==', value: undefined, valueType: 'Number' },
  { id: 2, isActive: false, key: 'uid', condition: '==', value: undefined, valueType: 'Number' },
  {
    id: 3,
    isActive: false,
    key: 'apiMethod',
    condition: '==',
    value: undefined,
    valueType: 'String',
  },
  {
    id: 4,
    isActive: false,
    key: 'prefixController',
    condition: '==',
    value: undefined,
    valueType: 'String',
  },
  { id: 5, isActive: false, key: 'url', condition: 'LIKE', value: undefined, valueType: 'String' },
  {
    id: 6,
    isActive: false,
    key: 'errorMessage',
    condition: 'NOT_NULL',
    value: '1',
    valueType: 'Boolean',
  },
]

filterConditions.value.push(...filterConditionHintList)

const filterRaw = computed(() => {
  const filterAnd: SystemLogGetFilter[] = []
  filterConditions.value.forEach((i) => {
    if (!i.isActive) return
    if (!i.key) return
    if (i.value == null) return
    if (i.valueType === 'Number') {
      filterAnd.push({ [i.key]: { [i.condition]: Number(i.value) } })
    }
    if (i.valueType === 'String') {
      filterAnd.push({ [i.key]: { [i.condition]: String(i.value) } })
    }
    if (i.valueType === 'Object') {
      filterAnd.push({ [i.key]: { [i.condition]: JSON.parse(i.value) } })
    }
    if (i.valueType === 'Boolean') {
      let valueParse = true
      if ([true, 1, 'true', '1'].includes(i.value)) {
        valueParse = true
      }
      if ([false, 0, 'false', '0'].includes(i.value)) {
        valueParse = false
      }
      filterAnd.push({ [i.key]: { [i.condition]: valueParse } })
    }
  })
  const filter = filterAnd.length ? { $AND: filterAnd } : {}
  return filter
})

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const paginationResponse = await RootSystemLogApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: filterRaw.value,
      sort: { id: 'DESC' },
    })
    systemLogList.value = paginationResponse.systemLogList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ SystemLogList.vue:35 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const clickAddFilterCondition = () => {
  // for (let index = 0; index < filterConditionHintList.length; index++) {
  //   const filterConditionHint = filterConditionHintList[index]
  //   const key = filterConditionHint.key

  //   const existKey = filterConditions.value.find((i) => i.key === key)
  //   if (!existKey) {
  //     filterConditions.value.push(filterConditionHint)
  //     return
  //   }
  // }
  filterConditions.value.push({
    id: Date.now(),
    isActive: false,
    key: '' as any,
    condition: '==',
    value: undefined,
    valueType: 'Number',
  })
}

const handleUpdateValue = (id: number, value: any) => {
  const filterCondition = filterConditions.value.find((i) => i.id === id)
  if (filterCondition) {
    filterCondition.isActive = !!value
  }
}
</script>

<template>
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconApartment />
        System Log
      </div>
    </div>
    <div class="page-header-setting"></div>
  </div>
  <div class="page-main">
    <form @submit.prevent="startFetchData" class="px-4 mt-2">
      <div class="flex flex-wrap gap-5">
        <div style="flex-grow: 1; min-width: 500px; flex-basis: 45%">
          <div class="italic underline">Điều kiện lọc</div>
          <table>
            <tbody>
              <tr v-for="(filterCondition, index) in filterConditions" :key="filterCondition.id">
                <td>
                  <VueSwitch v-model:modelValue="filterCondition.isActive" />
                </td>
                <td class="pl-2" style="width: 120px">
                  <InputSelect
                    v-model:value="filterCondition.valueType"
                    :options="[
                      { value: 'Number', label: 'Number' },
                      { value: 'String', label: 'String' },
                      { value: 'Object', label: 'Object' },
                      { value: 'Boolean', label: 'Boolean' },
                    ]"
                  />
                </td>
                <td class="pl-2">
                  <InputHint
                    v-model:value="filterCondition.key"
                    :options="filterConditionHintList.map((i) => i.key)"
                  />
                </td>
                <td class="pl-2" style="width: 140px">
                  <InputSelect
                    v-model:value="filterCondition.condition"
                    :options="[
                      { value: '==', label: '==' },
                      { value: '!=', label: '!=' },
                      { value: '>', label: '>' },
                      { value: '>=', label: '>=' },
                      { value: '<', label: '<' },
                      { value: '<=', label: '<=' },
                      { value: 'IN', label: 'IN' },
                      { value: 'NOT_IN', label: 'NOT_IN' },
                      { value: 'LIKE', label: 'LIKE' },
                      { value: 'IS_NULL', label: 'IS_NULL' },
                      { value: 'NOT_NULL', label: 'NOT_NULL' },
                    ]"
                  />
                </td>
                <td class="pl-2">
                  <InputText
                    v-model:value="filterCondition.value"
                    @update:value="(v) => handleUpdateValue(filterCondition.id, v)"
                  />
                </td>
                <td class="pl-4">
                  <a
                    style="font-size: 28px; color: var(--text-red); cursor: pointer"
                    @click="filterConditions.splice(index, 1)"
                  >
                    &times;
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <a @click="clickAddFilterCondition">✚ Thêm điều kiện lọc</a>
        </div>
        <div style="flex-grow: 1; min-width: 500px; flex-basis: 45%">
          <div class="italic underline">RAW QUERY</div>
          <pre style="padding: 5px 10px; border: 1px solid #cdcdcd">{{
            JSON.stringify(filterRaw)
          }}</pre>
        </div>
      </div>

      <div class="flex flex-wrap justify-center">
        <VueButton type="submit" color="blue">Tìm kiếm</VueButton>
      </div>
    </form>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>#</th>
            <th>Time</th>
            <th>OID</th>
            <th>UID-Username</th>
            <th>ClientId</th>
            <th>ApiMethod</th>
            <th>PrefixController</th>
            <th>Url</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="systemLogList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(systemLog, index) in systemLogList" :key="index">
            <td style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(systemLog, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">
              {{ ESTimer.timeToText(systemLog.createdAt, 'hh:mm:ss DD/MM/YY', 7) }}
            </td>
            <td class="text-center">{{ systemLog.oid }}</td>
            <td class="">{{ systemLog.uid }} - {{ systemLog.username }}</td>
            <td class="">{{ systemLog.clientId }}</td>
            <td class="text-center">{{ systemLog.apiMethod }}</td>
            <td class="">{{ systemLog.prefixController }}</td>
            <td class="">
              <div>{{ systemLog.url }}</div>
              <div style="color: var(--text-red); font-weight: 500">
                {{ systemLog.errorMessage }}
              </div>
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
