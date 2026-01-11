import {ConfigEnv, loadEnv} from 'vite'
import {parseEnv} from "./vite/utils";
import setupPlugins from "./vite/plugins";
import alias from "./vite/alias";

// https://vite.dev/config/

export default ({mode}: ConfigEnv) => {
    const env = parseEnv(loadEnv(mode, process.cwd()))
    return {
        plugins: setupPlugins(),
        // 解析配置
        resolve: {
            // 路径别名
            alias: alias
        },
        base: env.VITE_ROUTE_BASE_URL,
        build: {
            outDir: 'mgkw',
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks(id: string) {
                        if (id.includes('node_modules')) {
                            return id.toString().split('node_modules/')[1].split('/')[0].toString()
                        }
                    },
                },
            },
        },
        server:{
            host: true,
            port: 5173,
            strictPort: true
        }
    }
}
