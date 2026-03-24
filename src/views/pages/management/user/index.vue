<script setup lang="ts">
defineOptions({name: 'UserManagement'})

import {ref, reactive, onMounted, computed} from 'vue'
import {message, Modal} from 'ant-design-vue'
import {
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DownOutlined,
  HomeOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import userApi, {type UserAdminItem, type UserPageReq} from '@/common/apis/userApi'
import {RoleEnum, RoleNameMap} from '@/common/enums/roleEnum'
import ImageUpload from '@/components/ImageUpload.vue'

// ==================== 列表 ====================
const loading = ref(false)
const dataSource = ref<UserAdminItem[]>([])
const pagination = reactive({current: 1, pageSize: 10, total: 0})
const searchKeyword = ref('')
const stateFilter = ref<string | null>(null)

const columns = [
  {title: '用户名', dataIndex: 'username', width: 120},
  {title: '昵称', dataIndex: 'nickname', width: 120},
  {title: '手机号', dataIndex: 'phone', width: 140},
  {title: '角色', key: 'roles', width: 200},
  {title: '状态', key: 'state', width: 90},
  {title: '注册时间', dataIndex: 'createdAt', width: 180},
  {title: '操作', key: 'action', width: 100, fixed: 'right' as const},
]

const fetchData = async () => {
  loading.value = true
  try {
    const params: UserPageReq = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value || undefined,
      state: stateFilter.value,
    }
    const res = await userApi.getUserPage(params)
    if (res.succeed) {
      dataSource.value = res.data.list
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

// ==================== 编辑用户信息 ====================
const editModalVisible = ref(false)
const editForm = reactive({userId: '', nickname: '', email: ''})
const editLoading = ref(false)

const openEditModal = (record: UserAdminItem) => {
  editForm.userId = record.id
  editForm.nickname = record.nickname
  editForm.email = record.email
  editModalVisible.value = true
}

const handleEditSave = async () => {
  editLoading.value = true
  try {
    const res = await userApi.updateUserInfo({
      userId: editForm.userId,
      nickname: editForm.nickname,
      email: editForm.email,
    })
    if (res.succeed) {
      message.success('信息已更新')
      editModalVisible.value = false
      fetchData()
    }
  } finally {
    editLoading.value = false
  }
}

// ==================== 状态切换 ====================
const toggleState = (record: UserAdminItem) => {
  const newState = record.state === '1' ? '0' : '1'
  const actionText = newState === '0' ? '禁用' : '启用'
  Modal.confirm({
    title: `确认${actionText}`,
    content: `确定${actionText}用户「${record.nickname || record.username}」吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      const res = await userApi.updateUserState({userId: record.id, state: newState})
      if (res.succeed) {
        message.success(`已${actionText}`)
        fetchData()
      }
    },
  })
}

// ==================== 角色管理 ====================
const roleModalVisible = ref(false)
const roleForm = reactive({userId: '', roleCodes: [] as string[]})
const roleLoading = ref(false)

const allRoles = computed(() => [
  {code: RoleEnum.ADMIN, name: RoleNameMap[RoleEnum.ADMIN]},
  {code: RoleEnum.USER, name: RoleNameMap[RoleEnum.USER]},
  {code: RoleEnum.TENANT, name: RoleNameMap[RoleEnum.TENANT]},
  {code: RoleEnum.LANDLORD, name: RoleNameMap[RoleEnum.LANDLORD]},
])

const openRoleModal = (record: UserAdminItem) => {
  roleForm.userId = record.id
  roleForm.roleCodes = record.roles.map(r => r.roleCode)
  roleModalVisible.value = true
}

const handleRoleSave = async () => {
  if (roleForm.roleCodes.length === 0) {
    message.warning('请至少选择一个角色')
    return
  }
  roleLoading.value = true
  try {
    const res = await userApi.updateUserRoles({userId: roleForm.userId, roleCodes: roleForm.roleCodes})
    if (res.succeed) {
      message.success('角色已更新')
      roleModalVisible.value = false
      fetchData()
    }
  } finally {
    roleLoading.value = false
  }
}

// ==================== 设置房东（抽屉） ====================
const landlordDrawerVisible = ref(false)
const landlordForm = reactive({userId: '', userName: '', proofImages: [] as string[], remark: ''})
const landlordLoading = ref(false)

const openLandlordDrawer = (record: UserAdminItem) => {
  landlordForm.userId = record.id
  landlordForm.userName = record.nickname || record.username
  landlordForm.proofImages = []
  landlordForm.remark = ''
  landlordDrawerVisible.value = true
}

const handleSetLandlord = async () => {
  landlordLoading.value = true
  try {
    const res = await userApi.setLandlord({
      userId: landlordForm.userId,
      proofImages: landlordForm.proofImages.length > 0 ? landlordForm.proofImages : undefined,
      remark: landlordForm.remark || undefined,
    })
    if (res.succeed) {
      message.success('已设置为房东')
      landlordDrawerVisible.value = false
      fetchData()
    }
  } finally {
    landlordLoading.value = false
  }
}

// ==================== 操作菜单 ====================
const isLandlord = (record: UserAdminItem) => record.roles.some(r => r.roleCode === 'LANDLORD')

const handleMenuClick = (key: string, record: UserAdminItem) => {
  switch (key) {
    case 'edit':
      openEditModal(record)
      break
    case 'roles':
      openRoleModal(record)
      break
    case 'toggle-state':
      toggleState(record)
      break
    case 'set-landlord':
      openLandlordDrawer(record)
      break
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="user-page">
    <!-- 头部 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">用户管理</h2>
        <p class="page-description">管理用户信息、角色和状态</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索用户名或昵称"
          allow-clear
          style="width: 280px"
          @search="handleSearch"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input-search>
      <a-select
          v-model:value="stateFilter"
          placeholder="状态筛选"
          allow-clear
          style="width: 120px"
          @change="handleSearch"
      >
        <a-select-option value="1">启用</a-select-option>
        <a-select-option value="0">禁用</a-select-option>
      </a-select>
    </div>

    <!-- 数据表格 -->
    <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{x: 1000}"
        row-key="id"
        @change="handleTableChange"
    >
      <template #bodyCell="{column, record}">
        <!-- 角色列 -->
        <template v-if="column.key === 'roles'">
          <a-tag v-for="role in record.roles" :key="role.roleCode" class="mr-1 mb-1">
            {{ role.roleName }}
          </a-tag>
          <span v-if="!record.roles?.length" class="text-gray-400">无角色</span>
        </template>

        <!-- 状态列 -->
        <template v-if="column.key === 'state'">
          <a-tag :color="record.state === '1' ? 'green' : 'red'">
            {{ record.state === '1' ? '启用' : '禁用' }}
          </a-tag>
        </template>

        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-dropdown :trigger="['hover']">
            <a class="action-link" @click.prevent>
              操作 <DownOutlined/>
            </a>
            <template #overlay>
              <a-menu @click="(info: any) => handleMenuClick(info.key, record)">
                <a-menu-item key="edit"><EditOutlined/> 编辑信息</a-menu-item>
                <a-menu-item key="roles"><EditOutlined/> 管理角色</a-menu-item>
                <a-menu-item key="toggle-state">
                  <template v-if="record.state === '1'"><StopOutlined/> 禁用</template>
                  <template v-else><CheckCircleOutlined/> 启用</template>
                </a-menu-item>
                <a-menu-divider v-if="!isLandlord(record)"/>
                <a-menu-item v-if="!isLandlord(record)" key="set-landlord">
                  <HomeOutlined/> 设置为房东
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- 编辑信息弹窗 -->
    <a-modal v-model:open="editModalVisible" title="编辑用户信息" @ok="handleEditSave" :confirm-loading="editLoading">
      <a-form layout="vertical">
        <a-form-item label="昵称">
          <a-input v-model:value="editForm.nickname" placeholder="请输入昵称"/>
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="editForm.email" placeholder="请输入邮箱"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 角色管理弹窗 -->
    <a-modal v-model:open="roleModalVisible" title="管理角色" @ok="handleRoleSave" :confirm-loading="roleLoading">
      <a-checkbox-group v-model:value="roleForm.roleCodes" class="role-checkbox-group">
        <a-checkbox v-for="role in allRoles" :key="role.code" :value="role.code">
          {{ role.name }}
        </a-checkbox>
      </a-checkbox-group>
    </a-modal>

    <!-- 设置房东抽屉 -->
    <a-drawer
        v-model:open="landlordDrawerVisible"
        :title="`设置「${landlordForm.userName}」为房东`"
        width="480"
        :footer-style="{textAlign: 'right'}"
    >
      <a-form layout="vertical">
        <a-form-item label="证明资料（可选，最多10张）">
          <ImageUpload v-model="landlordForm.proofImages" :max-count="10"/>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="landlordForm.remark" placeholder="请输入备注" :rows="3" :maxlength="500" show-count/>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button class="mr-2" @click="landlordDrawerVisible = false">取消</a-button>
        <a-button type="primary" :loading="landlordLoading" @click="handleSetLandlord">确认设置</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  @apply p-6 min-h-screen bg-gray-50;

  .page-header {
    @apply mb-4;
    .page-title { @apply text-2xl font-bold text-gray-800 mb-1; }
    .page-description { @apply text-sm text-gray-500; }
  }

  .search-bar {
    @apply flex gap-3 mb-4;
  }

  .action-link {
    @apply text-blue-500 cursor-pointer select-none;
  }

  .role-checkbox-group {
    @apply flex flex-col gap-2;
  }
}
</style>
