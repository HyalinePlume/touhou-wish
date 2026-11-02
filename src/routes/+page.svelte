<script>

  import Meteor from "$lib/components/Meteor.svelte";
  import WishResult from "$lib/components/WishResult.svelte";
  import WishSummary from "$lib/components/WishSummary.svelte";
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { fade } from "svelte/transition";
  import { playSfx, muteBgm, unmuteBgm, playTheme, stopTheme, fadeOutTheme, preloadThemes, cancelThemeSchedule, THEME_RETURN_FADE_MS } from "$lib/helpers/audio.js";
  import { getAvailablePool, villagerCount, setVillagerCount } from "$lib/data/characters.js";
  import PrizeManager from "$lib/components/PrizeManager.svelte";
  import { prizeTitle, prizeStars } from "$lib/data/prizes.js";
  import { selectWishAssets } from "$lib/helpers/wishAssets.js";
  import { RESULT_FIRST_PHASE_MS } from "$lib/helpers/resultPlayback.js";
  import WishHistory from "$lib/components/WishHistory.svelte";
  import { drawAndSaveWishRecord, listWishRecords } from "$lib/data/wishHistory.js";
  import MissingPrizePrompt from "$lib/components/MissingPrizePrompt.svelte";
  import MultiWishPrompt from "$lib/components/MultiWishPrompt.svelte";
  import HomeTools from "$lib/components/HomeTools.svelte";
  import { wishTitle, wishSubtitle, mainVisual, backgroundImage, loadHomeContent } from "$lib/data/homeContent.js";

  let showMeteor = $state(false);
  let showWishResult = $state(false);
  let showWishSummary = $state(false);
  let drawResult = $state([]);
  let drawAssets = $state(selectWishAssets());
  let drawKey = $state(0);
  let flipped = $state(false);
  let suspenseEnabled = $state(false);
  const SUSPENSE_PREFERENCE = "xtm_suspense_enabled";

  function toggleSuspense() {
    suspenseEnabled = !suspenseEnabled;
    try { localStorage.setItem(SUSPENSE_PREFERENCE, String(suspenseEnabled)); }
    catch { /* 存储不可用时保留当前会话的选择。 */ }
  }
  let showHistory = $state(false);
  let savingDraw = $state(false);
  let historyError = $state("");
  const ERROR_TOAST_HOLD_MS = 3500;
  const ERROR_TOAST_FADE_MS = 400;
  let errorToastTimer;

  function setHistoryError(message) {
    clearTimeout(errorToastTimer);
    historyError = message;
    if (message) {
      errorToastTimer = setTimeout(() => { historyError = ""; }, ERROR_TOAST_HOLD_MS);
    }
  }
  let showMissingPrizePrompt = $state(false);
  let skipMissingPrizePrompt = $state(false);
  let pendingDrawMode = $state("single");
  let pendingDrawCount = $state(1);
  let showMultiWishPrompt = $state(false);
  let resultIndex = $state(0);
  let meteorFinished = $state(false);
  let hasSpecifiedPrize = $state(false);
  const MISSING_PRIZE_PREFERENCE = "xtm_skip_missing_prize_prompt";

  function toggleFlip() { flipped = !flipped; }

  /* 设置面板里输入框的本地值，用 $state 保证响应式 */
  let inputVillagerCount = $state(get(villagerCount));

  let currentPrizeSrc = $state('');
  let currentPrizeName = $state('暂未指定奖品');
  let currentPrizeTitle = $state('');
  let currentPrizeStars = $state(4);
  const THEME_START_DELAY_MS = 1300; // 原定主题曲启动（渐强开始）时间。
  const SHOW2_START_DELAY_MS = 1100; // 第二段亮相音效的启动时间，后续在此调整。
  let show2Timer;

  onMount(() => {
    loadHomeContent().catch(() => setHistoryError("首页暂存内容读取失败，请刷新后重试。"));
    playSfx("wishBacksound");
    try { suspenseEnabled = localStorage.getItem(SUSPENSE_PREFERENCE) === "true"; }
    catch { /* 存储不可用时使用默认状态。 */ }
    try { skipMissingPrizePrompt = localStorage.getItem(MISSING_PRIZE_PREFERENCE) === "true"; }
    catch { /* 无法访问浏览器偏好时，仍保留当前会话的选择。 */ }
  });
  onDestroy(() => {
    clearTimeout(errorToastTimer);
    cancelThemeSchedule();
    clearTimeout(show2Timer);
    stopTheme();
    preloadThemes([]);
    if (currentPrizeSrc) URL.revokeObjectURL(currentPrizeSrc);
  });

  function specifyPrize(prize) {
    hasSpecifiedPrize = Boolean(prize);
    if (currentPrizeSrc) URL.revokeObjectURL(currentPrizeSrc);
    currentPrizeSrc = prize ? URL.createObjectURL(prize.blob) : '';
    currentPrizeName = prize?.name || '暂未指定奖品';
    currentPrizeTitle = prize ? prizeTitle(prize) : '';
    currentPrizeStars = prize ? prizeStars(prize) : 4;
  }

  function requestDraw({ drawMode = "single", count = 1 } = {}) {
    if (showMeteor || showWishResult || showWishSummary || showHistory || savingDraw || showMissingPrizePrompt || showMultiWishPrompt) return;
    if (!hasSpecifiedPrize && !skipMissingPrizePrompt) {
      pendingDrawMode = drawMode;
      pendingDrawCount = count;
      showMissingPrizePrompt = true;
      return;
    }
    handleDraw({ drawMode, count });
  }

  function continueWithoutPrize(dontRemind) {
    showMissingPrizePrompt = false;
    if (dontRemind) {
      skipMissingPrizePrompt = true;
      try { localStorage.setItem(MISSING_PRIZE_PREFERENCE, "true"); }
      catch { /* 存储不可用时，“不再提示”仍对本次会话有效。 */ }
    }
    handleDraw({ drawMode: pendingDrawMode, count: pendingDrawCount });
  }

  function confirmMultiWish(count) {
    showMultiWishPrompt = false;
    requestDraw({ drawMode: "multi", count });
  }

  async function handleDraw({ drawMode = "single", count = 1 } = {}) {
    if (showMeteor || showWishResult || showWishSummary || showHistory || savingDraw) return;
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      setHistoryError("请输入 1～10 之间的整数。");
      return;
    }
    drawAssets = selectWishAssets({ rarity: currentPrizeStars, drawMode });
    const villagerTotal = get(villagerCount);
    const snapshot = {
      prizeName: currentPrizeName,
      prizeTitle: currentPrizeTitle || "未指定奖品",
      stars: drawAssets.rarity,
      villagerCount: villagerTotal
    };
    savingDraw = true;
    setHistoryError("");
    drawResult = [];
    resultIndex = 0;
    meteorFinished = false;
    try {
      const records = await listWishRecords();
      const remaining = getAvailablePool(records, villagerTotal).length;
      if (remaining < count) {
        throw new Error("当前奖池仅剩 " + remaining + " 个角色，无法祈愿 " + count + " 次。请减少次数、增加村民数量或重置祈愿记录。");
      }
      cancelThemeSchedule();
      clearTimeout(show2Timer);
      muteBgm();
      drawKey++;
      showMeteor = true;
      // 每次 await 都等待事务提交，下次抽取会重新读取已保存的历史。
      for (let i = 0; i < count; i++) {
        const char = await drawAndSaveWishRecord({ ...snapshot, drawnAt: Date.now() });
        drawResult = [...drawResult, {
          name: char.name, title: char.title, race: char.race, type: "character",
          artSrc: char.artSrc, rarity: drawAssets.rarity,
          theme: "/sfx/theme/" + (char.theme || "villager_theme.mp3"),
          themeStart: char.themeStart ?? 0
        }];
        // MP4 播放期间即可加载前两首，不启动播放。
        if (i < 2) prepareResultThemes();
      }
    } catch (error) {
      const completed = drawResult.length;
      setHistoryError((completed ? "已完成并保存 " + completed + " 次祈愿，剩余抽取停止：" : "祈愿未完成：")
        + (error.message || "无法读取或保存祈愿记录，请重试"));
    } finally {
      savingDraw = false;
      if (meteorFinished) finishMeteor();
    }
  }

  function playResultTheme() {
    playSfx("show1", drawAssets.show1Src);
    clearTimeout(show2Timer);
    cancelThemeSchedule();
    prepareResultThemes();
  }

  function prepareResultThemes() {
    preloadThemes(drawResult.slice(resultIndex, resultIndex + 2).map(item => item.theme));
  }

  function scheduleResultTheme(delayMs) {
    const item = drawResult[resultIndex];
    if (item) playTheme(item.theme, item.themeStart ?? 0, { delayMs });
  }

  function startResultAudio(suspense) {
    if (!suspense) scheduleResultTheme(THEME_START_DELAY_MS);
  }

  function playSecondPhaseAudio(suspense) {
    clearTimeout(show2Timer);
    show2Timer = setTimeout(() => {
      if (showWishResult) playSfx("show2", drawAssets.show2Src);
    }, Math.max(0, SHOW2_START_DELAY_MS - RESULT_FIRST_PHASE_MS));
    if (suspense) scheduleResultTheme(Math.max(0, THEME_START_DELAY_MS - RESULT_FIRST_PHASE_MS));
  }

  function finishMeteor() {
    showMeteor = false;
    if (drawResult.length) {
      showWishResult = true;
      playResultTheme();
    } else {
      unmuteBgm();
    }
  }

  function handleMeteorEnd() {
    meteorFinished = true;
    // 跳过或视频提前结束时，等后台保存完毕才进入结果页。
    if (!savingDraw) finishMeteor();
  }

  function handleCloseResult() {
    clearTimeout(show2Timer);
    if (resultIndex + 1 < drawResult.length) {
      cancelThemeSchedule();
      fadeOutTheme({ maxDurationMs: THEME_START_DELAY_MS });
      resultIndex++;
      playResultTheme();
      return;
    }
    showWishResult = false;
    if (drawResult.length > 1) {
      // 保留最后一首音乐及尚未触发的启动计时器，汇总页继续播放。
      showWishSummary = true;
      return;
    }
    finishResults();
  }

  function finishResults() {
    cancelThemeSchedule();
    clearTimeout(show2Timer);
    fadeOutTheme({ skipHold: true, fadeDurationMs: THEME_RETURN_FADE_MS });
    preloadThemes([]);
    showWishSummary = false;
    unmuteBgm();
    drawResult = [];
    resultIndex = 0;
  }

  /* ---------- 村民数量控制 ---------- */
  function incVillager() {
    const cur = get(villagerCount);
    setVillagerCount(Math.min(99, cur + 1));
    inputVillagerCount = get(villagerCount);
  }

  function decVillager() {
    const cur = get(villagerCount);
    setVillagerCount(Math.max(0, cur - 1));
    inputVillagerCount = get(villagerCount);
  }

  function applyVillagerInput() {
    const n = parseInt(inputVillagerCount, 10);
    if (!isNaN(n) && n >= 0 && n <= 99) {
      setVillagerCount(n);
      inputVillagerCount = get(villagerCount);
    } else {
      inputVillagerCount = get(villagerCount);
    }
  }

