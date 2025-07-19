<script setup lang="ts">
import { IconHospitalUser } from '@/common/icon-font-awesome'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { IconLogout, IconMenuUnfold, IconUser } from '../../common/icon-antd'
import VueDropdown from '../../common/popover/VueDropdown.vue'
import { AxiosLoading } from '../../core/axios.instance'
import { MeService } from '../../modules/_me/me.service'
import { AuthService } from '../../modules/auth/auth.service'
import { ESImage } from '../../utils'

const emit = defineEmits(['handleShowDrawer'])
const emitShowDrawer = () => emit('handleShowDrawer', true)

const route = useRoute()

const { organization, user } = MeService

const routeTitle = ref<string>('')
watchEffect(() => {
  const titleList = route.matched.map((i) => i?.meta?.title).filter((i) => !!i)
  const title = titleList[titleList.length - 1]
  if (typeof title === 'function') {
    routeTitle.value = title(route)
  } else if (typeof title === 'string') {
    routeTitle.value = title
  }
})
</script>

<template>
  <a-layout-header>
    <router-link :to="{ name: 'AppHome' }" class="header-logo hidden md:flex">
      <div class="logo-icon">
        <img
          v-if="organization?.logoImage"
          :src="ESImage.getImageLink(organization?.logoImage, { size: 500 })"
          style="background-color: white; height: 50px"
        />
        <IconHospitalUser v-else />
      </div>
      <div class="logo-text">
        <template v-if="organization?.name">
          <div class="logo-title">
            {{ organization?.name }}
          </div>
        </template>
        <template v-else>
          <div class="logo-title">MEDIHOME</div>
          <div class="logo-description">looking for new solutions</div>
        </template>
      </div>
    </router-link>
    <div class="dashboard-menu flex md:hidden">
      <IconMenuUnfold class="icon-menu-fold" @click="emitShowDrawer" />
      <span class="ml-3 text-white text-xl font-medium">{{ routeTitle }}</span>
    </div>
    <div class="flex items-center gap-4">
      <VueDropdown>
        <template #trigger>
          <VueButton>
            <IconUser />
            {{ user?.fullName }}
          </VueButton>
        </template>
        <div class="vue-menu">
          <a @click="AuthService.logout()">
            <IconLogout />
            <span>Đăng xuất</span>
          </a>
        </div>
      </VueDropdown>
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
        font-size: 18px;
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
