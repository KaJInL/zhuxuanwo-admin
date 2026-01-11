import {createApp} from 'vue'
import './styles/index.css'
import App from "@/App.vue";
import plugin from "@/plugin";

function bootstrap() {
    const app = createApp(App)
    plugin(app)
    app.mount('#app')
}

bootstrap()
