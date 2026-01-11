<script setup lang="ts">
import { useManagementMenuStore } from "@/store/managementMenuStore";

const menuStore = useManagementMenuStore();
</script>

<template>
  <aside
      class="bg-white border-r overflow-y-auto transition-all duration-300"
      :style="{ width: menuStore.collapsed ? '80px' : '256px' }"
  >
    <a-menu
        mode="inline"
        :inline-collapsed="menuStore.collapsed"
        :selectedKeys="menuStore.selectedKeys"
        :openKeys="menuStore.openKeys"
        :items="menuStore.menuItems"
        @click="menuStore.handleMenuClick"
        @openChange="(val: string[]) => menuStore.openKeys = val"
        style="height: 100%"
    />
  </aside>
</template>
