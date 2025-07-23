<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import Breadcrumb from '../../component/Breadcrumb.vue'
import PrintHtmlDefault from './PrintHtmlDefault.vue'
import PrintHtmlList from './PrintHtmlList.vue'

const TABS_KEY = {
  DEFAULT: 'DEFAULT',
  LIST: 'LIST',
}

const router = useRouter()
const route = useRoute()

onMounted(() => {})

const activeTab = ref<any>(route.query.tab || TABS_KEY.LIST)
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <VueTabs v-model:tabShow="activeTab">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.LIST">Danh sách mẫu in</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.DEFAULT">Cài đặt mẫu mặc định</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.LIST">
          <PrintHtmlList />
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.DEFAULT">
          <PrintHtmlDefault />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped></style>
