<!--
 * @Author: 叶敢
 * @Date: 2024-07-05 14:00:39
 * @LastEditTime: 2024-07-05 14:12:10
 * @Description: title
 * @FastButton: ctrl+win+i, ctrl+win+t
-->
<template>
  <div class="contentBox">
    <a-table
      :columns="columns"
      :data-source="data"
      size="small"
      :rowClassName="
        (record, index) => (index % 2 === 1 ? 'table-striped' : null)
      "
      :pagination="false"
    >
      <!-- <template #aciton="{ record }">
            <a @click="getCenterOpenModal(record)">详情</a>
          </template> -->
    </a-table>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
// 操作地图 的方法
defineProps({
  data: {
    type: Object,
  },
  columns: {
    type: Object,
  },
});
</script>

<style scoped lang="scss">
/**表格 start */
.contentBox {
  :deep(.ant-table) {
    color: #fff !important;
    background: none;
    @include FontSize(14);

    th {
      color: #fff !important;
      background: #0a3f78;
      border-bottom: none;
    }

    td {
      border-bottom: none;
    }

    .ant-table-thead
      > tr.ant-table-row-hover:not(.ant-table-expanded-row):not(
        .ant-table-row-selected
      )
      > td,
    .ant-table-tbody
      > tr.ant-table-row-hover:not(.ant-table-expanded-row):not(
        .ant-table-row-selected
      )
      > td,
    .ant-table-thead
      > tr:hover:not(.ant-table-expanded-row):not(.ant-table-row-selected)
      > td,
    .ant-table-tbody
      > tr:hover:not(.ant-table-expanded-row):not(.ant-table-row-selected)
      > td {
      background-color: #233247;
    }

    .table-striped {
      background-color: #233247;
    }
  }

  :deep(.ant-pagination) {
    span {
      color: #fff;
    }

    .ant-pagination-item-active {
      background: none !important;
      border: none;
    }

    a {
      color: #fff;
    }
  }
}

/* 表格 end*/
</style>
