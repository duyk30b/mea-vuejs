<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconHome, IconRight } from '../../common/icon-antd'

const router = useRouter()

const matchedRouter = computed(() => {
  return router.currentRoute.value.matched
})
</script>

<template>
  <div class="flex gap-2 items-baseline text-lg font-medium">
    <template v-for="(rout, index) in matchedRouter" :key="index">
      <template v-if="index === 0">
        <span @click="router.push({ path: '/' })" style="cursor: pointer">
          <IconHome style="font-size: 1em; display: block" />
        </span>
      </template>
      <template v-else>
        <template v-if="rout.meta.title">
          <IconRight style="font-size: 0.7em; opacity: 0.5" />
          <span @click="router.push({ path: rout.path })" style="cursor: pointer; user-select: none;">
            {{ rout.meta.title }}
          </span>
        </template>
      </template>
    </template>
  </div>
</template>
