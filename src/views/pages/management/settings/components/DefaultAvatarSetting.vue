<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import { useSysConfStore } from "@/store/sysConfStore";
import { SysConfKeyEnum } from "@/common/enums/sysConfKeyEnum";
import AvatarUpload from "@/components/AvatarUpload.vue";

const confStore = useSysConfStore();
const defaultAvatar = ref<string>('');
const saving = ref(false);

// 加载配置
onMounted(async () => {
  const success = await confStore.loadSysconfList();
  if (success) {
    const avatarValue = confStore.getConfValueByKey(SysConfKeyEnum.DEFAULT_AVATAR);
    defaultAvatar.value = avatarValue || '';
  }
});

// 处理头像变化
const handleAvatarChange = async (newAvatarUrl: string) => {
  try {
    saving.value = true;
    const success = await confStore.updateConf(SysConfKeyEnum.DEFAULT_AVATAR, newAvatarUrl);
    if (success) {
      message.success('默认头像设置成功');
      defaultAvatar.value = newAvatarUrl;
    } else {
      message.error(confStore.error || '保存失败');
    }
  } catch (error) {
    console.error('保存默认头像失败:', error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <a-card 
    title="默认头像" 
    class="setting-card"
    :loading="confStore.loading"
  >
    <div class="setting-content">
      <a-spin :spinning="saving">
        <AvatarUpload
          v-model="defaultAvatar"
          :size="120"
          :show-hover-mask="true"
          default-name="默认"
          @change="handleAvatarChange"
        />
      </a-spin>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.setting-card {
  @apply shadow-sm hover:shadow-md transition-shadow duration-300;
  @apply rounded-lg border border-gray-200;

  :deep(.ant-card-head) {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50;
    @apply border-b border-gray-200;

    .ant-card-head-title {
      @apply text-base font-semibold text-gray-800;
    }
  }

  :deep(.ant-card-body) {
    @apply p-4 flex justify-center;
  }

  .setting-content {
    @apply flex justify-center;
  }
}
</style>

