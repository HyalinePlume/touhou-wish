<script>
  import { onMount } from 'svelte';

  let { list = [], onClose = () => {} } = $props();
  let dialog;
  let closing = false;
  // Independent outer entrance / inner idle layers keep settled portraits still.
  const step = 125;
  const entrance = 620;
  const outline = 'polygon(50% 0%, 64% 3%, 78% 4%, 83% 7%, 100% 10%, 100% 90%, 83% 93%, 78% 96%, 64% 97%, 50% 100%, 36% 97%, 22% 96%, 17% 93%, 0% 90%, 0% 10%, 17% 7%, 22% 4%, 36% 3%)';
  const motes = Array.from({ length: 8 }, (_, i) => i);
  // 专用卡面沿用原立绘文件名；仅影响本汇总页。
  function summaryArt(item) {
    return (item.artSrc || '/chr/villager.png').replace(/^\/chr\//, '/chr-summary/');
  }
  function fallbackArt(event, item) {
    const image = event.currentTarget;
    const original = item.artSrc || '/chr/villager.png';
    // 原图也加载失败时不再重试，避免 error 循环。
    if (image.getAttribute('src') !== original) image.src = original;
  }
  function close() {
    if (closing) return;
    closing = true;
    dialog.close();
    onClose();
  }
  onMount(() => {
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  });
</script>

<dialog bind:this={dialog} class="summary" aria-labelledby="summary-title"
  oncancel={(event) => { event.preventDefault(); close(); }}
  style="--count: {list.length}; --outline: {outline}; --ready: {entrance + Math.max(0, list.length - 1) * step}ms">
  <div class="backdrop" aria-hidden="true"></div>
  <div class="ambient" aria-hidden="true"></div>
  <header><h2 id="summary-title">祈愿结果</h2><span>共 {list.length} 位角色</span></header>
  <button class="close" aria-label="关闭连抽结果" onclick={close}>✕</button>
  <ol class="lineup" aria-label="本轮祈愿角色">
    {#each list as item, i (i)}
      <li class="arrival" class:gold={item.rarity >= 5} class:blue={item.rarity <= 3}
        style="--delay: {100 + i * step}ms; --idle-delay: {100 + i * step + entrance}ms; --duration: {entrance}ms">
        <div class="aura" aria-hidden="true"></div>
        <div class="flame top" aria-hidden="true"></div>
        <div class="flame bottom" aria-hidden="true"></div>
        <div class="particles" aria-hidden="true">
          {#each motes as p}
            <i style="--x: {12 + (p * 29 + i * 7) % 77}%; --life: {1.6 + p * .17}s; --offset: {-p * .31}s; --drift: {(p % 3 - 1) * 14}px"></i>
          {/each}
        </div>
        <div class="card">
          <div class="face">
            <div class="ornament" aria-hidden="true">✦</div>
            <img class="portrait" src={summaryArt(item)} onerror={(event) => fallbackArt(event, item)} alt="" style="object-position: {item.summaryPosition || '50% 18%'}" />
            <div class="shade"></div>
            <div class="details">
              <img class="race" src="/img/race_{item.race ?? 0}.png" alt="" />
              <span class="summary-name">{item.name}</span>
            </div>
            <div class="sheen" aria-hidden="true"></div>
          </div>
          <div class="landing-flash" aria-hidden="true"></div>
        </div>
        <span class="tip top-tip" aria-hidden="true">✦</span>
        <span class="tip bottom-tip" aria-hidden="true">✦</span>
      </li>
    {/each}
  </ol>
  <footer><button onclick={close}>确 定</button></footer>
</dialog>

<style>
  .summary { position: fixed; inset: 0; width: 100vw; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 0; border: 0; overflow: hidden; color: #f5eee2; background: #252936; isolation: isolate; }
  .summary::backdrop { background: #252936; }
  .backdrop { position: absolute; inset: -20px; z-index: -2; background: linear-gradient(#232735b8,#232735d9), url('/img/bg-pic-pick.jpg') center / cover; filter: blur(9px); }
  .ambient { position: absolute; inset: 0; z-index: -1; background: radial-gradient(ellipse at center, #9da3cb18, transparent 65%); }
  header { position: absolute; top: 5.5%; left: 5%; display: flex; align-items: baseline; gap: 16px; animation: appear .5s both; }
  h2 { margin: 0; font-size: clamp(18px, 1.5vw, 28px); font-weight: 400; letter-spacing: .18em; }
  header span { font-size: 12px; color: #c7cbd2; }
  button { color: #f5eee2; cursor: pointer; font: inherit; }
  .close { position: absolute; top: 4%; right: 3%; width: 44px; height: 44px; border: 1px solid #ffffff50; border-radius: 50%; background: #ffffff12; }
  button:hover { background: #ffffff28; }
  button:focus-visible { outline: 2px solid #ebd3a0; outline-offset: 5px; }
  .lineup { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; pointer-events: none; display: flex; align-items: center; justify-content: center; gap: clamp(4px, .55vw, 10px); }
  .arrival { --rgb: 183, 145, 255; --edge: #e3d3ff; position: relative; flex: 0 0 min(126px, (88vw - (var(--count) - 1) * clamp(4px, .55vw, 10px)) / var(--count)); height: min(48dvh, 460px); min-width: 0; animation: slide-in var(--duration) cubic-bezier(.16,.75,.22,1) var(--delay) both; }
  .gold { --rgb: 255, 188, 78; --edge: #fff0bf; }
  .blue { --rgb: 115, 192, 255; --edge: #d6f4ff; }
  .aura { position: absolute; inset: -3px; filter: blur(6px); }
  .aura::before { content: ""; position: absolute; inset: 0; background: rgba(var(--rgb), .75); clip-path: var(--outline); }
  .card { position: absolute; inset: 0; background: var(--edge); clip-path: var(--outline); }
  .face { position: absolute; inset: 2px; overflow: hidden; clip-path: var(--outline); background: radial-gradient(ellipse at 50% 30%, rgba(var(--rgb), .38), transparent 65%), linear-gradient(#34455a, #7d858c 55%, #243349); }
  .portrait { position: absolute; width: 100%; height: 100%; object-fit: cover; }
  .shade { position: absolute; inset: 0; background: linear-gradient(transparent 49%, #14213944 64%, #142139f0 88%); }
  .ornament { position: absolute; top: 4%; left: 0; right: 0; text-align: center; color: #eefaff; font-size: 16px; z-index: 1; }
  .details { position: absolute; bottom: 8%; left: 3%; right: 3%; display: flex; flex-direction: column; align-items: center; gap: 6px; text-shadow: 0 2px 5px #0e172c; }
  .race { width: clamp(18px, 2.7vw, 40px); height: clamp(18px, 2.7vw, 40px); object-fit: contain; filter: brightness(0) invert(1) drop-shadow(0 0 5px #bde5ff80); }
  .summary-name { width: 100%; height: 2.8em; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(10px, 1vw, 16px); line-height: 1.4; text-align: center; overflow-wrap: anywhere; }
  /* Full ellipses overlap the card: no bright gradient is cut off at a box edge.
     Scaling around the center keeps the glow attached to each card tip. */
  .flame { position: absolute; left: -14%; width: 128%; height: 46%; background: radial-gradient(ellipse at center, #fff8da 0%, rgba(var(--rgb), .9) 10%, rgba(var(--rgb), .35) 30%, transparent 64%); transform-origin: center; opacity: 0; animation: flame 2.3s ease-in-out var(--idle-delay) infinite; pointer-events: none; }
  .flame::after { content: ''; position: absolute; inset: 0 32%; filter: blur(5px); opacity: .8; background: radial-gradient(ellipse at center, #fff9df 0%, rgba(var(--rgb), .8) 20%, rgba(var(--rgb), .15) 55%, transparent 75%); transform: scaleX(.5); }
  .top { bottom: 77%; }
  .bottom { top: 77%; animation-duration: 2.7s; }
  .tip { position: absolute; left: 50%; translate: -50% 0; color: #fff5de; text-shadow: 0 0 9px rgba(var(--rgb),1); opacity: 0; animation: twinkle 2s ease-in-out var(--idle-delay) infinite; }
  .top-tip { top: -9px; }
  .bottom-tip { bottom: -9px; }
  .particles { position: absolute; inset: -20% -15%; pointer-events: none; opacity: 0; animation: appear .3s var(--idle-delay) forwards; }
  .particles i { position: absolute; left: var(--x); bottom: 9%; width: 2px; height: 3px; background: var(--edge); box-shadow: 0 0 5px rgba(var(--rgb), .9); animation: rise var(--life) linear var(--offset) infinite; }
  .sheen { position: absolute; inset: -30% -100%; background: linear-gradient(115deg, transparent 42%, #fff6 49%, transparent 56%); opacity: 0; animation: sweep 4.6s ease-in-out var(--idle-delay) infinite; }
  .landing-flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: land var(--duration) ease-out var(--delay) both; }
  .aura { animation: breathe 2.8s ease-in-out var(--idle-delay) infinite; }
  footer { position: absolute; bottom: 7%; left: 0; right: 0; text-align: center; animation: appear .4s calc(var(--ready) + 100ms) both; }
  footer button { min-width: 150px; min-height: 44px; border: 1px solid #d8c9b180; border-radius: 24px; background: #eee5d91c; }
  @keyframes slide-in { from { transform: translateX(100vw) scaleX(.88); opacity: 0; filter: brightness(1.8) blur(5px); } 22% { opacity: 1; } 75% { filter: brightness(1.15) blur(0); } to { transform: translateX(0) scaleX(1); opacity: 1; filter: brightness(1) blur(0); } }
  @keyframes land { 0%, 45%, 100% { opacity: 0; } 62% { opacity: .48; } }
  @keyframes flame { 0%, 100% { transform: scale(.88,.8); opacity: .5; } 48% { transform: scale(1.08,1.13); opacity: .95; } 70% { transform: scale(.96,.94); opacity: .7; } }
  @keyframes breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
  @keyframes twinkle { 0%,100% { opacity: .45; transform: scale(.75); } 50% { opacity: 1; transform: scale(1.2); } }
  @keyframes rise { 0% { transform: translate(0,0); opacity: 0; } 18% { opacity: .8; } 75% { opacity: .45; } 100% { transform: translate(var(--drift), -55vh); opacity: 0; } }
  @keyframes sweep { 0%, 66% { transform: translateX(-45%); opacity: 0; } 72% { opacity: .3; } 92%, 100% { transform: translateX(45%); opacity: 0; } }
  @keyframes appear { from { opacity: 0; } to { opacity: 1; } }
  @media (max-width: 600px) and (orientation: portrait) {
    .lineup { flex-wrap: wrap; align-content: center; gap: 30px 7px; padding: 70px 5vw; }
    .arrival { flex-basis: calc((90vw - 28px) / 5); height: min(28dvh, 230px); }
    .summary-name { font-size: 10px; } .details { gap: 3px; } header { top: 4%; } header span { display: none; }
    footer { bottom: 3%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .arrival, .particles, .flame, .tip, .sheen, .aura, .landing-flash, header, footer { animation: none; }
    .particles, .sheen, .landing-flash { display: none; }
    .flame, .tip { opacity: .6; }
  }
</style>
