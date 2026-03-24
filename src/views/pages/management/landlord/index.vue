<script setup lang="ts">
defineOptions({name: 'LandlordManagement'})

import {ref, reactive, onMounted} from 'vue'
import {message, Modal} from 'ant-design-vue'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import landlordApplicationApi, {
  type LandlordApplicationItem,
  type ApplicationPageReq,
} from '@/common/apis/landlordApplicationApi'
import {
  LandlordApplicationStatusEnum,
  LandlordApplicationStatusNameMap,
  LandlordApplicationStatusColorMap,
} from '@/common/enums/landlordApplicationEnum'

// ==================== 列表 ====================
const loading = ref(false)
const dataSource = ref<LandlordApplicationItem[]>([])
const pagination = reactive({current: 1, pageSize: 12, total: 0})
const activeTab = ref<string>('ALL')

const fetchData = async () => {
  loading.value = true
  try {
    const params: ApplicationPageReq = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      status: activeTab.value === 'ALL' ? null : activeTab.value as LandlordApplicationStatusEnum,
    }
    const res = await landlordApplicationApi.getApplicationPage(params)
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

const handleTabChange = (key: string) => {
  activeTab.value = key
  pagination.current = 1
  fetchData()
}

// ==================== 审核弹窗 ====================
const reviewModalVisible = ref(false)
const currentApplication = ref<LandlordApplicationItem | null>(null)
const rejectReason = ref('')
const reviewLoading = ref(false)

const showReviewModal = (record: LandlordApplicationItem) => {
  currentApplication.value = record
  rejectReason.value = ''
  reviewModalVisible.value = true
}

const handleApprove = async () => {
  if (!currentApplication.value) return
  reviewLoading.value = true
  try {
    const res = await landlordApplicationApi.reviewApplication({
      applicationId: currentApplication.value.id,
      approved: true,
    })
    if (res.succeed) {
      message.success('已通过该房东申请')
      reviewModalVisible.value = false
      fetchData()
    }
  } finally {
    reviewLoading.value = false
  }
}

const handleReject = async () => {
  if (!currentApplication.value) return
  if (!rejectReason.value.trim()) {
    message.warning('请输入拒绝原因')
    return
  }
  reviewLoading.value = true
  try {
    const res = await landlordApplicationApi.reviewApplication({
      applicationId: currentApplication.value.id,
      approved: false,
      rejectReason: rejectReason.value,
    })
    if (res.succeed) {
      message.success('已拒绝该房东申请')
      reviewModalVisible.value = false
      fetchData()
    }
  } finally {
    reviewLoading.value = false
  }
}

// ==================== 图片预览 ====================
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

const showImagePreview = (images: string[], index = 0) => {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}

// ==================== 快速审核 ====================
const quickApprove = (record: LandlordApplicationItem) => {
  Modal.confirm({
    title: '确认通过',
    content: `确定通过用户「${record.nickname || record.username}」的房东申请吗？`,
    okText: '通过',
    cancelText: '取消',
    onOk: async () => {
      const res = await landlordApplicationApi.reviewApplication({
        applicationId: record.id,
        approved: true,
      })
      if (res.succeed) {
        message.success('已通过')
        fetchData()
      }
    },
  })
}

onMounted(() => fetchData())
</script>

<template>
  <div class="landlord-page">
    <!-- 头部 -->
    <div class="page-header">
      <h2 class="page-title">房东申请审核</h2>
      <p class="page-description">审核用户提交的房东权限申请</p>
    </div>

    <!-- 状态筛选 -->
    <a-tabs :active-key="activeTab" @change="handleTabChange" class="mb-4">
      <a-tab-pane key="ALL" tab="全部"/>
      <a-tab-pane key="PENDING" tab="待审核"/>
      <a-tab-pane key="APPROVED" tab="已通过"/>
      <a-tab-pane key="REJECTED" tab="已拒绝"/>
    </a-tabs>

    <!-- 网格布局 -->
    <a-spin :spinning="loading">
      <div class="app-grid">
        <div v-for="item in dataSource" :key="item.id" class="app-card">
          <!-- 顶部: 用户信息 + 状态 -->
          <div class="card-top">
            <div class="card-user">
              <a-avatar :size="40"><template #icon><UserOutlined/></template></a-avatar>
              <div class="card-info">
                <div class="card-name">{{ item.nickname || item.username }}</div>
                <div class="card-sub">{{ item.phone }}</div>
              </div>
            </div>
            <a-tag :color="LandlordApplicationStatusColorMap[item.status as LandlordApplicationStatusEnum]" size="small">
              {{ LandlordApplicationStatusNameMap[item.status as LandlordApplicationStatusEnum] }}
            </a-tag>
          </div>

          <!-- 证明资料缩略图 -->
          <div class="card-images" v-if="item.proofImages?.length">
            <img
                v-for="(img, idx) in item.proofImages.slice(0, 4)"
                :key="idx"
                :src="img"
                class="thumb"
                @click="showImagePreview(item.proofImages, idx)"
            />
            <span v-if="item.proofImages.length > 4" class="more">+{{ item.proofImages.length - 4 }}</span>
          </div>
          <div v-else class="card-images-empty">无证明资料</div>

          <!-- 备注 -->
          <div class="card-remark" v-if="item.remark">{{ item.remark }}</div>

          <!-- 底部: 时间 + 操作 -->
          <div class="card-footer">
            <span class="card-time">{{ item.createdAt?.slice(0, 10) }}</span>
            <div class="card-actions">
              <a-button size="small" type="text" @click="showReviewModal(item)">
                <EyeOutlined/> 详情
              </a-button>
              <template v-if="item.status === LandlordApplicationStatusEnum.PENDING">
                <a-button size="small" type="link" @click="quickApprove(item)">
                  <CheckCircleOutlined/> 通过
                </a-button>
                <a-button size="small" type="link" danger @click="showReviewModal(item)">
                  <CloseCircleOutlined/> 拒绝
                </a-button>
              </template>
            </div>
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

    <!-- 审核详情弹窗 -->
    <a-modal v-model:open="reviewModalVisible" title="申请详情" :footer="null" width="680px">
      <template v-if="currentApplication">
        <a-descriptions :column="2" bordered size="small" class="mb-4">
          <a-descriptions-item label="用户名">{{ currentApplication.username }}</a-descriptions-item>
          <a-descriptions-item label="昵称">{{ currentApplication.nickname }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ currentApplication.phone }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="LandlordApplicationStatusColorMap[currentApplication.status]">
              {{ LandlordApplicationStatusNameMap[currentApplication.status] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="申请时间" :span="2">{{ currentApplication.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ currentApplication.remark || '无' }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApplication.rejectReason" label="拒绝原因" :span="2">
            {{ currentApplication.rejectReason }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="proof-section">
          <h4 class="section-title">证明资料（{{ currentApplication.proofImages?.length || 0 }}张）</h4>
          <div class="proof-grid" v-if="currentApplication.proofImages?.length">
            <div v-for="(img, idx) in currentApplication.proofImages" :key="idx" class="proof-item"
                 @click="showImagePreview(currentApplication!.proofImages, idx)">
              <img :src="img" :alt="`证明资料${idx + 1}`"/>
            </div>
          </div>
          <a-empty v-else description="无证明资料"/>
        </div>

        <div v-if="currentApplication.status === LandlordApplicationStatusEnum.PENDING" class="review-actions">
          <a-divider/>
          <a-textarea v-model:value="rejectReason" placeholder="如需拒绝，请输入拒绝原因" :rows="2" :maxlength="500"
                      show-count class="mb-4"/>
          <div class="action-buttons">
            <a-button danger :loading="reviewLoading" @click="handleReject"><CloseCircleOutlined/> 拒绝</a-button>
            <a-button type="primary" :loading="reviewLoading" @click="handleApprove"><CheckCircleOutlined/> 通过</a-button>
          </div>
        </div>
      </template>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal v-model:open="previewVisible" :footer="null" width="80%"
             :bodyStyle="{padding: '12px', textAlign: 'center'}">
      <img v-if="previewImages.length > 0" :src="previewImages[previewIndex]" alt="预览" class="preview-image"/>
      <div v-if="previewImages.length > 1" class="preview-nav">
        <a-button :disabled="previewIndex === 0" @click="previewIndex--">上一张</a-button>
        <span class="preview-counter">{{ previewIndex + 1 }} / {{ previewImages.length }}</span>
        <a-button :disabled="previewIndex === previewImages.length - 1" @click="previewIndex++">下一张</a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.landlord-page {
  @apply p-6 min-h-screen bg-gray-50;

  .page-header {
    @apply mb-4;
    .page-title { @apply text-2xl font-bold text-gray-800 mb-1; }
    .page-description { @apply text-sm text-gray-500; }
  }
}

.app-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.app-card {
  @apply bg-white rounded-xl p-4 border border-gray-100 shadow-sm;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover {
    @apply shadow-md;
    transform: translateY(-2px);
  }

  .card-top {
    @apply flex items-center justify-between mb-3;

    .card-user {
      @apply flex items-center gap-3;
      .card-info {
        .card-name { @apply text-sm font-semibold text-gray-800; }
        .card-sub { @apply text-xs text-gray-400; }
      }
    }
  }

  .card-images {
    @apply flex items-center gap-1 mb-3;

    .thumb {
      @apply w-12 h-12 rounded object-cover cursor-pointer border border-gray-200;
      transition: transform 0.2s;
      &:hover { transform: scale(1.1); }
    }
    .more { @apply text-xs text-gray-400 ml-1; }
  }

  .card-images-empty { @apply text-xs text-gray-400 mb-3; }

  .card-remark {
    @apply text-xs text-gray-500 mb-3 line-clamp-2;
  }

  .card-footer {
    @apply flex items-center justify-between border-t border-gray-50 pt-3;
    .card-time { @apply text-xs text-gray-400; }
    .card-actions { @apply flex items-center gap-1; }
  }
}

.proof-section {
  .section-title { @apply text-sm font-medium text-gray-700 mb-3; }
  .proof-grid {
    @apply grid grid-cols-5 gap-2;
    .proof-item {
      @apply aspect-square rounded-lg overflow-hidden cursor-pointer border border-gray-200;
      transition: all 0.2s;
      &:hover { @apply border-blue-400 shadow-md; }
      img { @apply w-full h-full object-cover; }
    }
  }
}

.review-actions {
  .action-buttons { @apply flex justify-end gap-3; }
}

.preview-image { @apply max-w-full max-h-[70vh] object-contain rounded; }
.preview-nav {
  @apply flex items-center justify-center gap-4 mt-4;
  .preview-counter { @apply text-gray-500 text-sm; }
}

.pagination-wrap { @apply flex justify-end mt-6; }
</style>
