<script setup lang="ts">
import { ScheduleOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Role } from '../../modules/role'
import { PermissionData } from '../../router/permission.constant'
import { useOrganizationStore } from '../../store/organization.store'
import type { TreeProps } from 'ant-design-vue'

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const route = useRoute()
const router = useRouter()

const role = ref<Role>(Role.blank())

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (invoiceId: number) => {
  try {
    // invoice.value = await InvoiceService.detail(invoiceId, {
    //   relation: {
    //     customer: true,
    //     customerPayments: true,
    //     invoiceItems: true,
    //     invoiceSurcharges: true,
    //     invoiceExpenses: true,
    //   },
    // })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const invoiceId = Number(route.params.id)
  if (invoiceId) {
    await startFetchData(invoiceId)
  }
})

const dig = (path = '0', level = 2) => {
  const list: TreeProps['treeData'] = []
  for (let i = 0; i < 2; i += 1) {
    const key = `${path}-${i}`
    const treeNode: any = {
      title: 'title' + key,
      key,
    }

    if (level > 0) {
      treeNode.children = dig(key, level - 1)
    }

    list.push(treeNode)
  }
  return list
}
const selectedKeys = ref<string[]>(['0-0-0', '0-0-1'])
const checkedKeys = ref<string[]>(['0-0-0', '0-0-1'])
watch(selectedKeys, () => {
  console.log('selectedKeys', selectedKeys)
})
watch(checkedKeys, () => {
  console.log('checkedKeys', checkedKeys)
})
const treeData = dig()
</script>

<template>
  <div class="page-header">
    <div class="page-header-content"><ScheduleOutlined /> Thông tin vai trò</div>
  </div>

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Tên vai trò</div>
        <a-input v-model:value="role.name" class="flex-auto" />
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch
          :checked="Boolean(role.isActive)"
          @change="(checked: Boolean) => (role.isActive = checked ? 1 : 0)"
        />
        <div v-if="!role.isActive" class="ml-4">Tất cả user thuộc vai trò này tạm thời bị khóa</div>
      </div>
    </div>
    <div class="mt-8">
      <div style="font-weight: 500; font-size: 16px; text-transform: uppercase">
        Phân quyền vai trò
      </div>
      <div class="mt-4">
        <template v-for="(permission, index) in PermissionData" :key="index">
          <div class="mt-4" :style="{ marginLeft: `${(permission.level - 1) * 32}px` }">
            <a-checkbox>{{ permission.name }}</a-checkbox>
          </div>
        </template>
      </div>
    </div>
    <div class="mt-8">
      {{ JSON.stringify(treeData) }} <br>
      {{ JSON.stringify(checkedKeys) }}
      <a-tree
        v-model:selectedKeys="selectedKeys"
        v-model:checkedKeys="checkedKeys"
        default-expand-all
        checkable
        :height="1000"
        :tree-data="treeData"
      >
        <template #title="{ title, key }">
          <span v-if="key === '0-0-1-0'" style="color: #1890ff">{{ title }}</span>
          <template v-else>{{ title }}</template>
        </template>
      </a-tree>
    </div>
  </div>
</template>

<style scoped></style>