</script>

<div class="root" inert={showWishSummary}>
  {#if !showMeteor && !showWishResult && !showWishSummary}<HomeTools />{/if}
  <section style:background-image={`url(${JSON.stringify($backgroundImage)})`}>
    <div class="col top">
      <div class="header-content">
        <h1 class="wish-title">
          <span class="logo-star">✦</span>
          <span>{$wishTitle}</span>
        </h1>
        <p class="wish-desc">{$wishSubtitle}</p>
      </div>
    </div>

    <div class="col banner" >
      <div class="item">
        <div class="flip-container" class:flipped>
          <!-- ============ flip-front ============ -->
          <div class="flip-front banner-card" inert={flipped}>
            <div class="card-bg" style:background-image={`url(${JSON.stringify($mainVisual)})`}></div>
            <div class="card-glow top-left"></div>
            <div class="card-glow bottom-right"></div>
            <div class="card-border">
              <div class="corner tl"></div><div class="corner tr"></div>
              <div class="corner bl"></div><div class="corner br"></div>
            </div>
<!-- 
            <div class="card-content">
              <div class="featured-label">杏坛铭 · UP</div>
              <div class="featured-name">？？？</div>
              <div class="featured-quote">"命运，在此刻交织——"</div>
            </div>
 -->
            <div class="villager-count-badge">当前村民数：{$villagerCount}</div>

            <!-- 奖品预览区 -->
            <div class="prize-preview">
              <div class="prize-label">{currentPrizeTitle || "当前奖品"}</div>
              <div class="prize-img-box">
                <img src={currentPrizeSrc || "/img/gift_default.png"} alt="奖品预览" />
              </div>
              <span class="prize-name">{currentPrizeName}</span>
            </div>
            <div class="card-info">
              <button class="detail-btn" type="button" aria-label="设置" title="设置" onclick={toggleFlip}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="m19.43 12.98.04-.98-.04-.98 2.11-1.65-2-3.46-2.49 1a7.54 7.54 0 0 0-1.7-.98L15 3.25h-4l-.35 2.68a7.54 7.54 0 0 0-1.7.98l-2.49-1-2 3.46 2.11 1.65-.04.98.04.98-2.11 1.65 2 3.46 2.49-1c.52.4 1.09.73 1.7.98L11 20.75h4l.35-2.68a7.54 7.54 0 0 0 1.7-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" transform="translate(-1 0)" fill-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- ============ flip-back ============ -->
          <div class="flip-back banner-card" inert={!flipped}>
            <div class="card-bg-back"></div>
            <div class="card-border">
              <div class="corner tl"></div><div class="corner tr"></div>
              <div class="corner bl"></div><div class="corner br"></div>
            </div>

            <!-- 大标题，独立于三栏容器，更靠上 -->
            <div class="settings-title">奖池设置</div>
            <!-- 三栏容器，左右肩并肩 -->
            <div class="back-panels">
              <!-- 左：村民数量与增加悬念 -->
              <div class="back-panel-stack">
              <div class="back-panel" id="back-panel-1">
                <div class="panel-title">村民数量</div>
                <div class="panel-subtitle">大家都参与进来才有意思嘛！</div>
                <div class="panel-content">
                  <div class="villager-ctrl">
                    <button class="adj-btn" onclick={decVillager}>−</button>
                    <input
                      class="settings-value-input"
                      type="number"
                      aria-label="村民数量"
                      min="0" max="99"
                      bind:value={inputVillagerCount}
                      onchange={applyVillagerInput}
                      onkeydown={(e) => { if (e.key === "Enter") applyVillagerInput(); }}
                    />
                    <button class="adj-btn" onclick={incVillager}>+</button>
                  </div>
                  <div class="control-note" style="text-align: center;">输入数字或按下 +/- 以改变村民数量</div>
                  <div class="control-note" style="text-align: center;">村民数量至多99个</div>
                </div>
              </div>
              <div class="back-panel" id="suspense-panel">
                <div class="panel-title suspense-heading">
                  <span>增加悬念？</span>
                  <button class="suspense-toggle" class:enabled={suspenseEnabled}
                    type="button" role="switch" aria-checked={suspenseEnabled} aria-label="增加悬念"
                    onclick={toggleSuspense}>
                    <span class="suspense-label-track" aria-hidden="true">
                      <span>启用！</span>
                      <span>禁用。</span>
                    </span>
                  </button>
                </div>
                <div class="panel-subtitle">启用后，不再直接展示中奖者…</div>
              </div>
              </div>
              <div class="back-panel" id="back-panel-2">
                <div class="panel-title">奖品管理</div>
                <PrizeManager onSpecify={specifyPrize} />
              </div>
            </div>
            <div class="card-info">
              <button class="detail-btn" type="button" aria-label="返回" title="返回" onclick={toggleFlip}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 10 12 3v4c7 0 10 5 10 13-2.5-5-5-7-10-7v4Z" transform="translate(0 24) scale(1 -1)" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col button">
      {#if !showMeteor && !showWishResult && !showWishSummary}
        <button class="draw-btn history-btn" disabled={savingDraw} onclick={() => { showHistory = true; }}>祈愿记录</button>
        <button class="draw-btn" disabled={savingDraw} onclick={() => requestDraw({ drawMode: "single" })}>
          <span class="btn-icon">✦</span> {savingDraw ? "正在抽取…" : "祈愿一次"}
        </button>
        <button class="draw-btn multi-btn" disabled={savingDraw} onclick={() => { showMultiWishPrompt = true; }}>
          <span class="btn-icon multi-wish-icon" aria-hidden="true">✦</span> 祈愿多次
        </button>
      {/if}
    </div>
  </section>
</div>

{#if historyError}<p class="history-error" role="alert" out:fade={{ duration: ERROR_TOAST_FADE_MS }}>{historyError}</p>{/if}
{#if showHistory}<WishHistory onClose={() => { showHistory = false; }} />{/if}
{#if showMultiWishPrompt}
  <MultiWishPrompt onCancel={() => { showMultiWishPrompt = false; }} onConfirm={confirmMultiWish} />
{/if}
{#if showMissingPrizePrompt}
  <MissingPrizePrompt onCancel={() => { showMissingPrizePrompt = false; }} onContinue={continueWithoutPrize} />
{/if}

{#if showMeteor}
  <Meteor key={drawKey} videoSrc={drawAssets.videoSrc} savesComplete={!savingDraw} onMeteorEnd={handleMeteorEnd} />
{/if}

{#if showWishResult}
  {#key `${drawKey}:${resultIndex}`}
    <WishResult list={[drawResult[resultIndex]]} assets={drawAssets} skip={false} onClose={handleCloseResult}
      {suspenseEnabled} onSecondPhase={playSecondPhaseAudio} onPlaybackStart={startResultAudio}
      position={resultIndex + 1} total={drawResult.length} />
  {/key}
{/if}

{#if showWishSummary}
  <WishSummary list={drawResult} onClose={finishResults} />
{/if}

<style>
  :global(body) {
    margin: 0; padding: 0; background: #0f0f23;
    font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
    color: #fff; overflow: hidden;
  }

  .root { 
    width: 100%; 
    height: 100dvh; 
  }

  section {
    width: 100%; 
    height: 100vh; 
    display: flex;
    flex-direction: column; 
    justify-content: center;
    align-items: center; 
    overflow: hidden;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  /* 字体相关设置 */
  .wish-title {
    position: relative;
    color: #fff; 
    font-size: 2rem; 
    font-weight: 600; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    letter-spacing: 0.08em; 
  }
  .wish-desc { 
    color: rgba(255, 255, 255, 0.6); 
    font-size: 0.85rem; 
    margin-top: 6px; 
    margin-left: 0;
  }
  .prize-label {
    font-family: "FZCuJinLing", "Microsoft YaHei", sans-serif;
    font-size: 1.4rem;
    color: rgba(0, 0, 0, 1);
    letter-spacing: 0.15em;
    margin-bottom: 0.4rem;
  }
  .settings-title {
    font-family: "FZCuJinLing", "Microsoft YaHei", sans-serif;
    position: absolute;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    font-size: 1.5rem;
    font-weight: 700;
    color: #d4b87a;
    letter-spacing: 0.2em;
  }
  .panel-title:not(.suspense-heading),
  .suspense-heading > span {
    font-family: "FZCuJinLing", "Microsoft YaHei", sans-serif;
  }

  .panel-title {
    text-align: left;
    font-size: 1rem;
    font-weight: 600;
    color: #d4b87a;
    margin-bottom: 0.1rem;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid rgba(180, 160, 120, 0.3);
  }
  .panel-subtitle {
    text-align: right;
    font-size: 0.6rem;
    color: rgba(200, 190, 170, 1);
    margin-bottom: 1.2rem;
  }
  .control-note {
    display: block;
    flex-basis: 100%;
    text-align: right;
    font-size: 0.5rem;
    color: rgba(200, 190, 170, 1);
    font-style: italic;
  }
  .panel-content {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    min-height: 0;
  }
  .btn-icon { margin-right: 0.4rem; font-size: 1.2rem; }
  .multi-wish-icon {
    position: relative;
    display: inline-block;
    margin-left: 0.25rem;
    margin-right: 0.65rem;
  }
  .multi-wish-icon::before,
  .multi-wish-icon::after {
    content: "✦";
    position: absolute;
    line-height: 1;
  }
  .multi-wish-icon::before {
    font-size: 0.55rem;
    left: -0.2rem;
    top: 0.05rem;
  }
  .multi-wish-icon::after {
    font-size: 0.7rem;
    right: -0.3rem;
    top: -0.15rem;
  }

  .col { 
    width: 100%; 
    display: block; 
  }

  .top { min-height: 70px; 
    padding: 30px 5%; 
    z-index: 5; 
  }

  .header-content { 
    --title-icon-width: 1.4rem;
    --title-icon-gap: 12px;
    padding-left: calc(var(--title-icon-width) + var(--title-icon-gap));
    display: flex; 
    flex-direction: column; 
    align-items: flex-start; 
  }

  .logo-star { 
    position: absolute;
    left: calc(0px - var(--title-icon-width) - var(--title-icon-gap));
    width: var(--title-icon-width);
    font-size: 1.4rem; 
    color: #d4b87a; 
  }

  .banner { 
    display: flex; 
    justify-content: center; 
    flex-direction: column; 
    padding: 0 8%; 
    flex: 1; 
  }

  .item { 
    position: relative; 
    width: 100%; max-width: 800px; 
    margin: 0 auto; 
    perspective: 1200px; 
    --card-scale: 1.4; 
    transform: scale(var(--card-scale)); 
  }

  .flip-container {
    display: grid;
    width: 100%;
    aspect-ratio: 27/14;
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .flip-container.flipped { transform: rotateX(180deg); }

  .flip-front, .flip-back {
    grid-area: 1 / 1;
    backface-visibility: hidden;
    pointer-events: none;
  }

  .flip-container.flipped .flip-back { pointer-events: auto; }

  .flip-container:not(.flipped) .flip-front { pointer-events: auto; }

  .flip-back { transform: rotateX(180deg); }



  .banner-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 60px rgba(100,130,200,0.15), 0 0 120px rgba(100,80,160,0.08), inset 0 0 80px rgba(0,0,0,0.3);
  }

  .card-bg { position: absolute; inset: 0; z-index: 1; background-position: center; background-size: cover; background-repeat: no-repeat; }

  .card-bg-back { position: absolute; inset: 0; z-index: 1; background: url("/img/visual_back.png") center / cover no-repeat; }

  .card-glow { position: absolute; width: 40%; height: 40%; border-radius: 50%; filter: blur(40px); z-index: 2; pointer-events: none; }

  .card-glow.top-left { top: -10%; left: -5%; background: radial-gradient(circle, rgba(100,140,220,0.25), transparent); }

  .card-glow.bottom-right { bottom: -10%; right: -5%; background: radial-gradient(circle, rgba(180,150,100,0.15), transparent); }

  .card-border { position: absolute; inset: 0; z-index: 3; pointer-events: none; }

  .corner { position: absolute; width: 30px; height: 30px; border-color: rgba(180,160,120,0.5); border-style: solid; }

  .corner.tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }

  .corner.tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }

  .corner.bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }

  .corner.br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

  .villager-count-badge {
    position: absolute;
    top: 5%;
    right: 5%;
    z-index: 5;
    padding: 0.45rem 0.8rem;
    border: 1px solid #dfbf8e;
    border-radius: 12px;
    background: rgba(247, 239, 223, 0.82);
    color: #594632;
    font-size: 0.85rem;
    line-height: 1.4;
    white-space: nowrap;
  }

  .card-info {
    position: absolute; 
    right: 5%; 
    bottom: 5%; 
    z-index: 5; 
  }

  .detail-btn { background: rgba(255,255,255,0.8); color: #3a3450; border: 2px solid rgba(218,199,156,1); border-radius: 50%; box-sizing: border-box; width: 2rem; height: 2rem; padding: 0; display: grid; place-items: center; cursor: pointer; transition: all 0.25s; }

  .detail-btn svg { width: 65%; height: 65%; }

  .detail-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

  .detail-btn:hover { background: rgba(255,255,255,1); color: #1a1a2e; }

  .flip-back .detail-btn {
    background: rgba(24, 39, 51, 0.92);
    border-color: rgba(99, 155, 172, 0.6);
    color: #d4b87a;
  }

  .flip-back .detail-btn:hover { background: rgba(36, 57, 73, 0.98); }



  /* ---------- 奖品预览区（flip-front 右侧） ---------- */

  /* 奖品预览外层容器 */
  .prize-preview {
    position: absolute;
    left: 7%;
    bottom: calc(7% + 16px);
    transform: scale(0.9);
    transform-origin: bottom left;
    z-index: 5;
    width:  25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap:  3px;
  }
  .prize-preview::before {
    content: "";
    position: absolute;
    inset: -16px -20px;
    z-index: -1;
    border: 1px solid #dfbf8e;
    border-radius: 20px;
    background: rgba(247, 239, 223, 0.82);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
    pointer-events: none;
  }

  .prize-img-box {
    height: 100%;
    max-height: 100%;
    aspect-ratio: 1;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .prize-img-box img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .prize-name {
    min-height: 1em;
    font-size: 0.7rem;
    color: rgba(0, 0, 0, 1);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ========== 奖池设置左右两栏 ========== */
  .back-panels {
    position: absolute;
    top: 24%;
    left: 5%;
    right: 5%;
    bottom: 15%;                /* 留空间给底部返回按钮 */
    z-index: 4;
    display: flex;
    gap: 3%;
  }

  .back-panel-stack {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0.6rem;
  }

  .back-panel-stack > .back-panel { min-height: 0; }

  #suspense-panel .panel-subtitle { min-height: 1lh; margin-bottom: 0; }

  .suspense-heading { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
  .suspense-toggle {
    position: relative;
    overflow: hidden;
    width: calc(3em + 0.9rem);
    height: calc(1.4em + 0.24rem + 2px);
    flex-shrink: 0;
    padding: 0;
    border: 1px solid rgba(99, 155, 172, 0.6);
    border-radius: 6px;
    background: #34434d;
    color: #c8beb0;
    font: inherit;
    font-size: 0.65rem;
    line-height: 1.4;
    cursor: pointer;
    transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease;
  }
  .suspense-label-track {
    display: flex;
    width: 200%;
    height: 100%;
    transform: translateX(-50%);
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .suspense-label-track > span {
    flex: 0 0 50%;
    display: grid;
    place-items: center;
    white-space: nowrap;
  }
  .suspense-toggle.enabled .suspense-label-track { transform: translateX(0); }
  @media (prefers-reduced-motion: reduce) {
    .suspense-toggle, .suspense-label-track { transition: none; }
  }
  .suspense-toggle.enabled { background: #d4b87a; border-color: #d4b87a; color: #182733; }
  .suspense-toggle:hover { filter: brightness(1.12); }
  .suspense-toggle:focus-visible { outline: 2px solid #d4b87a; outline-offset: 2px; }

  .back-panel{
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    background: rgba(24, 39, 51, 0.92);
    border: 2px solid rgba(99, 155, 172, 0.6);
    padding: 0.5rem 1rem;
  }

  #back-panel-2 { flex: 2.5; min-width: 0; min-height: 0; gap: 0.5rem; }

  /* 村民数量控件行 */
  .villager-ctrl {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.6rem; 
  }

  .adj-btn {
    width: 30px; height: 30px;
    border: 1px solid rgba(180, 160, 120, 0.4);
    border-radius: 50%;
    background: rgba(238, 232, 227, 0.1);
    color: #d4b87a;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .adj-btn:hover { background: rgba(238, 232, 227, 0.25); }

  /* 数字输入框 */
  .settings-value-input {
    width: 3rem;
    padding: 0.2rem 0.3rem;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    background: rgba(238, 232, 227, 0.1);
    border: 1px solid rgba(180, 160, 120, 0.4);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.2s;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .settings-value-input::-webkit-inner-spin-button,

  .settings-value-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .settings-value-input:focus { border-color: #d4b87a; }

  .button { width: auto; position: fixed; bottom: 2.5rem; left: 2.5rem; right: 2.5rem; z-index: 10; height: auto; display: flex; gap: 1rem; }

  .draw-btn { background: linear-gradient(135deg, #8b6914, #d4b87a); color: #1a1a2e; border: none; border-radius: 50px; padding: 0.9rem 2.2rem; font-size: 1.1rem; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; box-shadow: 0 4px 20px rgba(180,150,100,0.3); transition: transform 0.2s, box-shadow 0.2s; }

  .draw-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(180,150,100,0.5); }

  .draw-btn:active { transform: translateY(0); box-shadow: 0 2px 10px rgba(180,150,100,0.3); }
  .history-btn { margin-right: auto; }
  .draw-btn:disabled { opacity: .6; cursor: wait; }
  .history-error { position: fixed; bottom: 6.5rem; left: 50%; transform: translateX(-50%); z-index: 15; max-width: calc(100vw - 32px); padding: 12px 18px; border-radius: 6px; background: #182733; color: #ffb4a6; }

  @media (max-width: 1200px), (max-height: 760px) {
    :global(body) { overflow-y: auto; }
    .root { height: auto; min-height: 100dvh; }
    section { height: auto; min-height: 100dvh; overflow: visible; }
    .item { --card-scale: 1; }
    .banner { padding: 1rem; }
    .top { padding: 1.5rem; }
    .button { width: 100%; position: static; flex-wrap: wrap; box-sizing: border-box; height: auto; padding: 1.5rem; display: flex; justify-content: space-between; gap: 1rem; }
    .draw-btn { position: static; }
  }

  /* 桌面主视觉以整个视口为中心，标题与操作按钮独立定位。 */
  @media (min-width: 701px) {
    :global(body) { overflow: hidden; }
    .root { height: 100dvh; }
    section { position: relative; height: 100dvh; min-height: 0; overflow: hidden; }
    .top { position: absolute; top: 0; left: 0; box-sizing: border-box; padding-right: 180px; }
    .banner {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      box-sizing: border-box;
      flex: none;
      padding: 0 8%;
    }
    .item {
      max-width: min(800px, calc(max(160px, 100dvh - 240px) * 27 / 14 / var(--card-scale)));
    }
    .button {
      position: fixed;
      width: auto;
      bottom: 2.5rem;
      left: 2.5rem;
      right: 2.5rem;
      padding: 0;
    }
  }

  @media (max-width: 700px) {
    .header-content { --title-icon-gap: 0.4rem; }
    .top { padding-top: 80px; }
    .button { padding: 1rem; gap: .5rem; }
    .draw-btn { padding: .9rem 1rem; font-size: .95rem; }
    .wish-title { font-size: clamp(1.1rem, 4.8vw, 1.6rem); gap: 0.4rem; }
    .wish-desc { line-height: 1.7; }
    .flip-container { aspect-ratio: auto; transition: none; }
    .flip-container.flipped { transform: none; }
    .flip-front { aspect-ratio: 27 / 14; min-height: 240px; }
    .flip-back { display: none; transform: none; }
    .flip-container.flipped .flip-front { display: none; }
    .flip-container.flipped .flip-back { display: flex; flex-direction: column; }
    .settings-title { position: relative; top: auto; left: auto; transform: none; padding: 1rem; text-align: center; }
    .back-panels { position: relative; inset: auto; flex-direction: column; gap: 1rem; padding: 0 1rem; }
    .back-panel-stack { flex: none; grid-template-rows: auto auto; gap: 1rem; }
    .back-panel { min-width: 0; padding: 1rem; background: rgba(24, 39, 51, 0.92); }
    .panel-title { font-size: 1.1rem; }
    .panel-subtitle { font-size: 0.8rem; margin-bottom: 0.8rem; }
    .panel-content { gap: 0.8rem; }
    .control-note { font-size: 0.75rem; line-height: 1.6; }
    .villager-ctrl { margin: 0; }
    .adj-btn { width: 44px; height: 44px; }
    .settings-value-input { min-height: 44px; }
    .flip-back .card-info { position: relative; inset: auto; padding: 1rem; text-align: right; }
    .detail-btn { width: 44px; height: 44px; display: inline-grid; }
    .prize-preview { width: 33%; }
    .prize-label { font-size: 1rem; }
    .prize-name { font-size: 0.75rem; }
  }

</style>




