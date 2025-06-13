<script setup lang="ts">
import { ref } from 'vue'
import VueHeader from './VueHeader.vue'
import VueSider from './VueSider.vue'
import { CONFIG } from '../../config'
import { ESTimer } from '../../utils'
import { VueSwitch } from '@/common/vue-form'

const openSideDrawer = ref<boolean>(false)

const firstCollapsed = localStorage.getItem('SIDE_COLLAPSED') === 'true' || window.innerWidth < 1400

const defaultCollapsed = ref<boolean>(firstCollapsed)
const collapsed = ref<boolean>(firstCollapsed)

const modeDevelopment = ref(CONFIG.MODE === 'development')
const handleChangeMode = (value: number | boolean) => {
  if (value) {
    CONFIG.MODE = 'development'
  } else {
    CONFIG.MODE = 'production'
  }
}

const setSideCollapsed = (value: boolean) => {
  localStorage.setItem('SIDE_COLLAPSED', String(value))
  collapsed.value = value
}
</script>

<template>
  <a-layout id="dashboard-layout">
    <VueHeader @handleShowDrawer="(value) => (openSideDrawer = value)" />
    <a-layout>
      <a-layout-sider
        theme="light"
        :defaultCollapsed="defaultCollapsed"
        collapsible
        collapsedWidth="60"
        width="240"
        @collapse="setSideCollapsed"
      >
        <VueSider :collapsed="collapsed" />
      </a-layout-sider>
      <a-drawer
        v-model:visible="openSideDrawer"
        placement="left"
        width="240"
        :closable="false"
        :bodyStyle="{ padding: 0 }"
        :drawerStyle="{ backgroundColor: '#fff' }"
      >
        <VueSider :collapsed="collapsed" @handleShowDrawer="openSideDrawer = $event" />
      </a-drawer>
      <a-layout>
        <a-layout-content>
          <!-- <a-breadcrumb class="breadcrumb">
          <a-breadcrumb-item>
            <RouterLink to="/">
              <HomeOutlined />
            </RouterLink>
          </a-breadcrumb-item>
          <a-breadcrumb-item v-for="(rout, index) in matchedRouter.slice(1, -1)" :key="index">
            <RouterLink :to="rout.path">{{ rout.meta.breadcrumb }}</RouterLink>
          </a-breadcrumb-item>
          <a-breadcrumb-item>{{ matchedRouter.slice(-1)[0]?.meta.breadcrumb }}</a-breadcrumb-item>
        </a-breadcrumb> -->
          <slot></slot>
        </a-layout-content>
        <a-layout-footer>
          <div></div>
          <div class="flex items-center gap-2">
            <span style="color: #333">
              <strong>MEA-v8.0</strong>
              <span>©{{ ESTimer.timeToText(CONFIG.BUILD_TIME, 'DD/MM/YY-hh:mm:ss', 7) }}</span>
              <span>
                - Hotline:
                <b>0376.899.866</b>
              </span>
            </span>
            <VueSwitch
              checkedColor="violet"
              :size="'14px'"
              v-model:modelValue="modeDevelopment"
              @change="handleChangeMode"
            />
          </div>
        </a-layout-footer>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<style lang="scss">
#dashboard-layout {
  min-height: 100vh;

  .ant-layout-sider {
    @media screen and (max-width: 768px) {
      display: none;
    }
  }

  .ant-layout-content {
    display: flex;
    flex-direction: column;
  }

  .ant-layout-footer {
    margin-top: 12px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
  }

  .ant-layout {
    background-color: var(--color-body-bg);
  }

  .ant-layout-sider-trigger {
    background-color: #3b70ba15 !important;
  }
  .ant-pagination-options {
    display: inline-block !important;
  }
}
</style>
