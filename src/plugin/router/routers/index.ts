import type {RouteRecordRaw} from 'vue-router'
import accountRoutes from './account'
import managementRoutes from './management'
import designerRoutes from './designer'

/**
 * 主路由配置
 * 所有路由都在 default-layout 下，形成统一的根布局
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@/views/layouts/default-layout/index.vue'),
        redirect: { name: 'Home' },
        children: [
            // 账号相关（嵌套布局：登录、注册等）
            {
                path: 'account',
                component: () => import('@/views/layouts/account-layout/index.vue'),
                children: accountRoutes
            },
            // 管理后台（嵌套布局）
            {
                path: 'management',
                component: () => import('@/views/layouts/management-layout/index.vue'),
                children: managementRoutes
            },
        ]
    }
]

export default routes
