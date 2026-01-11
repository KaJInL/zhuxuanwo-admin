import type {App} from "vue";

import {setup as tailwindcss} from "./tailwindcss"
import {setup as router} from "./router"
import {setup as pinia} from "./pinia"

const modules = [tailwindcss, router, pinia]

export default function (app: App) {
    modules.map((setup) => setup(app))

}