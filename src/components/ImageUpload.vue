<script setup lang="ts">
defineOptions({
  name: 'ImageUpload'
})

/**
 * 通用图片上传组件
 * 专门用于图片上传，双向绑定 string[]
 * 统一处理图片上传逻辑、预览、删除等功能
 */
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import type { UploadFile, UploadChangeParam } from 'ant-design-vue'
import fileApi from '@/common/apis/fileApi'

interface Props {
  modelValue: string[]
  accept?: string // 接受的图片类型，如 'image/*', 'image/jpeg,image/png'
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle' // 上传列表的内建样式
  maxCount?: number // 最大图片数量，0表示无限制
  multiple?: boolean // 是否支持多选图片
  disabled?: boolean // 是否禁用
  showPreview?: boolean // 是否显示预览功能
  uploadText?: string // 上传按钮文字
  placeholder?: string // 占位符文字
  size?: 'small' | 'middle' | 'large' // 组件大小
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  listType: 'picture-card',
  maxCount: 0,
  multiple: true,
  disabled: false,
  showPreview: true,
  uploadText: '上传图片',
  placeholder: '支持 JPG、PNG、GIF、WEBP 格式',
  size: 'middle'
})

const emit = defineEmits<Emits>()

// 上传状态
const uploading = ref(false)

// 文件列表
const fileList = ref<UploadFile[]>([])

// 预览相关
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

// 上传成功提示：存储刚上传成功的图片 URL
const successUrls = ref<Set<string>>(new Set())

// 将URL转换为UploadFile格式
const urlToUploadFile = (url: string, index: number): UploadFile => ({
  uid: `${Date.now()}-${index}`,
  name: url.substring(url.lastIndexOf('/') + 1),
  status: 'done',
  url,
  response: url
})

// 监听modelValue变化，同步到fileList
watch(() => props.modelValue, (newUrls) => {
  if (!newUrls || newUrls.length === 0) {
    fileList.value = []
    return
  }

  fileList.value = newUrls.map((url, index) => urlToUploadFile(url, index))
}, { immediate: true, deep: true })

// 验证图片文件
const validateImageFile = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('图片大小必须小于 10MB！')
    return false
  }

  return true
}

// 自定义上传请求
const customRequest = async (options: any) => {
  const { file, onSuccess, onError, onProgress } = options

  // 验证图片文件
  if (!validateImageFile(file)) {
    onError(new Error('图片验证失败'))
    return
  }

  try {
    uploading.value = true

    const result = await fileApi.upload(file, {
      onProgress: (progress) => {
        onProgress({ percent: progress })
      }
    })

    const url = result.fileUrl

    // 检查是否为重复上传
    if (props.modelValue.includes(url)) {
      message.warning('该图片已存在，请勿重复上传')
      onError(new Error('重复上传'))
      return
    }

    onSuccess(url, file)

    // 更新modelValue
    const newUrls = [...props.modelValue, url]
    emit('update:modelValue', newUrls)

    // 显示上传成功提示，1秒后隐藏
    successUrls.value.add(url)
    // 等待 DOM 更新后添加类名
    await nextTick()
    updateSuccessClass()
    
    setTimeout(() => {
      successUrls.value.delete(url)
      updateSuccessClass()
    }, 1000)
  } catch (error) {
    console.error('图片上传失败:', error)
    onError(error)

    if (error instanceof Error && error.message !== '重复上传') {
      message.error('图片上传失败，请重试')
    }
  } finally {
    uploading.value = false
  }
}

// 处理文件变化
const handleChange = (info: UploadChangeParam) => {
  const { fileList: newFileList } = info
  fileList.value = newFileList

  if (info.file.status === 'removed') {
    const removedUrl = info.file.response || info.file.url
    if (removedUrl) {
      const newUrls = props.modelValue.filter(url => url !== removedUrl)
      emit('update:modelValue', newUrls)
      // 移除时也清除成功提示
      successUrls.value.delete(removedUrl)
    }
  }
}

// 判断图片是否显示上传成功提示
const showSuccessTip = (file: UploadFile): boolean => {
  const url = file.response || file.url
  return url ? successUrls.value.has(url) : false
}

// 为上传成功的图片项添加类名
const updateSuccessClass = async () => {
  await nextTick()
  const uploadItems = document.querySelectorAll('.ant-upload-list-picture-card .ant-upload-list-item, .ant-upload-list .ant-upload-list-item')
  uploadItems.forEach((item) => {
    // 通过 data-url 属性来匹配
    const dataUrl = item.getAttribute('data-url')
    if (dataUrl && successUrls.value.has(dataUrl)) {
      item.classList.add('upload-success')
    } else {
      item.classList.remove('upload-success')
    }
  })
}

// 监听成功提示和文件列表变化
watch([successUrls, fileList], updateSuccessClass, { deep: true })

// 监听文件列表变化，为每个 item 添加 data-url 属性
watch(fileList, async () => {
  await nextTick()
  const uploadItems = document.querySelectorAll('.ant-upload-list-picture-card .ant-upload-list-item, .ant-upload-list .ant-upload-list-item')
  uploadItems.forEach((item, index) => {
    const file = fileList.value[index]
    if (file) {
      const url = file.response || file.url
      if (url) {
        item.setAttribute('data-url', url)
      }
    }
  })
  updateSuccessClass()
}, { deep: true })

