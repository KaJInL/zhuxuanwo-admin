<script setup lang="ts">
defineOptions({
  name: 'VideoUpload'
})

/**
 * 通用视频上传组件
 * 专门用于视频上传，双向绑定 string
 * 统一处理视频上传逻辑、预览、删除等功能
 */
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'
import type { UploadFile, UploadChangeParam } from 'ant-design-vue'
import featureApi from '@/common/apis/commonApi'

interface Props {
  modelValue: string
  accept?: string // 接受的视频类型，如 'video/*', 'video/mp4,video/quicktime'
  disabled?: boolean // 是否禁用
  showPreview?: boolean // 是否显示预览功能
  uploadText?: string // 上传按钮文字
  placeholder?: string // 占位符文字
  size?: 'small' | 'middle' | 'large' // 组件大小
  aspectRatio?: string // 宽高比，如 '9/16'
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'video/*',
  disabled: false,
  showPreview: true,
  uploadText: '上传视频',
  placeholder: '支持 MP4、MOV、AVI 格式，建议比例 9:16',
  size: 'middle',
  aspectRatio: '9/16'
})

const emit = defineEmits<Emits>()

// 上传状态
const uploading = ref(false)

// 文件列表
const fileList = ref<UploadFile[]>([])

// 预览相关
const previewVisible = ref(false)
const previewVideo = ref('')

// 上传成功提示：存储刚上传成功的视频 URL
const successUrl = ref<string | null>(null)

// 将URL转换为UploadFile格式
const urlToUploadFile = (url: string): UploadFile => ({
  uid: `${Date.now()}`,
  name: url.substring(url.lastIndexOf('/') + 1),
  status: 'done',
  url,
  response: url
})

// 监听modelValue变化，同步到fileList
watch(() => props.modelValue, (newUrl) => {
  if (!newUrl || newUrl === '') {
    fileList.value = []
    return
  }

  fileList.value = [urlToUploadFile(newUrl)]
}, { immediate: true, deep: true })

// 验证视频文件
const validateVideoFile = (file: File): boolean => {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    message.error('只能上传视频文件！')
    return false
  }

  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    message.error('视频大小必须小于 100MB！')
    return false
  }

  return true
}

// 自定义上传请求
const customRequest = async (options: any) => {
  const { file, onSuccess, onError, onProgress } = options

  // 验证视频文件
  if (!validateVideoFile(file)) {
    onError(new Error('视频验证失败'))
    return
  }

  try {
    uploading.value = true
    onProgress({ percent: 50 })

    const response = await featureApi.uploadFile(file)

    if (response.isSuccess && response.data?.url) {
      const url = response.data.url

      // 检查是否为重复上传
      if (props.modelValue === url) {
        message.warning('该视频已存在，请勿重复上传')
        onError(new Error('重复上传'))
        return
      }

      onSuccess(url, file)

      // 更新modelValue
      emit('update:modelValue', url)

      // 显示上传成功提示，1秒后隐藏
      successUrl.value = url
      await nextTick()
      updateSuccessClass()
      
      setTimeout(() => {
        successUrl.value = null
        updateSuccessClass()
      }, 1000)
    } else {
      throw new Error('上传响应格式错误')
    }
  } catch (error) {
    console.error('视频上传失败:', error)
    onError(error)

    if (error instanceof Error && error.message !== '重复上传') {
      message.error('视频上传失败，请重试')
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
      emit('update:modelValue', '')
      // 移除时也清除成功提示
      successUrl.value = null
    }
  }
}

// 为上传成功的视频项添加类名
const updateSuccessClass = async () => {
  await nextTick()
  const uploadItems = document.querySelectorAll('.video-upload-wrapper .ant-upload-list-item')
  uploadItems.forEach((item) => {
    const dataUrl = item.getAttribute('data-url')
    if (dataUrl && successUrl.value === dataUrl) {
      item.classList.add('upload-success')
    } else {
      item.classList.remove('upload-success')
    }
  })
}

// 监听成功提示和文件列表变化
watch([successUrl, fileList], updateSuccessClass, { deep: true })

// 监听文件列表变化，为每个 item 添加 data-url 属性
watch(fileList, async () => {
  await nextTick()
  const uploadItems = document.querySelectorAll('.video-upload-wrapper .ant-upload-list-item')
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

// 预览视频
const handlePreviewClick = () => {
  if (!props.showPreview || !props.modelValue) return
  previewVideo.value = props.modelValue
  previewVisible.value = true
}

// 关闭预览
const handlePreviewCancel = () => {
  previewVisible.value = false
}

// 删除视频
const handleRemove = () => {
  emit('update:modelValue', '')
  fileList.value = []
}
</script>

<template>
  <div class="video-upload-wrapper">
    <a-upload
      v-model:file-list="fileList"
      list-type="picture-card"
      :custom-request="customRequest"
      :accept="accept"
      :multiple="false"
      :disabled="disabled"
      :show-upload-list="false"
      @change="handleChange"
      class="video-upload"
    >
      <div v-if="fileList.length === 0 && !props.modelValue" class="upload-trigger">
        <div class="upload-content">
          <PlusOutlined />
          <div class="ant-upload-text">{{ uploading ? '上传中...' : uploadText }}</div>
        </div>
      </div>
    </a-upload>

    <!-- 视频预览卡片 -->
    <div v-if="props.modelValue" class="video-preview-card">
      <div class="video-preview-content">
        <video
          :src="props.modelValue"
          class="video-thumbnail"
          preload="metadata"
        />
        <div class="video-overlay" @click="handlePreviewClick">
          <PlayCircleOutlined class="play-icon" />
        </div>
        <div class="video-actions" v-if="!disabled">
          <a-button
            type="text"
            danger
            size="small"
            @click="handleRemove"
            class="remove-btn"
          >
            删除
          </a-button>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="placeholder" class="upload-placeholder">
      {{ placeholder }}
    </div>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      width="80%"
      @cancel="handlePreviewCancel"
    >
      <div class="preview-content">
        <video
          :src="previewVideo"
          controls
          class="preview-video"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.video-upload-wrapper {
  .upload-trigger {
    @apply relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-blue-400 transition-colors;
    aspect-ratio: 9/16;
    position: relative;

    .upload-content {
      @apply absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors;
    }

    .ant-upload-text {
      @apply mt-2 text-sm;
    }
  }

  .video-preview-card {
    @apply relative w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50;
    aspect-ratio: 9/16;
    position: relative;

    .video-preview-content {
      @apply absolute inset-0;
      position: relative;

      .video-thumbnail {
        @apply w-full h-full object-cover;
      }

      .video-overlay {
        @apply absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer;
        z-index: 2;
        
        .play-icon {
          @apply text-white text-4xl;
        }
      }

      .video-actions {
        @apply absolute top-2 right-2 z-10;
        
        .remove-btn {
          @apply bg-white/90 hover:bg-white shadow-md;
        }
      }
    }
  }

  .upload-placeholder {
    @apply text-xs text-gray-500 mt-2;
  }

  .preview-content {
    @apply flex justify-center items-center;

    .preview-video {
      @apply w-full max-h-[80vh] rounded-md shadow-lg;
    }
  }
}

:deep(.video-upload .ant-upload-select-picture-card) {
  @apply border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors;
  width: 100%;
  aspect-ratio: 9/16;
}

:deep(.video-upload .ant-upload-list-picture-card) {
  display: none;
}
</style>
