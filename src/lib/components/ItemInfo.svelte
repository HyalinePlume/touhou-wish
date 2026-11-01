<script>
  /*
   * ItemInfo.svelte — 物品信息展示
   *
   * 动画时序（animation-delay 控制）：
   *   1.2s — 图标淡入
   *   1.3s — 名字从右侧滑入
   *   2.0s+ — 称号字符逐个弹出（间隔 0.15s），每个字触发一次 ding.mp3
   *
   * info-group 不挂 use:removeAnimClass，避免 animationend 瞬间
   * 移除 anim 类导致的 layout 重算与称号动画同步触发时的视觉跳动。
   */
  import { onMount } from "svelte";
  import { removeAnimClass } from "$lib/helpers/transition";
  import { playDing } from "$lib/helpers/audio.js";

  export let staticMode = false;
  export let active = true;
  export let itemName = "博丽灵梦";
  export let race = 0;
  export let itemTitle = "";

  const DING_OFFSET = 0;   /* ding 相对称号动画的延后秒数，改这里即可 */
  let timers = [];
  let stopSounds = [];

  export function stopTitleAudio() {
    timers.forEach(clearTimeout);
    timers = [];
    stopSounds.forEach(stop => stop?.());
    stopSounds = [];
  }

  // 关闭时立即取消，不能等退出动画完成后才清理。
  $: if (!active) stopTitleAudio();

  onMount(() => {
    if (staticMode || !active || !itemTitle) return;
    /* 称号每个字在 2s + i*0.15s 时出现，同步播放 ding */
    const chars = itemTitle.split("");
    timers = chars.map((_, i) =>
      setTimeout(() => {
        if (active) stopSounds.push(playDing());
      }, (2 + i * 0.15 + DING_OFFSET) * 1000)
    );
    return stopTitleAudio;
  });
</script>

<div class="info">
  <div class="info-group" class:animate={!staticMode}>
    <div class="icon vision">
      <img
        src={"/img/race_" + race + ".png"}
        alt="Race"
        class="race-icon"
        width="200px"
      />
    </div>

    <div class="info-text">
      <div class="name">
        <div class="text">{itemName}</div>
      </div>

      <div class="star">
        {#each itemTitle.split("") as char, i (i)}
          <span
            class="title-char"
            class:animate={!staticMode}
            style="animation-delay: {2 + i * 0.15}s"
            use:removeAnimClass
          >{char}</span>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @import "./ItemInfo.css";
</style>
