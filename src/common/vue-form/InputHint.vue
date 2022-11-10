<template lang="">
  <InputOptions
    :searchText="searchText"
    :options="optionsFilter"
    :disabled="disabled"
    @update:searchText="(e) => $emit('update:searchText', e)"
    @selectItem="(e) => $emit('update:searchText', e)"
  >
    <template v-slot:each="{ item }">
      <p v-html="formatItem(item)"></p>
    </template>
  </InputOptions>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { convertViToEn } from '@/utils/helpers/string.helper'
import InputOptions from './InputOptions.vue'

export default {
  components: { InputOptions },
  props: {
    options: { type: Array as PropType<string[]>, default: () => [] },
    searchText: { type: String, default: () => '' },
    disabled: { type: Boolean, default: () => false },
  },

  computed: {
    optionsFilter() {
      const { searchText } = this
      return this.options.filter((item: string) => {
        const itemEng = convertViToEn(item).toLowerCase()
        const textEng = convertViToEn(searchText).toLowerCase()
        return itemEng.includes(textEng)
      })
    },
  },

  methods: {
    formatItem(item: string) {
      if (!this.searchText) return item

      const itemEng = convertViToEn(item).toLowerCase()
      const textEng = convertViToEn(this.searchText).toLowerCase()

      const index1 = itemEng.indexOf(textEng)
      if (index1 === -1) return ''

      const index2 = index1 + textEng.length
      return `${item.slice(0, index1)}<b>${item.slice(index1, index2)}</b>${item.slice(index2, itemEng.length)}`
    },
  },
}
</script>
<style lang=""></style>
