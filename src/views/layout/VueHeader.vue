<script setup lang="ts">
import { LogoutOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons-vue'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { AxiosLoading } from '../../core/axios.instance'
import { useMeStore } from '../../modules/_me/me.store'
import { AuthService } from '../../modules/auth/auth.service'

const emit = defineEmits(['handleShowDrawer'])
const emitShowDrawer = () => emit('handleShowDrawer', true)

const meStore = useMeStore()
const route = useRoute()

const routeTitle = ref<string>('')
watchEffect(() => {
  const title = route.matched.slice(-1)[0]?.meta?.title
  if (typeof title === 'function') {
    routeTitle.value = title(route)
  } else if (typeof title === 'string') {
    routeTitle.value = title
  }
})

const handleUserAction = async (e: any) => {
  if (e.key === 'logout') {
    await AuthService.logout()
  }
}
</script>

<template>
  <a-layout-header>
    <router-link :to="{ name: 'AppHome' }" class="header-logo hidden md:flex">
      <div class="logo-icon">
        <font-awesome-icon :icon="['fas', 'hospital-user']" />
      </div>
      <div class="logo-text">
        <div class="logo-title">Medihome</div>
        <div class="logo-description">looking for new solutions</div>
      </div>
    </router-link>
    <div class="dashboard-menu flex md:hidden">
      <MenuUnfoldOutlined class="icon-menu-fold" @click="emitShowDrawer" />
      <span class="ml-3 text-white text-xl font-medium">{{ routeTitle }}</span>
    </div>
    <div>
      <a-dropdown trigger="click">
        <a-button>
          <UserOutlined />
          {{ meStore?.user?.fullName }}
        </a-button>
        <template #overlay>
          <a-menu @click="handleUserAction">
            <a-menu-item key="logout"> <LogoutOutlined /> &nbsp; Đăng xuất </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
    <div v-if="AxiosLoading.loading" class="progress-loader">
      <a-progress
        :percent="AxiosLoading.percent"
        :show-info="false"
        status="active"
        :strokeWidth="3"
      />
    </div>
  </a-layout-header>
</template>

<style lang="scss">
.ant-layout-header {
  position: relative;
  background-color: var(--color-header);
  height: 56px;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: normal;

  .header-logo {
    justify-content: center;
    align-items: center;
    color: white;

    .logo-icon {
      font-size: 32px;
      margin-right: 8px;
    }

    .logo-text {
      .logo-title {
        margin-top: -1px;
        font-size: 16px;
        text-transform: uppercase;
        font-weight: bold;
      }

      .logo-description {
        margin-top: 3px;
        font-size: 12px;
        font-style: italic;
      }
    }
  }

  .dashboard-menu {
    align-items: center;

    .icon-menu-fold {
      font-size: 18px;
      cursor: pointer;
      transition: color 0.3s;
      color: #fff;

      &:hover {
        color: #ffffffa6;
      }
    }
  }

  .progress-loader {
    position: absolute;
    bottom: -12px;
    left: 0;
    right: 0;
  }
}
</style>

