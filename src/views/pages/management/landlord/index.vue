<script setup lang="ts">
defineOptions({name: 'LandlordManagement'})

import {ref, reactive, onMounted} from 'vue'
import {message, Modal} from 'ant-design-vue'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
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

// ==================== 列表相关 ====================
const loading = ref(false)
const dataSource = ref<LandlordApplicationItem[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})
const activeTab = ref<string>('ALL')

const columns = [
  {title: '用户名', dataIndex: 'username', width: 120},
  {title: '昵称', dataIndex: 'nickname', width: 120},
  {title: '手机号', dataIndex: 'phone', width: 140},
  {title: '证明资料', key: 'proofImages', width: 120},
  {title: '备注', dataIndex: 'remark', width: 160, ellipsis: true},
  {title: '状态', key: 'status', width: 100},
  {title: '申请时间', dataIndex: 'createdAt', width: 180},
  {title: '操作', key: 'action', width: 180, fixed: 'right' as const},
]

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

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="landlord-page">
    <!-- 头部 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">房东申请审核</h2>
        <p class="page-description">审核用户提交的房东权限申请</p>
      </div>
    </div>

    <!-- 状态筛选 -->
    <a-tabs :active-key="activeTab" @change="handleTabChange" class="mb-4">
      <a-tab-pane key="ALL" tab="全部"/>
      <a-tab-pane key="PENDING" tab="待审核"/>
      <a-tab-pane key="APPROVED" tab="已通过"/>
      <a-tab-pane key="REJECTED" tab="已拒绝"/>
    </a-tabs>

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
        :scroll="{ x: 1100 }"
        row-key="id"
        @change="handleTableChange"
    >
      <!-- 证明资料列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'proofImages'">
          <div class="proof-images" v-if="record.proofImages?.length">
            <a-image-preview-group>
              <div class="image-thumbs">
                <img
                    v-for="(img, idx) in record.proofImages.slice(0, 3)"
                    :key="idx"
                    :src="img"
                    class="thumb-img"
                    @click="showImagePreview(record.proofImages, idx)"
                />
                <span v-if="record.proofImages.length > 3" class="more-count">
                  +{{ record.proofImages.length - 3 }}
                </span>
              </div>
            </a-image-preview-group>
          </div>
          <span v-else class="text-gray-400">无</span>
        </template>

        <!-- 状态列 -->
        <template v-if="column.key === 'status'">
          <a-tag :color="LandlordApplicationStatusColorMap[record.status as LandlordApplicationStatusEnum]">
            {{ LandlordApplicationStatusNameMap[record.status as LandlordApplicationStatusEnum] }}
          </a-tag>
        </template>

        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="showReviewModal(record)">
              <EyeOutlined/>
              详情
            </a-button>
            <template v-if="record.status === LandlordApplicationStatusEnum.PENDING">
              <a-button size="small" type="primary" @click="quickApprove(record)">
                <CheckCircleOutlined/>
                通过
              </a-button>
              <a-button size="small" danger @click="showReviewModal(record)">
                <CloseCircleOutlined/>
                拒绝
              </a-button>
            </template>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 审核详情弹窗 -->
    <a-modal
        v-model:open="reviewModalVisible"
        title="申请详情"
        :footer="null"
        width="680px"
    >
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

        <!-- 证明资料图片 -->
        <div class="proof-section">
          <h4 class="section-title">证明资料（{{ currentApplication.proofImages?.length || 0 }}张）</h4>
          <div class="proof-grid" v-if="currentApplication.proofImages?.length">
            <div
                v-for="(img, idx) in currentApplication.proofImages"
                :key="idx"
                class="proof-item"
                @click="showImagePreview(currentApplication!.proofImages, idx)"
            >
              <img :src="img" :alt="`证明资料${idx + 1}`"/>
            </div>
          </div>
          <a-empty v-else description="无证明资料"/>
        </div>

        <!-- 审核操作（仅待审核状态） -->
        <div v-if="currentApplication.status === LandlordApplicationStatusEnum.PENDING" class="review-actions">
          <a-divider/>
          <div class="reject-input">
            <a-textarea
                v-model:value="rejectReason"
                placeholder="如需拒绝，请输入拒绝原因"
                :rows="2"
                :maxlength="500"
                show-count
            />
          </div>
          <div class="action-buttons">
            <a-button danger :loading="reviewLoading" @click="handleReject">
              <CloseCircleOutlined/>
              拒绝
            </a-button>
            <a-button type="primary" :loading="reviewLoading" @click="handleApprove">
              <CheckCircleOutlined/>
              通过
            </a-button>
          </div>
        </div>
      </template>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal
        v-model:open="previewVisible"
        :footer="null"
        width="80%"
        :bodyStyle="{ padding: '12px', textAlign: 'center' }"
    >
      <img
          v-if="previewImages.length > 0"
          :src="previewImages[previewIndex]"
          alt="预览"
          class="preview-image"
      />
      <div v-if="previewImages.length > 1" class="preview-nav">
        <a-button
            :disabled="previewIndex === 0"
            @click="previewIndex--"
        >上一张
        </a-button>
        <span class="preview-counter">{{ previewIndex + 1 }} / {{ previewImages.length }}</span>
        <a-button
            :disabled="previewIndex === previewImages.length - 1"
            @click="previewIndex++"
        >下一张
        </a-button>
      </div>
    </a-modal>

  </div>
</template>

<style scoped lang="scss">
.landlord-page {
  @apply p-6 min-h-screen bg-gray-50;

  .page-header {
    @apply flex justify-between items-start mb-4;

    .page-title {
      @apply text-2xl font-bold text-gray-800 mb-1;
    }

    .page-description {
      @apply text-sm text-gray-500;
    }
  }

  .proof-images {
    .image-thumbs {
      @apply flex items-center gap-1;

      .thumb-img {
        @apply w-8 h-8 rounded object-cover cursor-pointer border border-gray-200;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.1);
        }
      }

      .more-count {
        @apply text-xs text-gray-400 ml-1;
      }
    }
  }
}

.proof-section {
  .section-title {
    @apply text-sm font-medium text-gray-700 mb-3;
  }

  .proof-grid {
    @apply grid grid-cols-5 gap-2;

    .proof-item {
      @apply aspect-square rounded-lg overflow-hidden cursor-pointer border border-gray-200;
      transition: all 0.2s;

      &:hover {
        @apply border-blue-400 shadow-md;
      }

      img {
        @apply w-full h-full object-cover;
      }
    }
  }
}

.review-actions {
  .reject-input {
    @apply mb-4;
  }

  .action-buttons {
    @apply flex justify-end gap-3;
  }
}

.preview-image {
  @apply max-w-full max-h-[70vh] object-contain rounded;
}

.preview-nav {
  @apply flex items-center justify-center gap-4 mt-4;

  .preview-counter {
    @apply text-gray-500 text-sm;
  }
}
</style>
