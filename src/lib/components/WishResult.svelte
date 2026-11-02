<script>
  /*
   * WishResult.svelte — 抽卡结果展示调度器（阶段②）
   *
   * 照抄原项目 WishResult.svelte 的结构：
   *   全屏深色背景 → 立绘 + 光圈 + 物品信息
   *
   * 动画时序（1s后允许揭晓；第一轮粒子与入场光圈独立完整播放）：
   *   SplashLight(in)     → 立刻开始
   *   SplashArt           → 1.5s splashart keyframes（从 scale(5) 缩小 + brightness(0→1)）
   *   ItemInfo            → 1.2s 图标淡入 / 1.3s 名字滑入 / 2s+ 星星依次弹出
   *   SplashLight(out)    → 1.1s 后光圈膨胀消散
   */
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import SplashLight from './SplashLight.svelte';
  import SplashArt from './SplashArt.svelte';
  import ItemInfo from './ItemInfo.svelte';
  import ParticleBurst from './ParticleBurst.svelte';
  import SecondarySfx from './SecondarySfx.svelte';
  import { startResultPlayback } from '$lib/helpers/resultPlayback.js';

  export let list = [];
  export let assets;
  export let skip = false;
  export let onClose = () => {};
  export let position = 1;
  export let total = 1;
  export let suspenseEnabled = false;
  export let onSecondPhase = () => {};

  let isSplashOut = false;
  let timer;
  let closing = false;
  let itemInfo;
  let resultNode;
  let stopPlayback;

  function closeResult() {
    if (closing) return;
    itemInfo?.stopTitleAudio();
    closing = true;
    stopPlayback?.();
    clearTimeout(timer);
    onClose();
  }

  function startSecondPhase() {
    if (closing) return;
    onSecondPhase();
    itemInfo?.startTitleAudio(1000);
    timer = setTimeout(() => {
      isSplashOut = true;
    }, 100); // 原时间轴 1.1s，即第二段开始后 100ms。
  }

  onMount(() => {
    stopPlayback = startResultPlayback({
      node: resultNode, suspense: suspenseEnabled && !skip, onSecondPhase: startSecondPhase
    });
    return () => {
      stopPlayback();
      clearTimeout(timer);
    };
  });
</script>

<!--
  以下模板结构照抄原项目 WishResult.svelte
  去掉了多抽结果列表(ResultList)、分享按钮、logo 等我们不需要的部分
  保留了核心的 art-wrapper → SplashLight + SplashArt + ItemInfo 结构
