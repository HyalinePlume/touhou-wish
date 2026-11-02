<script>
  /*
   * ItemInfo.svelte — 物品信息展示
   *
   * 动画时序（animation-delay 控制）：
   *   1.2s — 图标淡入
   *   1.2s — 名字与图标一起滑入
   *   2.0s+ — 称号字符逐个弹出（间隔 0.15s），每个字触发一次 ding.mp3
   *   以上为正常模式时序；悬念模式的音频从第二段续播时刻调度。
   *
   * info-group 不挂 use:removeAnimClass，避免 animationend 瞬间
   * 移除 anim 类导致的 layout 重算与称号动画同步触发时的视觉跳动。
   */
  import { onMount } from "svelte";
  import { removeAnimClass } from "$lib/helpers/transition";
  import { playDing } from "$lib/helpers/audio.js";

  export let staticMode = false;
  export let active = true;
  export let deferTitleAudio = false;
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

  export function startTitleAudio(delayMs = 2000) {
    stopTitleAudio();
    if (staticMode || !active || !itemTitle) return;
    /* 与视觉时间轴同步；第二段续播时首字剩余 1s。 */
    const chars = itemTitle.split("");
    timers = chars.map((_, i) =>
      setTimeout(() => {
        if (active) stopSounds.push(playDing());
      }, delayMs + (i * 0.15 + DING_OFFSET) * 1000)
    );
  }

  onMount(() => {
    if (!deferTitleAudio) startTitleAudio();
    return stopTitleAudio;
  });
</script>

<div class="info">
  <div class="info-group" class:animate={!staticMode}>
    <div class="icon vision" class:animated-icon={!staticMode} style:--race-mask={'url("/img/race_' + race + '.png")'}>
      <img
        src={"/img/race_" + race + ".png"}
        alt="Race"
        class="race-icon"
        width="200px"
      />
      <span class="race-silver" aria-hidden="true"></span>
      <span class="race-fluorescence" aria-hidden="true"></span>
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
