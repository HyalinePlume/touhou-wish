<script>
  /*
   * SplashArt.svelte — 角色立绘展示
   * 照抄原项目 _splash-art.svelte
   *
   * 缩放控制：修改 scale 变量即可（1.0 = 原尺寸，1.5 = 放大 150%）
   *   使用 inline style 直接绑定，绕过 CSS 变量继承的 Svelte scoping 问题
   */
  import { removeAnimClass } from '$lib/helpers/transition';

  export let name = '博丽灵梦';
  export let artSrc = '/chr/hakurei_reimu.png';
  export let scale = 1.8;
</script>

<div class="zoomist-wrapper splash-art anim character" use:removeAnimClass>
  <!--
    inline style 直接设置 transform
    Svelte 响应式：scale 变化时自动更新
  -->
  <div
    class="zoomist-image"
    style="transform: translate(0px, 0px) scale({scale})"
  >
    <img src={artSrc} alt={name} crossorigin="anonymous" />
  </div>
</div>

<style>
  .zoomist-wrapper,
  .zoomist-image {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .zoomist-wrapper {
    background-color: unset;
    position: relative;
  }

  .zoomist-image {
    position: relative;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    object-position: center;
  }

  /*
   * splashart 动画在 wrapper 上运行：
   *   wrapper 从 scale(5) 缩小到 scale(1)
   *   同时 brightness(0) 在前 75% 保持全黑，95% 突然亮起
   *   视觉上：角色从模糊大光团缩到正常位置后「啪」地显形
   */
  .splash-art.anim {
    filter: brightness(0) opacity(0);
    animation: splashart forwards 1.5s 1;
  }

  .splash-art:not(.anim) {
    transform: translate(2%, 0);
  }

  @keyframes splashart {
    0% {
      transform: scale(5) translate(0, -5%);
      filter: brightness(0);
    }
    10% {
      transform: scale(1.5);
      filter: brightness(0);
    }

    20% {
      transform: scale(1);
      filter: brightness(0);
    }
    75% {
      transform: scale(1);
      filter: brightness(0);
    }
    95% {
      transform: scale(1) translate(2%, 0);
      filter: brightness(1);
    }
    100% {
      transform: scale(1) translate(2%, 0);
      filter: brightness(1);
    }
  }
</style>