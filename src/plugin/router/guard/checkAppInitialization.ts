import type {NavigationGuardNext, RouteLocationNormalized} from 'vue-router'
import {useAppStore} from '@/store/appStore'

/**
 * 检查应用初始化状态的路由守卫
 * 确保系统已创建超级管理员才能访问其他页面
 */
export async function checkAppInitialization(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
) {
    const appStore = useAppStore();

    // 如果还没有检查过系统初始化状态，先检查
    const isSuperuserCreated = await appStore.checkSystemInitialization();
    // 如果超级管理员未创建，且当前不是去初始化页面，则跳转到初始化页面
    if (!isSuperuserCreated && to.name !== 'InitSuperuser') {
        next({name: 'InitSuperuser'});
        return;
    }

    // 如果超级管理员已创建，但用户试图访问初始化页面，则跳转到首页
    if (isSuperuserCreated && to.name === 'InitSuperuser') {
        next({name: 'Home'});
        return;
    }

    next();
}

