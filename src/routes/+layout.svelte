<script>
  /*
   * +layout.svelte — 根布局组件
   *
   * SvelteKit 路由系统：
   *   +layout.svelte 是所有页面的「外壳」
   *   <slot /> 处会渲染当前路由对应的 +page.svelte
   *
   * 这里只做最基础的全局重置，页面背景由各 +page.svelte 自行负责
   */
</script>

<div class="global-wrapper">
  <slot />
</div>

<style>
  @font-face {
    font-family: "ProjectHYDaHeiJ";
    src: url("/fonts/HYDaHeiJ.ttf") format("truetype");
    font-style: normal;
    font-weight: 400;
    font-display: swap;
  }

  @font-face {
    font-family: "ProjectKaiTi";
    src: url("/fonts/KaiTi.ttf") format("truetype");
    font-style: normal;
    font-weight: 400;
    font-display: swap;
  }

  @font-face {
    font-family: "FZCuJinLing";
    src: url("/fonts/FZCuJinLing-Patched.ttf?v=3") format("truetype");
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
  }

  /*
   * :global() 穿透 Svelte 组件作用域
   * 这里的样式对整个页面全局生效
   */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    /* 底色仅在页面未覆盖时作为后备 */
    background: #0f0f23;
    color: #e0d5c1;
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* 全局滚动条美化 */
  :global(::-webkit-scrollbar) {
    width: 6px;
  }
  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(180, 150, 100, 0.3);
    border-radius: 3px;
  }
</style>
