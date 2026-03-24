<script setup lang="ts">
defineOptions({name: 'UserManagement'})

import {ref, reactive, onMounted} from 'vue'
import {message, Modal} from 'ant-design-vue'
import {
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DownOutlined,
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import userApi, {type UserAdminItem, type UserPageReq} from '@/common/apis/userApi'
import ImageUpload from '@/components/ImageUpload.vue'

// ==================== 列表 ====================
const loading = ref(false)
const dataSource = ref<UserAdminItem[]>([])
const pagination = reactive({current: 1, pageSize: 12, total: 0})
const searchKeyword = ref('')
const stateFilter = ref<string | null>(null)

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

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page
  pagination.pageSize = pageSize
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

// ==================== 工具 ====================
const isLandlord = (record: UserAdminItem) => record.roles.some(r => r.roleCode === 'LANDLORD')

const handleMenuClick = (key: string, record: UserAdminItem) => {
  switch (key) {
    case 'edit':
      openEditModal(record)
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
        <template #prefix><SearchOutlined/></template>
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

    <!-- 网格布局 -->
    <a-spin :spinning="loading">
      <div class="user-grid">
        <div v-for="user in dataSource" :key="user.id" class="user-card">
          <!-- 头像 + 基本信息 -->
          <div class="card-top">
            <a-avatar :size="48" :src="user.avatar || undefined">
              <template #icon><UserOutlined/></template>
            </a-avatar>
            <div class="card-info">
              <div class="card-name">{{ user.nickname || user.username }}</div>
              <div class="card-sub">{{ user.phone }}</div>
            </div>
            <!-- 操作下拉 -->
            <a-dropdown :trigger="['hover']" placement="bottomRight">
              <a class="action-trigger" @click.prevent>
                <DownOutlined/>
              </a>
              <template #overlay>
                <a-menu @click="(info: any) => handleMenuClick(info.key, user)">
                  <a-menu-item key="edit"><EditOutlined/> 编辑信息</a-menu-item>
                  <a-menu-item key="toggle-state">
                    <template v-if="user.state === '1'"><StopOutlined/> 禁用</template>
                    <template v-else><CheckCircleOutlined/> 启用</template>
                  </a-menu-item>
                  <a-menu-divider v-if="!isLandlord(user)"/>
                  <a-menu-item v-if="!isLandlord(user)" key="set-landlord">
                    <HomeOutlined/> 设置为房东
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <!-- 角色标签 -->
          <div class="card-roles">
            <a-tag v-for="role in user.roles" :key="role.roleCode" size="small">{{ role.roleName }}</a-tag>
            <span v-if="!user.roles?.length" class="text-gray-400 text-xs">无角色</span>
          </div>

          <!-- 底部信息 -->
          <div class="card-footer">
            <a-tag :color="user.state === '1' ? 'green' : 'red'" size="small">
              {{ user.state === '1' ? '启用' : '禁用' }}
            </a-tag>
            <span class="card-time">{{ user.createdAt?.slice(0, 10) }}</span>
          </div>
        </div>
      </div>

      <a-empty v-if="!loading && dataSource.length === 0" class="mt-10"/>
    </a-spin>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="pagination.total > 0">
      <a-pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          show-size-changer
          :show-total="(total: number) => `共 ${total} 条`"
          @change="handlePageChange"
      />
    </div>

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

  .search-bar { @apply flex gap-3 mb-5; }
}

.user-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.user-card {
  @apply bg-white rounded-xl p-4 border border-gray-100 shadow-sm;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover {
    @apply shadow-md;
    transform: translateY(-2px);
  }

  .card-top {
    @apply flex items-center gap-3 mb-3;

    .card-info {
      @apply flex-1 min-w-0;
      .card-name { @apply text-sm font-semibold text-gray-800 truncate; }
      .card-sub { @apply text-xs text-gray-400 truncate; }
    }

    .action-trigger {
      @apply w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors;
    }
  }

  .card-roles {
    @apply mb-3 flex flex-wrap gap-1;
  }

  .card-footer {
    @apply flex items-center justify-between;
    .card-time { @apply text-xs text-gray-400; }
  }
}

.pagination-wrap {
  @apply flex justify-end mt-6;
}
</style>
