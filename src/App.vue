<script setup lang="ts">
import {useCategorySeriesStore} from "@/store/categorySeriesStore";
import {onMounted} from "vue";

onMounted(async () => {
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade-slide" mode="out-in">
      <component :is="Component"/>
    </Transition>
  </router-view>
</template>

<style>
/* 路由切换动画 - 淡入淡出 + 滑动效果 */
.fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.25s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