-->
<div class="wish-result" bind:this={resultNode} out:fade={{ duration: 250 }}>
  <div class="bg-layer"></div>
  {#if total > 1}<div class="result-progress" aria-live="polite">{position} / {total}</div>{/if}
  <!-- 关闭按钮（出场光效后显示） -->
  {#if !skip}
    {#if isSplashOut}
      <button class="close" aria-label="关闭结果" on:click={closeResult} in:fade={{ delay: 200 }}>
        ✕
      </button>
    {/if}
  {:else}
    <button class="close" aria-label="关闭结果" on:click={closeResult}>
      ✕
    </button>
  {/if}

  <div
    class="zoomist-container"
  >
    {#each list as item, i}
      {#if i === 0}
        <div class="art-wrapper">
          <!-- 下方容器（光晕等）：放在最前面确保叠在立绘之下 -->
          <div class="lower-effects">
            <div class="glow-img-wrap">
              <img class="glow-img" src={assets.lightSrc} alt="" />
            </div>
          </div>

          <!-- 下方容器（光晕等）：z-index:0，立绘之下 -->
          <div class="lower-effects">
            <div class="glow-img-wrap">
              <img class="glow-img" src={assets.lightSrc} alt="" />
            </div>
          </div>

          <!-- 上方容器：预留给后续动画效果 -->
          <div class="upper-effects">
            <SecondarySfx sources={assets.secondarySources} />
          </div>

          <!-- 入场光圈独立播完，不随第二轮启动而提前移除。 -->
          {#if !skip}
            <SplashLight type="in" rarity={item.rarity || 4} />
          {/if}

          <!-- 立绘 -->
          <SplashArt
            name={item.name || '博丽灵梦'}
            artSrc={item.artSrc || '/chr/hakurei_reimu.png'}
            isFiller={item.isFiller || false}
          />

          <!-- 物品信息 -->
          <ItemInfo
            bind:this={itemInfo}
            deferTitleAudio={true}
            active={!closing}
            itemName={item.name || '博丽灵梦'}
            itemTitle={item.title || ''}
            race={item.race ?? 0}
            type={item.type || 'character'}
            isFiller={item.isFiller || false}
          />

          <!-- 出场光圈 -->
          {#if isSplashOut && !skip}
            <SplashLight type="out" rarity={item.rarity || 4} />
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- 白屏闪光：开场瞬间全白 → 快速回落透明 -->
  <ParticleBurst sources={assets.particleSources} />

  <div class="white-flash"></div>
</div>

<style>
  /*
   * 以下 CSS 照抄原项目 WishResult.svelte
   */
  .result-progress { position: fixed; top: 36px; left: 3%; z-index: 30; color: #eee8df; font-size: 1.1rem; }
  .close {
    position: fixed;
    top: 30px;
    right: 3%;
    z-index: 30;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;transition: background 0.2s;
  }

  .close:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .close:active,
  button:active {
    transform: scale(0.9);
  }

  .wish-result {
    width: 100vw;
    height: 100dvh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 25;
    display: flex;
    justify-content: center;align-items: center;
  }

  /* 模糊背景图层 */
  .bg-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: url('/img/bg-pic-pick.jpg') center / cover no-repeat;
    background-color: rgba(37, 41, 51, 0.8);
    background-blend-mode: multiply;
    filter: blur(8px);
    transform: scale(1.1);
    pointer-events: none;
  }

  .zoomist-container {
    position: relative;
    z-index: 1;
    margin-left: 5%;
    aspect-ratio: 1/1;
    height: 55vh;          /* 基于视口高度，改这里调大小 */
    width: auto;            /* 由 aspect-ratio 自动计算 */
    display: flex;
    justify-content: center;align-items: center;
  }

  .art-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;align-items: center;
    position: relative;
  }

  /*
   * 白屏闪光效果
   * MP4 结束后的瞬间，全屏纯白 → 快速 fade out
   */
  .white-flash {
    position: absolute;
    inset: 0;
    z-index: 100;                   /* 最顶层 */
    background: #fff;
    pointer-events: none;           /* 不阻挡下层交互 */
    animation: flashOut 2s ease-out forwards;
  }

  @keyframes flashOut {
    0%   {opacity: 0; }             /* 保持黑屏 */
    60% { opacity: 0; }
    61% { opacity: 0.4; }         /* 1.1s-1.4s，随着剪影露出真面貌，再亮一下 */
    70% { opacity: 0; }
    100% { opacity: 0; }
  }
  /*
   * ========== 下方光晕（图片 + 蓝紫色正片叠底） ==========
   * 位于立绘背后，屏幕中央偏下，动画独立于立绘
   */
  .lower-effects {
    position: absolute;
    inset: 0;
    z-index: 0;                   /* 最底层，立绘(info)叠在上面 */
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }

  /* 光晕动画容器 —— 控制放缩与透明度 */
  .glow-img-wrap {
    position: relative;
    width: 350px;
    height: 350px;
    animation: glowPulse 2s ease-out forwards;
  }

  /* light.png 底图 */
  .glow-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }


  /*
   * 光晕独立动画（不影响立绘的 splashart 动画）：
   *   0~0.4s  保持最亮(opacity:1)，由小迅速放大(0.15→1.2)
   *   0.4~1s  缓慢放大(1.2→1.8)，不透明度降到 40%
   */
  @keyframes glowPulse {
    0%   { transform: scale(2); opacity: 0.9; }
    10%  { transform: scale(5);  opacity: 0.9; }
    25%  { transform: scale(6.5);  opacity: 0.6; }
    35%  { transform: scale(7.5);  opacity: 0; }
    60%  { transform: scale(8);  opacity: 0; }
    61% { transform: scale(6);  opacity: 1; }
    100% { transform: scale(12);  opacity: 0; } 
  }

  /* 上方容器 —— 预留给后续效果（如光柱、粒子等） */
  .upper-effects {
    position: absolute;
    inset: 0;
    z-index: 5;                   /* 立绘上层 */
    pointer-events: none;
    overflow: hidden;
  }

  @media (max-width: 700px) {
    .zoomist-container { width: min(55vw, 45dvh); height: auto; margin-left: 0; margin-bottom: 15dvh; }
  }

</style>
