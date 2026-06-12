import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'
import viteCompression from 'vite-plugin-compression'
import { createHtmlPlugin } from 'vite-plugin-html'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig(({ command, mode }) => {

  const env = loadEnv(mode, process.cwd()) // 获取各个环境下的环境变量
  console.log('VITE_SERVE:', env.VITE_SERVE)
  return {
    // 代理服务器配置
    server: {
      proxy: {
        [env.VITE_APP_BASE_API]: {
          target: 'http://127.0.0.1:3000', // 本地后端服务地址，使用IPv4地址
          changeOrigin: true, // 需要代理跨域
          rewrite: (path) => path // 不需要路径重写，因为前端发送的请求已经包含了/admin前缀
        },
        '/uploads': {
          target: 'http://127.0.0.1:3000', // 图片上传路径代理到后端
          changeOrigin: true
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      viteMockServe({
        localEnabled: command === 'serve'
      }),
      viteCompression({
        algorithm: 'gzip',
        threshold: 10240,
        verbose: true
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        threshold: 10240,
        verbose: true
      }),
      createHtmlPlugin({
        minify: {
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
          collapseWhitespace: true
        }
      }),
      ViteImageOptimizer({
        png: {
          quality: 70,
          compressionLevel: 9
        },
        jpeg: {
          quality: 70
        },
        jpg: {
          quality: 70
        },
        webp: {
          quality: 70
        },
        avif: {
          quality: 70
        },
        svg: {
          multipass: true,
          plugins: [
            { name: 'preset-default' },
            { name: 'removeViewBox' }
          ]
        },
        generateWebp: true,
        generateAvif: true
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve("./src") // 相对路径设置别名
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true,
          additionalData: '@import "@/styles/variable.scss";'
        }
      }
    },
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendors': ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            'echarts': ['echarts', 'echarts-liquidfill'],
            'utils': ['axios', 'lodash', 'dayjs', 'mitt', 'nprogress']
          }
        }
      }
    }
  }
})
