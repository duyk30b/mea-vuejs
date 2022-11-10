<script setup lang="ts">
import { ref } from 'vue'
import VueHeader from './VueHeader.vue'
import VueSider from './VueSider.vue'

const openSideDrawer = ref(false)

const firstCollapsed = localStorage.getItem('SIDE_COLLAPSED') === 'true' || window.innerWidth < 1200

const defaultCollapsed = ref<boolean>(firstCollapsed)
const collapsed = ref<boolean>(firstCollapsed)

const setSideCollapsed = (value: boolean) => {
  localStorage.setItem('SIDE_COLLAPSED', String(value))
  collapsed.value = value
}

</script>

<template>
  <a-layout id="dashboard-layout">
    <VueHeader @handleShowDrawer="openSideDrawer = $event" />
    <a-layout>
      <a-layout-sider theme="light" :defaultCollapsed="defaultCollapsed" @collapse="setSideCollapsed" collapsible
        collapsedWidth="60" width="240">
        <VueSider :collapsed="collapsed" />
      </a-layout-sider>
      <a-drawer v-model:visible="openSideDrawer" placement="left" width="240" :closable="false"
        :bodyStyle="{ padding: 0 }" :drawerStyle="{ backgroundColor: '#fff' }">
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
          <span style="color: #333;"><strong>Medihome</strong>©2023 - Version 2.0 - Hotline: 0376.899.866</span>
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

  .ant-layout-footer {
    margin-top: 12px;
    padding: 12px;
    display: flex;
    justify-content: flex-end;
    background-color: white;
  }

  .ant-layout {
    background-color: var(--color-body-bg);
  }

  .ant-layout-sider-trigger {
    background-color: #3b70ba15 !important;
  }
}
</style>
