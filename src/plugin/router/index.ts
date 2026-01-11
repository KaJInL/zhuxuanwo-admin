import type {App} from "vue";
import {createRouter, createWebHistory} from "vue-router";
import routes from "./routers";
import {setupRouterGuard} from "./guard";
import EnvHelper from "../../common/helper/EnvHelper";

const router = createRouter({
    history: createWebHistory(EnvHelper.env.VITE_ROUTE_BASE_URL),
    routes: routes
})

export function setup(app: App) {
    setupRouterGuard(router)
    app.use(router)
}

export default router