<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IconDollar,
  IconPrint,
  IconReconciliation,
  IconTool,
  IconUser,
} from '../../common/icon-antd'
import { IconLabPanel, IconPulmonology, IconWarehouse } from '../../common/icon-google'
import { MeService } from '../../modules/_me/me.service'
import { PermissionId } from '../../modules/permission/permission.enum'
import Breadcrumb from '../component/Breadcrumb.vue'

const router = useRouter()

const { organizationPermission, userPermission } = MeService
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
  </div>

  <div class="mt-4 mx-4 bg-white">
    <div class="px-4 py-4 text-lg font-medium" style="border-bottom: 1px solid #dfdfdf">
      1. Danh mục chính
    </div>
    <div class="p-4 flex flex-wrap gap-4">
      <div
        class="card"
        @click="router.push({ name: 'Procedure' })"
        v-if="userPermission[PermissionId.PROCEDURE_MENU]"
      >
        <div class="card-icon">
          <IconReconciliation />
        </div>
        <div class="card-content">
          <div class="card-title">Dịch vụ</div>
          <div class="card-description">Quản lý thông tin, giá dịch vụ</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'Laboratory' })"
        v-if="userPermission[PermissionId.LABORATORY_MENU]"
      >
        <div class="card-icon">
          <IconLabPanel />
        </div>
        <div class="card-content">
          <div class="card-title">Xét nghiệm</div>
          <div class="card-description">Quản lý thông tin, giá xét nghiệm</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'Radiology' })"
        v-if="userPermission[PermissionId.RADIOLOGY_MENU]"
      >
        <div class="card-icon">
          <IconPulmonology />
        </div>
        <div class="card-content">
          <div class="card-title">Chẩn đoán hình ảnh</div>
          <div class="card-description">
            Quản lý thông tin, giá, nội dung phiếu chẩn đoán hình ảnh
          </div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'PrintHtml' })"
        v-if="userPermission[PermissionId.MASTER_DATA_PRINT_HTML]"
      >
        <div class="card-icon">
          <IconPrint />
        </div>
        <div class="card-content">
          <div class="card-title">Cài đặt mẫu in</div>
          <div class="card-description">
            Quản lý cách hiển thị mẫu in cho phiếu xét nghiệm, CĐHA, hóa đơn, ...
          </div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'MasterDataRoom' })"
        v-if="userPermission[PermissionId.MASTER_DATA_ROOM]"
      >
        <div class="card-icon">
          <IconWarehouse />
        </div>
        <div class="card-content">
          <div class="card-title">Danh sách phòng</div>
          <div class="card-description">Quản lý danh sách khoa, phòng</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'Warehouse' })"
        v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE]"
      >
        <div class="card-icon">
          <IconWarehouse />
        </div>
        <div class="card-content">
          <div class="card-title">Danh sách kho</div>
          <div class="card-description">Quản lý thông tin, danh sách kho</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'Discount' })"
        v-if="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
      >
        <div class="card-icon">
          <IconDollar />
        </div>
        <div class="card-content">
          <div class="card-title">Chương trình khuyến mại</div>
          <div class="card-description">
            Cài đặt số tiền khuyến mại cho mỗi loại mặt hàng, thời gian khuyến mại ...
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-4 mx-4 bg-white">
    <div class="px-4 py-4 text-lg font-medium" style="border-bottom: 1px solid #dfdfdf">
      2. Danh mục phụ
    </div>
    <div class="p-4 flex flex-wrap gap-4">
      <div
        class="card"
        @click="router.push({ name: 'PaymentMethod' })"
        v-if="userPermission[PermissionId.MASTER_DATA_PAYMENT_METHOD]"
      >
        <div class="card-icon">
          <IconDollar />
        </div>
        <div class="card-content">
          <div class="card-title">Phương thức thanh toán</div>
          <div class="card-description">
            Các phương thức thanh toán như: Tiền mặt, chuyển khoản, ...
          </div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'CustomerSource' })"
        v-if="userPermission[PermissionId.MASTER_DATA_CUSTOMER_SOURCE]"
      >
        <div class="card-icon">
          <IconUser />
        </div>
        <div class="card-content">
          <div class="card-title">Nguồn khách hàng</div>
          <div class="card-description">Quản lý danh sách nguồn khách hàng</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'PrescriptionSample' })"
        v-if="userPermission[PermissionId.MASTER_DATA_PRESCRIPTION_SAMPLE]"
      >
        <div class="card-icon">
          <IconTool />
        </div>
        <div class="card-content">
          <div class="card-title">Đơn thuốc mẫu</div>
          <div class="card-description">Quản lý danh sách các đơn thuốc mẫu đã tạo</div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'LaboratorySample' })"
        v-if="userPermission[PermissionId.LABORATORY_SAMPLE_CRUD]"
      >
        <div class="card-icon">
          <IconLabPanel />
        </div>
        <div class="card-content">
          <div class="card-title">Bộ chỉ định xét nghiệm mẫu</div>
          <div class="card-description">
            Quản lý danh sách các bộ xét nghiệm phục vụ chỉ định nhanh xét nghiệm
          </div>
        </div>
      </div>

      <div
        class="card"
        @click="router.push({ name: 'RadiologySample' })"
        v-if="userPermission[PermissionId.RADIOLOGY_SAMPLE_CRUD]"
      >
        <div class="card-icon">
          <IconPulmonology />
        </div>
        <div class="card-content">
          <div class="card-title">Mẫu kết quả phiếu CĐHA</div>
          <div class="card-description">
            Quản lý danh sách các bộ xét nghiệm phục vụ chỉ định nhanh xét nghiệm
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  flex-grow: 1;
  flex-basis: 20%;
  min-width: 300px;
  padding: 1em;
  gap: 1em;
  display: flex;
  // align-items: center;
  background-color: #e6f4ff;
  cursor: pointer;
  .card-icon {
    font-size: 24px;
    color: #1677ff;
  }
  .card-content {
    .card-title {
      font-weight: 500;
    }
    .card-description {
      margin-top: 0.5em;
      color: #555;
      font-size: 0.9em;
    }
  }
}
</style>
