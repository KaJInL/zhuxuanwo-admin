<script setup lang="ts">
import {MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined} from "@ant-design/icons-vue";
import {useUserStore} from "@/store/userStore";
import {useRouter} from "vue-router";
import {onMounted} from "vue";

interface Props {
  title?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '住选我',
  collapsed: false
});

const userStore = useUserStore();
const router = useRouter();

/**
 * 切换到控制台选择页面（使用 replace 防止后退）
 */
const switchConsole = () => {
  router.replace({name: 'Portal'});
};

/**
 * 跳转到用户信息页面
 */
const goToProfile = () => {
  // todo: 跳转到用户页面
};

/**
 * 初始化用户信息
 */
onMounted(async () => {
  // 如果用户信息不存在，则初始化
  if (!userStore.userInfo) {
    await userStore.initUserInfo();
  }
});
</script>

<template>
  <header class="h-16 bg-gray-100 flex items-center px-4 shadow justify-between">
    <div class="flex items-center justify-center gap-5">
      <span @click="props.onToggleCollapsed?.()" class="cursor-pointer text-lg">
        <component :is="props.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"/>
      </span>
      <h1 class="text-xl font-bold">{{ props.title }}</h1>
    </div>

    <!-- 用户信息区域 -->
    <div class="flex items-center gap-4">
      <!-- 用户信息 -->
      <div
          v-if="userStore.userInfo"
          @click="goToProfile"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
      >
        <!-- 用户头像 -->
        <div v-if="userStore.userInfo.avatar" class="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300">
          <img :src="userStore.userInfo.avatar" :alt="userStore.displayName" class="w-full h-full object-cover">
        </div>
        <div v-else
             class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-gray-300">
          <span class="text-sm font-bold text-white">{{ userStore.displayName[0].toUpperCase() }}</span>
        </div>

        <!-- 用户名称 -->
        <span class="text-sm font-medium text-gray-700">{{ userStore.displayName }}</span>
      </div>

      <!-- 加载状态 -->
      <div v-else class="flex items-center gap-2 px-3 py-2">
        <a-spin size="small"/>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 切换控制台按钮样式 */
.console-switch-btn {
  border: none;
  cursor: pointer;
  position: relative;
  transform: translateZ(0);
}

.console-switch-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  padding: 2px;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.console-switch-btn:hover::before {
  opacity: 1;
}

.console-switch-btn:active {
  transform: scale(0.97);
}

/* 光效动画 */
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

.group:hover .group-hover\:animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}

/* 晃动动画 */
@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

.group:hover .group-hover\:animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* 用户信息悬停效果 */
</style>

