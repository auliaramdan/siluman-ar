import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl"
import {defineConfig} from "vite"
import {resolve} from 'path'
import {fileURLToPath} from 'node:url'

export default defineConfig({
    build: {
        rollupOptions: {
            external: [
                fileURLToPath(
                    new URL(
                        'js/ar.js',
                        import.meta.url
                    )
                )
            ],
            input: {
                main: resolve(__dirname, 'index.html'),
                dragonbones: resolve(__dirname, 'dragonbones/index.html')
            },
        }
    },
    base: '/siluman-ar/',
    outDir: './../dist',
    plugins: [
        viteBasicSslPlugin()
    ]
})