import type { RouteRecordRaw } from "vue-router";

const accountRoutes: RouteRecordRaw[] = [
    {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/pages/account/login/index.vue'),
        meta: {
            title: '登录',
            hideInMenu: true,
        }
    },
    {
        path: 'init-superuser',
        name: 'InitSuperuser',
        component: () => import('@/views/pages/account/init-superuser/index.vue'),
        meta: {
            title: '初始化超级管理员',
            hideInMenu: true,
        }
    }
]

export default accountRoutes;

