/*
 * audio.js — 音效管理
 * BGM：始终持续播放，抽卡时静音而非暂停，结束后缓入恢复
 * 自动播放：刷新后尝试自动播放，若被浏览器阻止则等首次用户交互后启动
 */
import { browser } from "$app/environment";
import { writable } from "svelte/store";
import { VILLAGER_THEME_START } from "$lib/data/characters.js";
// 调试开关：true 按人物 themeStart 起播；false 所有主题曲从头播放。
const ENABLE_THEME_START = true;
// 音量范围 0～1；以下时长统一为毫秒。
const BGM_VOLUME = 0.4;
const BGM_FADE_IN_MS = 1000;
const THEME_START_VOLUME = 0.2;
const THEME_TARGET_VOLUME = 0.6;
const THEME_FADE_IN_MS = 2000;
// 连抽切换先保持再淡出；回首页立即淡出，单独控制时长。
export const THEME_EXIT_HOLD_MS = 9000; // 切换至下一曲时，上一曲的保留时间。仅当下一曲出bug了一直不播才可能用得上
export const THEME_EXIT_FADE_MS = 1300;
export const THEME_RETURN_FADE_MS = 300;
// 固定背景音乐；两段亮相音效由本次抽奖的素材参数传入。
const sources = {
  wishBacksound: "/sfx/wish_backsound.mp3",
};
const cache = {};
export const bgmPlaying = writable(false);
let userBgmMuted = false;
let bgmSuppressed = false;
let savedBgmVolume = BGM_VOLUME;
if (browser) {
  Object.entries(sources).forEach(([name, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    if (name === "wishBacksound") {
      audio.loop = true;
      audio.volume = BGM_VOLUME;
      let playing = false;
      const syncPlaying = () => bgmPlaying.set(playing && !audio.paused && !audio.muted && audio.volume > 0);
      audio.addEventListener("playing", () => { playing = true; syncPlaying(); });
      for (const event of ["pause", "waiting", "ended", "error", "emptied"]) {
        audio.addEventListener(event, () => { playing = false; syncPlaying(); });
      }
      audio.addEventListener("volumechange", syncPlaying);
    }
    cache[name] = audio;
  });
}
// 每条音轨只保留一组重试监听；失败后等待下一次有效交互。
async function startBgm(audio) {
  if (audio._playPending) return;
  audio._playPending = true;
  try {
    await audio.play();
    audio._removeRetry?.();
  } catch {
    if (audio._removeRetry) return;
    const resume = () => startBgm(audio);
    const events = ["click", "touchend", "keydown"];
    audio._removeRetry = () => {
      for (const event of events) document.removeEventListener(event, resume);
      audio._removeRetry = null;
    };
    for (const event of events) document.addEventListener(event, resume);
  } finally { audio._playPending = false; }
}
/** 播放音效。BGM 若被浏览器拦下，会等首次用户交互后自动重试 */
/** 播放叮声：每次新建 Audio 实例，不掐断前一次 */
export function playDing() {
  if (!browser) return;
  const ding = new Audio("/sfx/ding.mp3");
  ding.volume = 1;
  ding.play().catch(() => {});
  return () => {
    ding.pause();
    ding.currentTime = 0;
  };
}
export function playSfx(name = "click", src) {
  if (!browser) return;
  if (src && cache[name]?.getAttribute("src") !== src) {
    cache[name]?.pause();
    cache[name] = new Audio(src);
    cache[name].preload = "auto";
  }
  const audio = cache[name];
  if (!audio) return false;
  // BGM 保持播放进度，所有启动入口共用同一套失败重试。
  if (name === "wishBacksound") {
    if (audio.paused) startBgm(audio);
    return true;
  }
  audio.load();
  audio.currentTime = 0;
  const promise = audio.play();
  if (promise) promise.catch(() => {});
  return true;
}
export function isBgmMuted() { return userBgmMuted; }

/** 用户开关只改变 BGM 音量；播放进度继续，且独立于祈愿期间的临时静音。 */
export function setBgmMuted(muted) {
  if (!browser || userBgmMuted === muted) return;
  const bgm = cache["wishBacksound"];
  if (!bgm) return;
  if (muted && !bgmSuppressed && bgm.volume > 0) savedBgmVolume = bgm.volume;
  userBgmMuted = muted;
  clearInterval(bgm._fadeTimer);
  bgm._fadeTimer = null;
  bgm.volume = muted || bgmSuppressed ? 0 : savedBgmVolume;
  if (!muted) playSfx("wishBacksound");
}

/** 祈愿期间临时静音 BGM */
export function muteBgm() {
  if (!browser) return;
  const bgm = cache["wishBacksound"];
  if (!bgm) return;
  bgmSuppressed = true;
  bgm._fadeTimer && clearInterval(bgm._fadeTimer);
  bgm._fadeTimer = null;
  bgm.volume = 0;
}
/** 缓入恢复 BGM 音量（默认 1s） */
export function unmuteBgm(duration = BGM_FADE_IN_MS / 1000) {
  if (!browser) return;
  const bgm = cache["wishBacksound"];
  if (!bgm) return;
  bgmSuppressed = false;
  clearInterval(bgm._fadeTimer);
  bgm._fadeTimer = null;
  if (userBgmMuted) { bgm.volume = 0; return; }
  /* 如果 BGM 因浏览器策略暂停了，先恢复播放 */
  if (bgm.paused) startBgm(bgm);
  bgm._fadeTimer && clearInterval(bgm._fadeTimer);
  const target = savedBgmVolume;
  const steps = Math.max(1, duration * 30);
  const delta = target / steps;
  let step = 0;
  bgm._fadeTimer = setInterval(() => {
    step++;
    bgm.volume = Math.min(delta * step, target);
    if (step >= steps) {
      clearInterval(bgm._fadeTimer);
      bgm._fadeTimer = null;
    }
  }, 1000 / 30);
}

let themeAudio = null;
const retiringThemes = new Set();

function stopThemeAudio(audio) {
  clearInterval(audio._fadeTimer);
  audio._fadeTimer = null;
  audio.pause();
  audio.currentTime = 0;
}

/** 退出总时长可限制在下一首启动之前；优先保留淡出，压缩保持时间。 */
export function fadeOutTheme({ maxDurationMs = Infinity, skipHold = false, fadeDurationMs = THEME_EXIT_FADE_MS } = {}) {
  if (!themeAudio) return;
  const audio = themeAudio;
  themeAudio = null;
  clearInterval(audio._fadeTimer);
  audio._fadeTimer = null;
  const startVolume = audio.volume;
  const budget = Math.max(0, maxDurationMs);
  const fadeMs = Math.min(Math.max(0, fadeDurationMs), budget);
  const holdMs = skipHold ? 0 : Math.min(Math.max(0, THEME_EXIT_HOLD_MS), budget - fadeMs);
  const fadeStart = performance.now() + holdMs;
  let fadeTimer;
  let holdTimer;
  const finish = () => {
    clearTimeout(holdTimer);
    clearInterval(fadeTimer);
    audio.volume = 0;
    stopThemeAudio(audio);
    retiringThemes.delete(finish);
  };
  retiringThemes.add(finish);
  holdTimer = setTimeout(() => {
    const tick = () => {
      const progress = fadeMs <= 0 ? 1
        : Math.min(1, Math.max(0, (performance.now() - fadeStart) / fadeMs));
      audio.volume = startVolume * (1 - progress);
      if (progress >= 1) finish();
    };
    fadeTimer = setInterval(tick, 1000 / 60);
    tick();
  }, holdMs);
}

/** 播放角色主题音乐（独立实例，不干扰 BGM），按文件顶部参数从起始音量渐强到目标音量 */
export function playTheme(src, themeStart = 0) {
  if (!browser) return;
  if (!src) return;
  stopTheme(); // 新曲开始前清理所有旧音轨，防止长保持时间或后台计时器延迟造成叠播。
  const fallback = "/sfx/theme/villager_theme.mp3";
  const audio = new Audio(src);
  audio.volume = THEME_START_VOLUME;
  const startPlayback = () => {
    if (themeAudio !== audio) return;
    if (ENABLE_THEME_START && Number.isFinite(themeStart) && themeStart > 0) {
      // 等待元数据后再定位，避免加载期间的跳转被浏览器忽略。
      audio.currentTime = Number.isFinite(audio.duration)
        ? Math.min(themeStart, Math.max(0, audio.duration - 0.01)) : themeStart;
    }
    /* 默认 2 秒匀渐强 */
    const fadeSteps = Math.max(1, Math.round(THEME_FADE_IN_MS / 1000 * 30));
    const fadeDelta = (THEME_TARGET_VOLUME - THEME_START_VOLUME) / fadeSteps;
    let fadeStep = 0;
    audio._fadeTimer = setInterval(() => {
      fadeStep++;
      audio.volume = THEME_START_VOLUME + fadeDelta * Math.min(fadeStep, fadeSteps);
      if (fadeStep >= fadeSteps) {
        clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
      }
    }, 1000 / 30);
    audio.play().catch(() => {});
  };
  themeAudio = audio;
  audio.addEventListener("error", () => {
    if (themeAudio !== audio) return;
    if (src === fallback) return;  /* 已经是兜底路径，放弃 */
    playTheme(fallback, VILLAGER_THEME_START);
  });
  if (audio.readyState >= 1) startPlayback();
  else audio.addEventListener("loadedmetadata", startPlayback, { once: true });
}

/** 页面销毁等场景立即停止全部主题音乐，并清理退出计时器。 */
export function stopTheme() {
  for (const finish of retiringThemes) finish();
  if (themeAudio) stopThemeAudio(themeAudio);
  themeAudio = null;
}
