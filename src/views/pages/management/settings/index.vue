<script setup lang="ts">
import DefaultAvatarSetting from "./components/DefaultAvatarSetting.vue";
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2 class="page-title">系统设置</h2>
      <p class="page-description">配置系统的全局参数和默认选项</p>
    </div>

    <div class="settings-grid">
      <!-- 默认头像设置 -->
      <DefaultAvatarSetting />

    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  @apply p-6 min-h-screen bg-gray-50;

  .settings-header {
    @apply mb-6;

    .page-title {
      @apply text-2xl font-bold text-gray-800 mb-2;
    }

    .page-description {
      @apply text-sm text-gray-600;
    }
  }

  .settings-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .settings-page {
    @apply p-4;

    .settings-header {
      .page-title {
        @apply text-xl;
      }
    }
  }
}
</style>