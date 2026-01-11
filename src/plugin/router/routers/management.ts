import type {RouteRecordRaw} from "vue-router";

/**
 * 管理后台子路由配置
 */
const managementRoutes: RouteRecordRaw[] = [
    {
        path: '',
        redirect: {name: 'Home'}
    },
    {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/pages/management/home/index.vue'),
        meta: {
            title: '管理后台首页',
        }
    },
    {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/pages/management/settings/index.vue'),
        meta: {
            title: '设置'
        }
    }
];

export default managementRoutes;

