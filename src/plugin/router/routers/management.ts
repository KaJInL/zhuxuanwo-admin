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
        path: 'user',
        name: 'UserManagement',
        component: () => import('@/views/pages/management/user/index.vue'),
        meta: {
            title: '用户管理'
        }
    },
    {
        path: 'landlord',
        name: 'LandlordManagement',
        component: () => import('@/views/pages/management/landlord/index.vue'),
        meta: {
            title: '房东申请审核'
        }
    },
    {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/pages/management/settings/index.vue'),
        meta: {
            title: '设置'
        }
    },
];

export default managementRoutes;
