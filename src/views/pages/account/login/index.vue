<script setup lang="ts">
import {reactive, ref, onMounted, nextTick} from 'vue';
import {message} from 'ant-design-vue';
import {useRouter} from 'vue-router';
import {useAppStore} from '@/store/appStore';
import accountApi from '@/common/apis/accountApi';
import localStorageHelper from '@/common/helper/localStorageHelper';
import {ResponseCode} from '@/common/enums/responseCodeEnum';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const formState = reactive({
  phone: '',
  password: '',
  rememberMe: false,
});

// 表单引用
const formRef = ref();

// 组件挂载时检查是否已登录
onMounted(async () => {
  if (localStorageHelper.isLoggedIn()) {
    message.info('您已登录，正在跳转...');
    await nextTick();
    await router.push({name: 'Home'});
  }
});

// 手机号验证规则
const phoneRules = [
  { required: true, message: '请输入手机号', trigger: 'blur' },
  { 
    pattern: /^1[3-9]\d{9}$/, 
    message: '请输入正确的手机号格式', 
    trigger: 'blur' 
  }
];

// 密码验证规则
const passwordRules = [
  { required: true, message: '请输入密码', trigger: 'blur' },
  { min: 6, message: '密码长度至少6位', trigger: 'blur' }
];

const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value.validate();
  } catch (error) {
    return;
  }

  loading.value = true;

  try {
    // 调用登录 API
    const response = await accountApi.loginByPwd({
      phone: formState.phone.trim(),
      password: formState.password,
    });

    // 检查响应是否成功
    if (response.succeed && response.data) {
      const loginRes = response.data;

      // 保存 token
      localStorageHelper.setToken(loginRes);

      message.success('登录成功！');

      // 跳转到 Portal 中转页面（延迟以显示成功消息）
      await new Promise(resolve => setTimeout(resolve, 500));
      await nextTick();
      await router.push({name: 'Home'});
    } else {
      // 登录失败，根据错误码显示不同提示
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (response.code === ResponseCode.LOGIN_FAILED) {
        errorMessage = response.message || '登录失败，请检查用户名和密码';
      } else if (response.code === ResponseCode.PARAM_INVALID) {
        errorMessage = response.message || '参数格式错误';
      } else if (response.message) {
        errorMessage = response.message;
      }
      
      message.error(errorMessage);
    }
  } catch (error: any) {
    // 处理网络错误或其他异常
    console.error('登录异常:', error);
    message.error(error.message || '登录失败，请稍后重试');
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
            class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-slate-800 mb-2">欢迎回来</h1>
        <div class="flex justify-center items-center gap-1">
          <p class="text-slate-500 text-sm">登录您的 </p>
          <p class="text-slate-700 text-sm">住选我</p>
          <p class="text-slate-500 text-sm">管理账号</p>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
        <a-form
            ref="formRef"
            :model="formState"
            layout="vertical"
            @finish="handleSubmit"
        >
          <a-form-item
              label="手机号"
              name="phone"
              :rules="phoneRules"
              class="mb-5"
          >
            <a-input
                v-model:value="formState.phone"
                placeholder="请输入手机号"
                autocomplete="phone"
                size="large"
                class="rounded-lg"
                :maxlength="11"
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
              label="密码"
              name="password"
              :rules="passwordRules"
              class="mb-4"
          >
            <a-input-password
                v-model:value="formState.password"
                placeholder="请输入密码"
                autocomplete="current-password"
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

          <!-- 记住我 & 忘记密码 -->
          <div class="flex items-center justify-between mb-6">
            <a-checkbox v-model:checked="formState.rememberMe">
              <span class="text-sm text-slate-600">记住我</span>
            </a-checkbox>
            <a href="#" class="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
              忘记密码？
            </a>
          </div>

          <a-form-item class="mb-0">
            <a-button
                type="primary"
                html-type="submit"
                size="large"
                :loading="loading"
                block
                class="h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 border-0 font-medium text-base hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 底部链接 -->
        <div class="mt-6 text-center">
          <p class="text-sm text-slate-500">
            还没有账号？
            <a href="#" class="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              联系管理员
            </a>
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
  @apply ring-2 ring-blue-200 border-blue-400;
}

:deep(.ant-input-affix-wrapper) {
  @apply rounded-lg;
}

/* 复选框样式 */
:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  @apply bg-indigo-600 border-indigo-600;
}

:deep(.ant-checkbox-wrapper:hover .ant-checkbox-inner) {
  @apply border-indigo-600;
}

/* 按钮悬停效果 */
:deep(.ant-btn-primary:hover) {
  transform: translateY(-1px);
}

:deep(.ant-btn-primary:active) {
  transform: translateY(0);
}
</style>

