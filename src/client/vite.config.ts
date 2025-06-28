import { defineConfig } from 'vite';
import { resolve } from 'path'


const config = defineConfig({
    define: {
        'isViteLocalDev': !!process.env.CI ? 'false' : 'true',
    },
    build: {
        lib: {

            entry: resolve(import.meta.dirname, 'app.ts'),
            name: 'LogosDX',
            formats: ['iife']
        },
        outDir: resolve(import.meta.dirname, '../server/assets/build'),
        target: 'es2020',
        sourcemap: true,
        minify: true,
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo: any) => {

                    let extType = assetInfo.name!.split('.').at(1);
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType!)) {

                        extType = 'images';
                    }

                    return `${extType}/[name][extname]`;
                },
                manualChunks: false as any,
                entryFileNames: 'js/[name].js'
            }
        },
    },

    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                quietDeps: true,
                silenceDeprecations: ['legacy-js-api'],
            }
        }
    },
});

export default config;