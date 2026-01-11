<script setup lang="ts">
defineOptions({
  name: 'AvatarUpload'
})

/**
 * 头像上传组件
 * 专门用于头像上传，支持点击上传、预览、更换等功能
 */
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import type { UploadChangeParam } from 'ant-design-vue'
import fileApi from '@/common/apis/fileApi'

interface Props {
  modelValue?: string // 头像URL
  size?: number // 头像大小（像素）
  disabled?: boolean // 是否禁用
  showHoverMask?: boolean // 是否显示悬停遮罩
  defaultName?: string // 默认显示的名称首字母
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 120,
  disabled: false,
  showHoverMask: true,
  defaultName: 'U'
})

const emit = defineEmits<Emits>()

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)

// 预览相关
const previewVisible = ref(false)
const previewImage = ref('')

// 当前头像URL
const avatarUrl = ref(props.modelValue)

// 监听modelValue变化
watch(() => props.modelValue, (newUrl: string) => {
  avatarUrl.value = newUrl
}, { immediate: true })

// 验证图片文件
const validateImageFile = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }

  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('图片大小必须小于 5MB！')
    return false
  }

  return true
}

// 自定义上传请求
const customRequest = async (options: any) => {
  const { file, onSuccess, onError } = options

  // 验证图片文件
  if (!validateImageFile(file)) {
    onError(new Error('图片验证失败'))
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0

    const result = await fileApi.upload(file, {
      onProgress: (progress) => {
        uploadProgress.value = progress
      }
    })
    const url = result.fileUrl
    avatarUrl.value = url
    onSuccess(url, file)

    // 触发更新事件
    emit('update:modelValue', url)
    emit('change', url)

    message.success('头像上传成功')
  } catch (error) {
    console.error('头像上传失败:', error)
    onError(error)
    message.error('头像上传失败，请重试')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 处理文件变化（用于触发上传）
const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    uploading.value = true
  }
  if (info.file.status === 'done') {
    uploading.value = false
  }
  if (info.file.status === 'error') {
    uploading.value = false
    message.error('上传失败')
  }
}

// 预览头像
const handlePreview = () => {
  if (avatarUrl.value) {
    previewImage.value = avatarUrl.value
    previewVisible.value = true
  }
}

// 关闭预览
const handlePreviewCancel = () => {
  previewVisible.value = false
}

// 获取默认头像显示文字
const defaultAvatarText = computed(() => {
  return props.defaultName ? props.defaultName[0].toUpperCase() : 'U'
})

// 头像容器样式
const avatarContainerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}))

// 上传按钮文字
const uploadButtonText = computed(() => {
  if (uploading.value) return '上传中...'
  if (avatarUrl.value) return '更换头像'
  return '上传头像'
})
</script>

<template>
  <div class="avatar-upload-wrapper">
    <a-upload
      :custom-request="customRequest"
      :show-upload-list="false"
      accept="image/*"
      :disabled="disabled || uploading"
      @change="handleChange"
      class="avatar-uploader"
    >
      <div 
        class="avatar-container" 
        :style="avatarContainerStyle"
        :class="{ 'disabled': disabled, 'uploading': uploading }"
      >
        <!-- 头像显示 -->
        <div v-if="avatarUrl && !uploading" class="avatar-image-wrapper">
          <img 
            :src="avatarUrl" 
            :alt="defaultName" 
            class="avatar-image"
            @click.stop="handlePreview"
          />
          <!-- 悬停遮罩 -->
          <div v-if="showHoverMask && !disabled" class="avatar-hover-mask">
            <CameraOutlined class="camera-icon" />
            <div class="hover-text">{{ uploadButtonText }}</div>
          </div>
        </div>

        <!-- 默认头像 -->
        <div v-else-if="!uploading" class="avatar-default">
          <UserOutlined class="default-icon" />
          <div v-if="!disabled" class="default-text">{{ uploadButtonText }}</div>
        </div>

        <!-- 上传中状态 -->
        <div v-else class="avatar-loading">
          <LoadingOutlined class="loading-icon" />
          <div class="loading-text">上传中 {{ uploadProgress }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>
      </div>
    </a-upload>

    <!-- 提示文字 -->
    <div v-if="!disabled" class="upload-tip">
      点击上传头像，支持 JPG、PNG、GIF 格式，大小不超过 5MB
    </div>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      width="600px"
      @cancel="handlePreviewCancel"
    >
      <div class="preview-content">
        <img
          :src="previewImage"
          alt="头像预览"
          class="preview-image"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.avatar-upload-wrapper {
  @apply flex flex-col items-center;

  .avatar-uploader {
    @apply cursor-pointer;
  }

  .avatar-container {
    @apply relative rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-blue-500/20 transition-all duration-300;
    @apply hover:ring-4 hover:ring-blue-500/40 hover:shadow-2xl;

    &.disabled {
      @apply cursor-not-allowed opacity-60 hover:ring-2;
    }

    &.uploading {
      @apply cursor-wait;
    }

    .avatar-image-wrapper {
      @apply relative w-full h-full;

      .avatar-image {
        @apply w-full h-full object-cover;
      }

      .avatar-hover-mask {
        @apply absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300;
        @apply hover:opacity-100;

        .camera-icon {
          @apply text-white text-3xl mb-2;
        }

        .hover-text {
          @apply text-white text-sm font-medium;
        }
      }
    }

    .avatar-default {
      @apply w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex flex-col items-center justify-center;
      @apply hover:from-blue-500 hover:to-indigo-600 transition-all duration-300;

      .default-icon {
        @apply text-white text-5xl mb-2;
      }

      .default-text {
        @apply text-white text-sm font-medium mt-2;
      }
    }

    .avatar-loading {
      @apply w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex flex-col items-center justify-center;

      .loading-icon {
        @apply text-white text-4xl mb-2 animate-spin;
      }

      .loading-text {
        @apply text-white text-sm font-medium mb-2;
      }

      .progress-bar {
        @apply w-3/4 h-2 bg-white/30 rounded-full overflow-hidden;

        .progress-fill {
          @apply h-full bg-white rounded-full transition-all duration-300;
        }
      }
    }
  }

  .upload-tip {
    @apply text-xs text-gray-500 mt-3 text-center max-w-xs;
  }

  .preview-content {
    @apply flex justify-center items-center p-4;

    .preview-image {
      @apply max-w-full max-h-96 rounded-lg shadow-lg object-contain;
    }
  }
}

// 响应式调整
@media (max-width: 640px) {
  .avatar-upload-wrapper {
    .avatar-container {
      .avatar-default .default-icon {
        @apply text-4xl;
      }

      .avatar-hover-mask .camera-icon {
        @apply text-2xl;
      }
    }

    .upload-tip {
      @apply text-xs;
    }
  }
}
</style>

