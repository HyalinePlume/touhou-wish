<script>
  import { isBgmMuted, setBgmMuted, bgmPlaybackLevel } from "$lib/helpers/audio.js";
  import HomeContentEditor from "$lib/components/HomeContentEditor.svelte";
  import DialogCloseButton from "$lib/components/DialogCloseButton.svelte";

  let musicMuted = $state(isBgmMuted());
  let helpDialog;
  let contentEditor;

  // 保留当前旋转角度，仅改变速度，与音频共用同一份渐入渐出进度。
  function spinRecord(node) {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = node.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 9000, iterations: Infinity, easing: "linear" }
    );
    let level = 0;
    const syncSpeed = () => {
      animation.playbackRate = motionPreference.matches ? 0 : level;
    };
    const unsubscribe = bgmPlaybackLevel.subscribe(value => {
      level = value;
      syncSpeed();
    });
    motionPreference.addEventListener("change", syncSpeed);
    return {
      destroy() {
        unsubscribe();
        motionPreference.removeEventListener("change", syncSpeed);
        animation.cancel();
      }
    };
  }

  function toggleMusic() {
    musicMuted = !musicMuted;
    setBgmMuted(musicMuted);
  }
</script>

<div class="home-tools" role="group" aria-label="音乐、文本编辑与帮助">
  <button class="round-button music-button" class:muted={musicMuted}
    type="button" aria-label="静音背景音乐" aria-pressed={musicMuted}
    title={musicMuted ? "恢复背景音乐" : "静音背景音乐"} onclick={toggleMusic}>
    <span class="record" aria-hidden="true">
      <span class="record-art" use:spinRecord>
      <svg class="yin-yang" viewBox="0 0 100 100">
      <!-- 阴阳鱼形状 -->
        <g transform="rotate(-145 50 50)">
          <circle cx="50" cy="50" r="50" fill="#706B65" />
          <path d="M50 0 A50 50 0 0 0 50 100 A25 25 0 0 0 50 50 A25 25 0 0 1 50 0" fill="#08090b" />
          <circle cx="50" cy="25" r="5" fill="#08090b" />
          <circle cx="50" cy="75" r="5" fill="#706B65" />
        </g>
      </svg>
      <img class="record-reimu" src="/img/reimu-for-record.png" alt="" />
      </span>
      <span class="record-shine"></span>
      <span class="record-rim"></span>
      <span class="record-center"></span>
    </span>
  </button>
  <button class="round-button edit-button" type="button" aria-label="内容编辑" title="内容编辑"
    aria-haspopup="dialog" onclick={() => contentEditor.open()}>
    <svg class="pen-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
    </svg>
  </button>
  <button class="round-button help-button" type="button" aria-label="关于这里"
    title="关于这里" aria-haspopup="dialog" onclick={() => helpDialog.showModal()}>
    <span aria-hidden="true">?</span>
  </button>
</div>

<HomeContentEditor bind:this={contentEditor} />

<dialog class="help-dialog" bind:this={helpDialog} aria-labelledby="about-wish-title">
  <div class="help-heading">
    <span class="help-eyebrow">为东方例会而作的抽奖程序</span>
    <DialogCloseButton label="关闭说明" onclick={() => helpDialog.close()} />
  </div>
  <h2 id="about-wish-title">这是什么网页？</h2>
  <ul>
    <li>本网页是为 <strong>北京邮电大学×北京师范大学联合东方例会「东方杏坛铭」活动</strong> 的抽奖环节而开发的纯前端展示网页。</li>
    <li>通过 <s>抄袭</s> 致敬《原神》的祈愿系统，实现了类似的、妙趣横生（?）的抽奖体验。</li>
    <li>不过，本网页中抽取的并不是小概率获得的人物，而是从含有全部东方人物（无旧作，可能有额外的村民）的人物池中，抽出幸运的几位，并为对应的玩家发放奖品。</li>
  </ul>

  <section aria-labelledby="wish-process-title">
    <h2 id="wish-process-title">抽奖流程是什么？</h2>
    <ul>
      <li>若要使用本网页进行抽奖，请确保所有参与抽奖的观众均与一名东方人物（或村民）绑定。</li>
      <li>在抽奖前，通过右下角的「设置」按钮进入奖池设置，在这里可以调整：
        <ul>
          <li><strong>村民数量：</strong>加入带有独立编号的村民，以免东方人物太少，不能绑定全部观众（村民数量将实时显示）</li>
          <li><strong>奖品设置：</strong>提前导入奖品的图片、等级和名字。抽奖结果诞生后，为对应的观众发放。</li>
          <li><strong>悬念模式：</strong>中奖人物立绘不会直接被展示，而是保持剪影形态，直到下一次鼠标点击。如此一来，抽奖会变得更有悬念吧？</li>
        </ul>
      </li>
      <li>调整完设置后，点击右下角的按钮，可以进行单次或多次抽取。</li>
      <li>单次抽取时，将直接展示中奖人物立绘；多次抽取时，将分别展示各人物立绘，最后总览全部中奖人物和名字。</li>
    </ul>
  </section>

  <section aria-labelledby="wish-rules-title">
    <h2 id="wish-rules-title">关于抽取规则……</h2>
    <ul>
      <li>抽取时，所有东方角色（无旧作）与对应数量的村民将被投入同一个人物池，</li>
      <li>已中奖角色将被移除，不会再次中奖。除非，您清空保存中奖数据的“祈愿记录”名单。</li>
      <li>剔除已中奖角色后，从人物池中等概率地抽取一名角色。</li>
      <li>当执行连抽时，重复执行上面的逻辑，每次抽取后，先剔除人物，再进行下一次抽取。</li>
      <li>人物库与抽取代码均位于 <code>src/lib/data/characters.js</code></li>
    </ul>
  </section>

  <section aria-labelledby="other-events-title">
    <h2 id="other-events-title">其他活动能用吗？</h2>
    <ul>
      <li>本网站完全可用于其他以类似方式组织的抽奖活动。欢迎大家的使用和反馈！</li>
      <li>通过右上角的按钮可以快捷编辑主界面文本、视觉图和背景图。</li>
    </ul>
  </section>

  <section aria-labelledby="diy-pool-title">
    <h2 id="diy-pool-title">我想DIY奖池……</h2>
    <ul>
      <li>人物池位于 <code>src/lib/data/characters.js</code></li>
      <li>根据格式，新增加人物时，需要提供该人物的：
        <ul>
          <li>姓名</li>
          <li>称号</li>
          <li>种族（由数字指代，参见文件内注释）</li>
          <li>立绘图路径（建议放置于 <code>static/chr</code>）</li>
          <li>主题曲（需放置于 <code>static/sfx/theme</code>）</li>
          <li>提前播放秒数（参见文件内注释，用于在展示立绘时对轴播放音乐）</li>
        </ul>
      </li>
      <li>此外，还需要一份 <strong>400×1200</strong> 竖向裁切的透明底 PNG，保持相同命名放置于 <code>static/chr-summary</code> 中，用于连抽结果的展示</li>
    </ul>
  </section>
  <button class="understood-button" type="button" onclick={() => helpDialog.close()}>开始期待吧</button>
