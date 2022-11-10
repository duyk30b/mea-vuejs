<script setup lang="ts">
import { AxiosLoading } from '@/core/axios.instance'
import { AuthService } from '@/modules/auth'
import { useUserStore } from '@/store/user.store'
import { LogoutOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons-vue'

const emit = defineEmits(['handleShowDrawer'])
const emitShowDrawer = () => emit('handleShowDrawer', true)

const userStore = useUserStore()

const handleUserAction = async (e: any) => {
  if (e.key === 'logout') {
    await AuthService.logout()
  }
}

</script>

<template>
  <a-layout-header>
    <div class="header-logo" @click="$router.push({ name: 'AppHome' })">
      <div class="logo-icon">
        <font-awesome-icon :icon="['fas', 'hospital-user']" />
      </div>
      <div class="logo-text">
        <div class="logo-title">Medihome</div>
        <div class="logo-description">looking for new solutions</div>
      </div>
    </div>
    <div class="dashboard-menu">
      <MenuUnfoldOutlined class="icon-menu-fold" @click="emitShowDrawer" />
      <!-- <div>
        <span class="menu-item">
          <RouterLink :to="{ name: 'AppHome' }">Home</RouterLink>
        </span>
      </div> -->
    </div>
    <div>
      <a-dropdown trigger="click">
        <a-button>
          <UserOutlined />
          {{ userStore?.userInfo?.fullName }}
        </a-button>
        <template #overlay>
          <a-menu @click="handleUserAction">
            <a-menu-item key="logout">
              <LogoutOutlined /> &nbsp; Đăng xuất
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
    <div v-if="AxiosLoading.loading" class="progress-loader">
      <a-progress :percent="AxiosLoading.percent" :show-info="false" status="active" :strokeWidth="3" />
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
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    cursor: pointer;

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

    @media screen and (max-width: 768px) {
      display: none;
    }
  }

  .dashboard-menu {
    display: flex;
    align-items: center;

    .icon-menu-fold {
      font-size: 18px;
      padding: 0 1rem;
      cursor: pointer;
      transition: color 0.3s;
      color: #fff;

      &:hover {
        color: #ffffffa6;
      }

      @media screen and (min-width: 768px) {
        display: none;
      }
    }

    .menu-item {
      color: white;
      padding: 0 1rem;
      border-right: 1px solid #cdcdcd;
      font-weight: bold;
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
