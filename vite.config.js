/*
 * vite.config.js — Vite 构建配置
 *
 * Vite 是下一代前端构建工具，特点：
 *   1. 开发时使用原生 ES Module，秒级热更新
 *   2. 生产构建使用 Rollup 打包
 *
 * sveltekit() 插件让 Vite 知道这是一个 SvelteKit 项目，
 * 它会自动处理 .svelte 文件的编译、路由生成等
 */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
