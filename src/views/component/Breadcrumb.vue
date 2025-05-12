<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconHome, IconRight } from '../../common/icon-antd'

const router = useRouter()
const route = useRoute()

const matchedRouter = computed(() => {
  return router.currentRoute.value.matched
})
</script>

<template>
  <div class="flex gap-2 items-baseline text-lg font-medium">
    <template v-for="(rout, index) in matchedRouter" :key="index">
      <template v-if="index === 0">
        <router-link :to="{ path: '/' }">
          <IconHome style="font-size: 1em; display: block" />
        </router-link>
      </template>
      <template v-else-if="index === matchedRouter.length - 1">
        <template v-if="rout.meta.title">
          <IconRight style="font-size: 0.7em; opacity: 0.5" />
          <span style="user-select: none">
            <template v-if="typeof rout.meta.title === 'string'">
              {{ rout.meta.title }}
            </template>
            <template v-else-if="typeof rout.meta.title === 'function'">
              {{ rout.meta.title(route) }}
            </template>
          </span>
        </template>
      </template>
      <template v-else>
        <template v-if="rout.meta.title">
          <IconRight style="font-size: 0.7em; opacity: 0.5" />
          <router-link :to="{ path: rout.path }">
            <template v-if="typeof rout.meta.title === 'string'">
              {{ rout.meta.title }}
            </template>
            <template v-else-if="typeof rout.meta.title === 'function'">
              {{ rout.meta.title(route) }}
            </template>
          </router-link>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>
