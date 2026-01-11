<script setup lang="ts">
import WorkspaceHeader from "@/components/WorkspaceHeader.vue";
import Menu from "@/views/layouts/management-layout/components/menu.vue";
import Footer from "@/views/layouts/management-layout/components/footer.vue";
import { useManagementMenuStore } from "@/store/managementMenuStore";

const menuStore = useManagementMenuStore();
</script>

<template>
  <div class="w-full h-screen flex flex-col">
    <!-- Header -->
    <WorkspaceHeader 
      title="住选我"
      :collapsed="menuStore.collapsed"
      :on-toggle-collapsed="menuStore.toggleCollapsed"
    />

    <!-- 中间内容区 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧菜单 -->
      <Menu :collapsed="menuStore.collapsed" />

      <!-- 右侧内容 -->
      <main class="flex-1 h-full overflow-y-auto bg-white">
        <router-view class="h-full" />
      </main>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style scoped>
/* 移除内部 Transition 动画，由 App.vue 统一处理以避免嵌套冲突 */
</style>