// 预览图片
const handlePreview = async (file: UploadFile) => {
  if (!props.showPreview) return

  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj!)
  }

  const url = file.url || file.preview!
  previewImage.value = url
  previewVisible.value = true
  previewTitle.value = file.name || url.substring(url.lastIndexOf('/') + 1)
}

// 关闭预览
const handlePreviewCancel = () => {
  previewVisible.value = false
}

// 获取base64预览
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// 计算是否可以继续上传
const canUpload = computed(() => {
  if (props.maxCount === 0) return true
  return fileList.value.length < props.maxCount
})

// 上传按钮文字
const uploadButtonText = computed(() => {
  if (uploading.value) return '上传中...'
  if (props.maxCount === 1 && fileList.value.length > 0) return '更换图片'
  return props.uploadText
})
</script>

<template>
  <div class="image-upload-wrapper">
    <!-- picture-card 模式 -->
    <a-upload
        v-if="listType === 'picture-card'"
        v-model:file-list="fileList"
        :list-type="listType"
        :custom-request="customRequest"
        :accept="accept"
        :multiple="multiple && maxCount !== 1"
        :disabled="disabled"
        :show-upload-list="{ showPreviewIcon: showPreview, showRemoveIcon: !props.disabled }"
        @change="handleChange"
        @preview="handlePreview"
        class="flex items-center justify-center"
    >
      <div v-if="canUpload" class="upload-trigger">
        <PlusOutlined />
        <div class="ant-upload-text">{{ uploadButtonText }}</div>
      </div>
    </a-upload>

    <!-- 其他模式 -->
    <a-upload
        v-else
        v-model:file-list="fileList"
        class="flex items-center justify-center"
        :list-type="listType"
        :custom-request="customRequest"
        :accept="accept"
        :multiple="multiple && maxCount !== 1"
        :disabled="disabled"
        :show-upload-list="{ showPreviewIcon: showPreview, showRemoveIcon: !props.disabled }"
        @change="handleChange"
        @preview="handlePreview"
    >
      <a-button :loading="uploading" :disabled="disabled || !canUpload" :size="size">
        <UploadOutlined />
        {{ uploadButtonText }}
      </a-button>
    </a-upload>

    <!-- 提示信息 -->
    <div v-if="placeholder" class="upload-placeholder">
      {{ placeholder }}
    </div>

    <!-- 图片数量提示 -->
    <div v-if="maxCount > 0" class="upload-count-tip">
      {{ fileList.length }}/{{ maxCount }} 张图片
    </div>

    <!-- 预览模态框 -->
    <a-modal
        v-model:open="previewVisible"
        :footer="null"
        width="80%"
        @cancel="handlePreviewCancel"
    >
      <div class="preview-content">
        <img
            :src="previewImage"
            alt="预览"
            class="preview-image"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.image-upload-wrapper {
  .upload-trigger {
    @apply flex flex-col items-center justify-center p-4 text-gray-400 hover:text-gray-600 transition-colors;

    .ant-upload-text {
      @apply mt-2 text-sm;
    }
  }

  .upload-placeholder {
    @apply text-xs text-gray-500 mt-2;
  }

  .upload-count-tip {
    @apply text-xs text-gray-400 mt-1;
  }

  .preview-content {
    @apply flex justify-center items-center;

    .preview-image {
      @apply max-w-full max-h-96 rounded-md shadow-lg object-contain;
    }
  }
}

:deep(.ant-upload-select-picture-card) {
  @apply border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors;
}

:deep(.ant-upload-list-picture-card) {
  .ant-upload-list-item {
    @apply border border-gray-200 rounded-md;
    position: relative;
    overflow: hidden;
  }
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item-thumbnail) {
  @apply object-cover;
}

/* 修复预览和删除图标的居中问题 */
:deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  position: relative;
  overflow: hidden;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item-actions) {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
  margin: 0 !important;
  padding: 0 !important;
  width: auto !important;
  height: auto !important;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item:hover .ant-upload-list-item-actions) {
  opacity: 1;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item-actions .anticon) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
  color: #fff !important;
  font-size: 16px !important;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item-actions .anticon:hover) {
  background: rgba(0, 0, 0, 0.8) !important;
  transform: scale(1.15) !important;
}

/* 确保图片容器有正确的定位上下文 */
:deep(.ant-upload-list-picture-card .ant-upload-list-item-container) {
  position: relative;
}

/* 修复可能的定位问题 */
:deep(.ant-upload-list-picture-card .ant-upload-list-item-thumbnail) {
  position: relative;
}

/* 上传成功提示 */
:deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: rgba(82, 196, 26, 0.9);
    color: #fff;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 5;
    line-height: 24px;
    font-weight: 500;
  }

  &.upload-success::after {
    content: '上传成功';
    opacity: 1;
  }
}

/* 其他模式的上传成功提示 */
:deep(.ant-upload-list:not(.ant-upload-list-picture-card) .ant-upload-list-item) {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -18px;
    left: 0;
    color: #52c41a;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    white-space: nowrap;
    font-weight: 500;
  }

  &.upload-success::after {
    content: '上传成功';
    opacity: 1;
  }
}
</style>
