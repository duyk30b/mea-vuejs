<script setup lang="ts">
import { AccountBookOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { PermissionApi } from '../../modules/permission/permission.api'

const handleInitData = async () => {
  await PermissionApi.initData()
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><AccountBookOutlined /> Permission</div>
    </div>
    <div class="page-header-setting"></div>
  </div>
  <div class="page-main">
    <div class="page-main-options">
      <a-button type="primary" @click="handleInitData()"> InitData </a-button>
    </div>
    <div class="mt-10"></div>
  </div>
</template>
