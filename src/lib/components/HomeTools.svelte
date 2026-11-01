<script>
  import { isBgmMuted, setBgmMuted } from "$lib/helpers/audio.js";

  let musicMuted = $state(isBgmMuted());
  let helpDialog;

  function toggleMusic() {
    musicMuted = !musicMuted;
    setBgmMuted(musicMuted);
  }
</script>

<div class="home-tools" role="group" aria-label="音乐与帮助">
  <button class="round-button music-button" class:muted={musicMuted}
    type="button" aria-label="背景音乐静音" aria-pressed={musicMuted}
    title={musicMuted ? "恢复背景音乐" : "静音背景音乐"} onclick={toggleMusic}>
    <span class="record" aria-hidden="true">
      <svg class="yin-yang" viewBox="0 0 100 100">
        <!-- 采用数学角度：向右为 0°，逆时针为正；上方鱼眼旋至 227.5°。 -->
        <g transform="rotate(-137.5 50 50)">
          <circle cx="50" cy="50" r="50" fill="#08090b" />
          <path d="M50 0 A50 50 0 0 0 50 100 A25 25 0 0 0 50 50 A25 25 0 0 1 50 0" fill="#aaa39b" />
          <circle cx="50" cy="25" r="5" fill="#aaa39b" />
          <circle cx="50" cy="75" r="5" fill="#08090b" />
        </g>
      </svg>
      <span class="record-grooves"></span>
      <span class="record-shine"></span>
      <!-- <img class="reimu" src="/img/reimu-white.png" alt="" /> -->
      <span class="reimu-tint"></span>
      <span class="record-rim"></span>
      <span class="record-center"></span>
    </span>
  </button>
  <button class="round-button help-button" type="button" aria-label="关于角色祈愿"
    title="关于角色祈愿" aria-haspopup="dialog" onclick={() => helpDialog.showModal()}>
    <span aria-hidden="true">?</span>
  </button>
</div>

<dialog class="help-dialog" bind:this={helpDialog} aria-labelledby="about-wish-title">
  <div class="help-heading">
    <span class="help-eyebrow">东方杏坛铭</span>
    <button class="close-button" type="button" aria-label="关闭说明" onclick={() => helpDialog.close()}>×</button>
  </div>
  <h2 id="about-wish-title">让每一份惊喜，都有归属</h2>
  <p>这是一个以「东方杏坛铭」角色祈愿为主题的抽奖网页。选好奖品，从角色与村民组成的奖池中随机抽出获奖者，用祈愿动画揭晓结果。</p>
  <ol>
    <li><strong>设置奖池</strong><span>在「设置」中调整村民数量，添加并指定本轮奖品。</span></li>
    <li><strong>开启祈愿</strong><span>选择「祈愿一次」或「祈愿多次」，揭晓本轮获奖角色。</span></li>
    <li><strong>回顾结果</strong><span>在「祈愿记录」中查看奖品和获奖者。已抽出的角色不会重复入选，重置记录后可重新参与。</span></li>
  </ol>
  <p class="storage-note">奖品与祈愿记录保存在当前浏览器中。右上角的唱片按钮可静音或恢复主页面背景音乐。</p>
  <button class="understood-button" type="button" onclick={() => helpDialog.close()}>开始期待吧</button>
</dialog>

<style>
  .home-tools { position: fixed; top: max(24px, env(safe-area-inset-top)); right: max(28px, env(safe-area-inset-right)); z-index: 12; display: flex; gap: 12px; }
  .round-button { width: 45px; height: 45px; padding: 0; display: grid; place-items: center; border-radius: 50%; border: 1px solid #fff4db; background: #f3e5cb; color: #be702f; box-shadow: 0 3px 12px #3b25132b, inset 0 0 0 3px #e7cfa65c; cursor: pointer; transition: background .2s, transform .2s, box-shadow .2s; }
  .round-button:hover { background: #fff1d8; transform: translateY(-2px); box-shadow: 0 5px 16px #3b25133b; }
  button:focus-visible { outline: 3px solid #dc904d; outline-offset: 4px; }
  .round-button:active { transform: translateY(0); }
  .help-button { font: 700 26.25px/1 Georgia, serif; }
  .record { position: relative; display: block; width: 90%; height: 90%; overflow: hidden; border-radius: 50%; background: #08090b; animation: record-spin 9s linear infinite; }
  .yin-yang, .record-grooves, .record-shine, .reimu, .reimu-tint, .record-rim { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; }
  .yin-yang { opacity: .5; }
  .record-grooves { background: repeating-radial-gradient(circle, transparent 0 1.1px, #0008 1.2px 1.5px, #ffffff18 1.6px 1.8px); }
  .record-shine { background: conic-gradient(from 130deg, transparent 0deg, #d8e5ff70 5deg, #ffffff80 12deg, transparent 35deg, transparent 180deg, #d8e5ff70 185deg, #ffffff80 192deg, transparent 215deg); }
  .reimu { object-fit: contain; }
  /* 橙色正片叠底，仅覆盖灵梦轮廓；currentColor 与问号图标共用颜色。 */
  .reimu-tint { background: currentColor; mix-blend-mode: multiply; mask: url("/img/reimu-white.png") center / contain no-repeat; -webkit-mask: url("/img/reimu-white.png") center / contain no-repeat; }
  .record-rim { box-sizing: border-box; border: 1px solid #050608; }
  .record-center { position: absolute; left: 44%; top: 44%; width: 12%; height: 12%; box-sizing: border-box; border: 1px solid #050608; border-radius: 50%; background: #eee9df; }
  .muted .record { animation-play-state: paused; }
  @keyframes record-spin { to { transform: rotate(360deg); } }
  .help-dialog { position: fixed; inset: 0; margin: auto; width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 28px; border: 1px solid #dfbf8e; border-radius: 20px; background: #f7efdf; color: #594632; box-shadow: 0 24px 80px #0005; }
  .help-dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  .help-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .help-eyebrow { color: #ac652e; font-size: .8rem; letter-spacing: .2em; }
  .close-button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #eadac0; color: #995b2d; font-size: 25px; cursor: pointer; }
  h2 { font-size: 1.35rem; line-height: 1.5; color: #9a592b; margin: 0 0 14px; }
  p { font-size: .9rem; line-height: 1.85; }
  ol { margin: 22px 0; padding-left: 1.4rem; }
  li { padding-left: 6px; margin-bottom: 14px; font-size: .9rem; line-height: 1.7; }
  li::marker { color: #be702f; font-weight: 700; }
  li strong, li span { display: block; }
  li strong { color: #9a592b; margin-bottom: 2px; }
  .storage-note { color: #89745b; font-size: .78rem; }
  .understood-button { display: block; width: 100%; margin-top: 22px; padding: 12px 20px; border: 0; border-radius: 24px; background: #bc7338; color: #fff4e2; font: inherit; cursor: pointer; }
  .understood-button:hover { background: #a9622e; }
  @media (max-width: 700px) {
    .home-tools { top: max(14px, env(safe-area-inset-top)); right: max(16px, env(safe-area-inset-right)); gap: 10px; }
    .round-button { width: 36px; height: 36px; }
    .help-button { font-size: 22.5px; }
    .help-dialog { padding: 22px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .record { animation: none; }
    .round-button { transition: none; }
  }
</style>
