<script setup lang="ts">
import {reactive, ref, nextTick} from 'vue';
import {message} from 'ant-design-vue';
import {useRouter} from 'vue-router';
import {useAppStore} from '@/store/appStore';
import accountApi from '@/common/apis/accountApi';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const formState = reactive({
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const validateConfirmPassword = (_rule: any, value: string) => {
  if (value === '') {
    return Promise.reject('请确认密码');
  } else if (value !== formState.password) {
    return Promise.reject('两次输入的密码不一致');
  } else {
    return Promise.resolve();
  }
};

const handleSubmit = async () => {
  try {
    loading.value = true;

    // 调用创建超级管理员的 API
    const response = await accountApi.createSuperUser({
      phone: formState.phoneNumber,
      email: formState.email,
      password: formState.password,
    });

    // 检查响应是否成功
    if (response.succeed) {
      message.success('超级管理员创建成功！即将跳转到登录页面...');

      // 标记超级管理员已创建
      appStore.markSuperuserCreated();

      // 延迟跳转到登录页（延迟以显示成功消息）
      await new Promise(resolve => setTimeout(resolve, 1500));
      await nextTick();
      await router.push({name: 'Login'});
    } else {
      message.error(response.message || '创建超级管理员失败');
    }
  } catch (error: any) {
    console.error('创建超级管理员失败:', error);
    message.error(error.response?.data?.message || error.message || '创建超级管理员失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-full max-w-md mx-auto p-4 sm:p-6 lg:p-8">
    <!-- 主卡片 -->
    <div class="relative w-full">
      <!-- Logo/Icon 区域 -->
      <div class="text-center mb-8">
        <div
            class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-slate-800 mb-2">欢迎使用 MGKW</h1>
        <p class="text-slate-500 text-sm">创建超级管理员账号以开始使用</p>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
        <a-form
            :model="formState"
            layout="vertical"
            @finish="handleSubmit"
        >
          <a-form-item
              label="手机号"
              name="phoneNumber"
              :rules="[
              { required: true, message: '请输手机号' },
              {length: 3, message: '用户名长度为 3-20 个字符' }
            ]"
              class="mb-5"
          >
            <a-input
                v-model:value="formState.phoneNumber"
                placeholder="请输入手机号"
                autocomplete="off"
                size="large"
                class="rounded-lg"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
              label="邮箱"
              name="email"
              :rules="[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]"
              class="mb-5"
          >
            <a-input
                v-model:value="formState.email"
                autocomplete="off"
                placeholder="请输入邮箱"
                size="large"
                class="rounded-lg"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
              label="密码"
              name="password"
              :rules="[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能少于 8 个字符' }
            ]"
              class="mb-5"
          >
            <a-input-password
                autocomplete="off"
                v-model:value="formState.password"
                placeholder="请输入密码"
                size="large"
                class="rounded-lg"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item
              label="确认密码"
              name="confirmPassword"
              :rules="[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword }
            ]"
              class="mb-6"
          >
            <a-input-password
                autocomplete="off"
                v-model:value="formState.confirmPassword"
                placeholder="请再次输入密码"
                size="large"
                class="rounded-lg"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item class="mb-0">
            <a-button
                type="primary"
                html-type="submit"
                size="large"
                :loading="loading"
                block
                class="h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 border-0 font-medium text-base hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span v-if="!loading">创建超级管理员</span>
              <span v-else>创建中...</span>
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 底部提示 -->
        <div class="mt-6 text-center">
          <p class="text-xs text-slate-400">
            创建后将跳转到登录页面
          </p>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="text-center mt-6">
        <p class="text-xs text-slate-400">
          © 2025 住选我 Platform. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义表单样式 */
:deep(.ant-form-item-label > label) {
  @apply text-slate-700 font-medium text-sm;
}

:deep(.ant-input),
:deep(.ant-input-password) {
  @apply transition-all duration-200;
}

:deep(.ant-input:focus),
:deep(.ant-input-password .ant-input:focus) {
  @apply ring-2 ring-indigo-200 border-indigo-400;
}

:deep(.ant-input-affix-wrapper) {
  @apply rounded-lg;
}

/* 按钮悬停效果 */
:deep(.ant-btn-primary:hover) {
  transform: translateY(-1px);
}

:deep(.ant-btn-primary:active) {
  transform: translateY(0);
}
</style>

