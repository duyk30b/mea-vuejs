<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    total: number
    page?: number
    limit?: number
    delta?: number
  }>(),
  {
    page: 1,
    limit: 10,
    delta: 2,
  }
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'change', data: { page: number; limit: number }): void
}>()

const calculatorPagination = (current: number, length: number, delta = 2) => {
  const array: (string | number)[] = []

  const positionA = 1 + 1 + delta + 1
  const positionB = length - 1 - delta - 1

  for (let i = 1; i <= length; i++) {
    if (
      i == 1 ||
      i == length ||
      (current - delta <= i && i <= current + delta) ||
      (current <= positionA && i <= positionA + delta) ||
      (current >= positionB && i >= positionB - delta)
    ) {
      array.push(i)
    }
  }
  if (current > positionA) array.splice(1, 0, '<<<')
  if (current < positionB) array.splice(-1, 0, '>>>')
  return array
}

const pageCount = computed(() => Math.ceil(props.total / props.limit))

const textList = computed(() => {
  return calculatorPagination(props.page, pageCount.value, props.delta)
})

const clickChangePage = (pageClick: number) => {
  let pageSend = pageClick
  if (pageSend < 1) pageSend = 1
  if (pageSend > pageCount.value) pageSend = pageCount.value
  emit('update:page', pageSend)
  emit('change', { limit: props.limit, page: pageSend })
}
</script>

<template>
  <div class="vue-pagination">
    <div class="pagination-item-wrapper">
      <div
        class="pagination-item pagination-item-link"
        :class="page === 1 ? 'pagination-item-disabled' : ''"
        @click="clickChangePage(page - 1)">
        <svg
          width="0.9em"
          height="0.9em"
          fill="currentColor"
          aria-hidden="true"
          viewBox="64 64 896 896">
          <path
            d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
        </svg>
      </div>
      <template v-for="(text, i) in textList" :key="i">
        <div
          v-if="text === '<<<'"
          class="pagination-item pagination-item-jump"
          @click="clickChangePage(page - 10)">
          <span class="pagination-item-ellipsis">•••</span>
          <span class="pagination-item-hover">
            <svg
              width="0.9em"
              height="0.9em"
              fill="currentColor"
              aria-hidden="true"
              viewBox="64 64 896 896">
              <path
                d="M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z"></path>
            </svg>
          </span>
        </div>
        <div
          v-if="typeof text === 'number'"
          class="pagination-item pagination-item-number"
          :class="`${text === page ? 'pagination-item-active' : ''}`"
          @click="(e) => clickChangePage(text)">
          {{ text }}
        </div>
        <div
          v-if="text === '>>>'"
          class="pagination-item pagination-item-jump"
          @click="clickChangePage(page + 10)">
          <span class="pagination-item-ellipsis">•••</span>
          <span class="pagination-item-hover">
            <svg
              width="0.9em"
              height="0.9em"
              fill="currentColor"
              aria-hidden="true"
              viewBox="64 64 896 896">
              <path
                d="M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 00188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 00492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z"></path>
            </svg>
          </span>
        </div>
      </template>
      <div
        class="pagination-item pagination-item-link"
        :class="page === pageCount ? 'pagination-item-disabled' : ''"
        @click="clickChangePage(page + 1)">
        <svg
          width="0.9em"
          height="0.9em"
          fill="currentColor"
          aria-hidden="true"
          viewBox="64 64 896 896">
          <path
            d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vue-pagination {
  .pagination-item-wrapper {
    display: flex;
    gap: 8px;
    .pagination-item {
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      text-align: center;
      background-color: #fff;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        font-weight: 500;
        color: #1890ff;
        border-color: #1890ff;
      }
      &.pagination-item-disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      &.pagination-item-active {
        font-weight: 700;
        color: #1890ff;
        border-color: #1890ff;
      }
      &.pagination-item-link {
        border: 1px solid #d9d9d9;
        border-radius: 2px;
      }
      &.pagination-item-number {
        border: 1px solid #d9d9d9;
        border-radius: 2px;
      }
      &.pagination-item-jump {
        border: none;
        .pagination-item-ellipsis {
          display: inline;
        }
        .pagination-item-hover {
          display: none;
        }
        &:hover {
          .pagination-item-ellipsis {
            display: none;
          }
          .pagination-item-hover {
            display: inline;
          }
        }
      }
    }
  }
}
</style>