</dialog>

<style>
.home-tools .round-button {background:var(--home-tools);color:var(--home-ink);border-color:var(--home-toolBorder);box-shadow:0 3px 12px color-mix(in srgb,var(--home-toolShadow) 20%,transparent),inset 0 0 0 3px color-mix(in srgb,var(--home-toolBorder) 18%,transparent);}
.home-tools .round-button:hover {background:var(--home-hover);box-shadow:0 5px 16px color-mix(in srgb,var(--home-toolShadow) 30%,transparent);}
.home-tools .round-button:focus-visible {outline:2px solid var(--home-toolBorder);outline-offset:4px;}

  .home-tools { position: fixed; top: max(24px, env(safe-area-inset-top)); right: max(28px, env(safe-area-inset-right)); z-index: 12; display: flex; gap: 12px; }
  .round-button { width: 45px; height: 45px; padding: 0; display: grid; place-items: center; border-radius: 50%; border: 1px solid #fff4db; background: #f3e5cb; color: #be702f; box-shadow: 0 3px 12px #3b25132b, inset 0 0 0 3px #e7cfa65c; cursor: pointer; transition: background .2s, transform .2s, box-shadow .2s; }
  .round-button:hover { background: #fff1d8; transform: translateY(-2px); box-shadow: 0 5px 16px #3b25133b; }
  button:focus-visible { outline: 3px solid #dc904d; outline-offset: 4px; }
  .round-button:active { transform: translateY(0); }
  .help-button { font: 700 26.25px/1 Georgia, serif; }
  .pen-icon { width: 55%; height: 55%; }
  .record { position: relative; display: block; width: 90%; height: 90%; overflow: hidden; border-radius: 50%; background: #08090b; }
  .record-art, .yin-yang, .record-reimu, .record-shine, .record-rim { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; }
  .record-reimu { object-fit: contain; opacity: 1; }
  .yin-yang { opacity: .5; }
  .record-shine { background: conic-gradient(from 130deg, transparent 0deg, #d8e5ff70 5deg, #ffffff80 12deg, transparent 35deg, transparent 180deg, #d8e5ff70 185deg, #ffffff80 192deg, transparent 215deg); }
  .record-rim { box-sizing: border-box; border: 1px solid #050608; }
  .record-center { position: absolute; left: 44%; top: 44%; width: 12%; height: 12%; box-sizing: border-box; border: 1px solid #050608; box-shadow: 0 0 0 1px #050608; border-radius: 100%; background: #eee9df; }
  .help-dialog { box-sizing: border-box; position: fixed; inset: 0; margin: auto; width: min(720px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 28px; border: 1px solid #dfbf8e; border-radius: 20px; background: #f7efdf; color: #594632; box-shadow: 0 24px 80px #0005; }
  .help-dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  .help-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .help-eyebrow { color: #ac652e; font-size: .8rem; letter-spacing: .2em; }
  h2 { font-size: 1.35rem; line-height: 1.5; color: #9a592b; margin: 0 0 14px; }
  section { margin-top: 26px; padding-top: 22px; border-top: 1px solid #dfbf8e80; }
  ul { margin: 0; padding-left: 1.3rem; }
  ul ul { margin-top: 10px; padding-left: 1.2rem; }
  li { padding-left: 4px; margin-bottom: 10px; font-size: .9rem; line-height: 1.85; }
  li::marker { color: #be702f; font-weight: 700; }
  li strong { color: #9a592b; }
  code { padding: 2px 5px; border-radius: 4px; background: #dfbf8e33; font-size: .88em; overflow-wrap: anywhere; }
  .understood-button { display: block; width: 100%; margin-top: 22px; padding: 12px 20px; border: 0; border-radius: 24px; background: #bc7338; color: #fff4e2; font: inherit; cursor: pointer; }
  .understood-button:hover { background: #a9622e; }
  @media (max-width: 700px) {
    .home-tools { top: max(14px, env(safe-area-inset-top)); right: max(16px, env(safe-area-inset-right)); gap: 10px; }
    .round-button { width: 36px; height: 36px; }
    .help-button { font-size: 22.5px; }
    .help-dialog { padding: 22px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .round-button { transition: none; }
  }
</style>
