import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    // Nén sẵn lúc build để Node trả thẳng file `.gz`/`.br`, không nén lại ở mỗi request trên hosting.
    nitro({ compressPublicAssets: { gzip: true, brotli: true } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Mỗi icon Solar là một module nhỏ, nếu để mặc định thì mỗi route kéo thêm hàng chục file
        // và mỗi file là một request có thể dính độ trễ của hosting.
        codeSplitting: {
          groups: [{ name: 'solar-icons', test: /@solar-icons\/react/ }],
        },
      },
    },
  },
})

export default config
