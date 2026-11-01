import { m as ssr_context, e as escape_html, o as attr, p as ensure_array_like, q as attr_class } from "../../chunks/index.js";
import "clsx";
import { w as writable, g as get } from "../../chunks/index2.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
let userBgmMuted = false;
function isBgmMuted() {
  return userBgmMuted;
}
let themeAudio = null;
const retiringThemes = /* @__PURE__ */ new Set();
function stopThemeAudio(audio) {
  clearInterval(audio._fadeTimer);
  audio._fadeTimer = null;
  audio.pause();
  audio.currentTime = 0;
}
function stopTheme() {
  for (const finish of retiringThemes) finish();
  if (themeAudio) stopThemeAudio(themeAudio);
  themeAudio = null;
}
const STORAGE_KEY = "xtm_villager_count";
function getStoredCount() {
  if (typeof localStorage === "undefined") return 50;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return 50;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 50 : Math.max(0, Math.min(99, n));
}
const villagerCount = writable(getStoredCount());
villagerCount.subscribe((n) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, String(n));
});
const PRIZE_TIERS = [
  { value: "special", label: "特等奖", stars: 6 },
  { value: "first", label: "一等奖", stars: 5 },
  { value: "second", label: "二等奖", stars: 4 },
  { value: "third", label: "三等奖", stars: 3 }
];
function prizeTitle(prize) {
  return prize.customTitle?.trim() || PRIZE_TIERS.find((t) => t.value === prize.tier)?.label || "三等奖";
}
function prizeStars(prize) {
  return PRIZE_TIERS.find((t) => t.value === prize.tier)?.stars || 3;
}
function PrizeManager($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let prizes = [];
    let selected = null;
    let specifiedId = null;
    let busy = false;
    let message = "";
    let error = false;
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="manager svelte-o1k279">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="toolbar svelte-o1k279"><span class="hint svelte-o1k279">${escape_html(prizes.length)} / 20 件</span> <button${attr("disabled", busy, true)} class="svelte-o1k279">新增奖品</button> <button${attr("disabled", !selected, true)} class="svelte-o1k279">编辑 / 重命名</button></div> <div class="catalog svelte-o1k279"><div class="preview svelte-o1k279"><img${attr("src", "/img/gift_default.png")} alt="奖品图片预览" class="svelte-o1k279"/> <span class="preview-title svelte-o1k279">${escape_html("选择奖品预览")}</span></div> <div class="prize-list svelte-o1k279" aria-label="奖品列表">`);
      const each_array_1 = ensure_array_like(prizes);
      if (each_array_1.length !== 0) {
        $$renderer2.push("<!--[-->");
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let prize = each_array_1[$$index_1];
          $$renderer2.push(`<button${attr_class("prize-row svelte-o1k279", void 0, { "selected": selected?.id === prize.id })}${attr("disabled", busy, true)}${attr("aria-pressed", selected?.id === prize.id)}><span class="prize-text svelte-o1k279"><span>${escape_html(prize.name)}</span><small class="svelte-o1k279">${escape_html(prizeTitle(prize))}${escape_html(specifiedId === prize.id ? " · 当前指定" : "")}</small></span> <span class="stars svelte-o1k279"${attr("aria-label", prizeStars(prize) + "星")}${attr("title", prizeStars(prize) + "星")}>${escape_html("★".repeat(prizeStars(prize)))}</span></button>`);
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<p class="empty svelte-o1k279">暂无奖品，点击“新增奖品”添加。</p>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="footer svelte-o1k279"><p${attr_class("message svelte-o1k279", void 0, { "error": error })} role="status" aria-live="polite"${attr("title", message)}>${escape_html(message)}</p> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="toolbar bottom svelte-o1k279"><button${attr("disabled", !selected, true)} class="svelte-o1k279">${escape_html("指定奖品")}</button> <button${attr("disabled", !selected, true)} class="svelte-o1k279">删除奖品</button></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
const VFX_STARS = { 3: 3, 4: 4, 5: 5, 6: 6 };
function selectWishAssets({ rarity = 4, drawMode = "single" } = {}) {
  if (!Object.hasOwn(VFX_STARS, rarity)) throw new Error("不支持的奖品星级");
  if (drawMode !== "single" && drawMode !== "multi") throw new Error("不支持的抽卡模式");
  const vfxDirectory = `/img/vfx_${VFX_STARS[rarity]}star`;
  return {
    rarity,
    drawMode,
    videoSrc: `/videos/${rarity}star-${drawMode}.mp4`,
    vfxDirectory,
    lightSrc: `${vfxDirectory}/light.png`,
    particleSources: Array.from({ length: 8 }, (_, i) => `${vfxDirectory}/vfx_1_${i + 1}.png`),
    secondarySources: Array.from({ length: 12 }, (_, i) => `${vfxDirectory}/vfx_2_${i + 1}.png`)
  };
}
function HomeTools($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let musicMuted = isBgmMuted();
    $$renderer2.push(`<div class="home-tools svelte-15evzt6" role="group" aria-label="音乐与帮助"><button${attr_class("round-button music-button svelte-15evzt6", void 0, { "muted": musicMuted })} type="button" aria-label="背景音乐静音"${attr("aria-pressed", musicMuted)}${attr("title", "静音背景音乐")}><span class="record svelte-15evzt6" aria-hidden="true"><svg class="yin-yang svelte-15evzt6" viewBox="0 0 100 100"><g transform="rotate(-137.5 50 50)"><circle cx="50" cy="50" r="50" fill="#08090b"></circle><path d="M50 0 A50 50 0 0 0 50 100 A25 25 0 0 0 50 50 A25 25 0 0 1 50 0" fill="#aaa39b"></path><circle cx="50" cy="25" r="5" fill="#aaa39b"></circle><circle cx="50" cy="75" r="5" fill="#08090b"></circle></g></svg> <span class="record-grooves svelte-15evzt6"></span> <span class="record-shine svelte-15evzt6"></span> <img class="reimu svelte-15evzt6" src="/img/reimu-white.png" alt=""/> <span class="reimu-tint svelte-15evzt6"></span> <span class="record-rim svelte-15evzt6"></span> <span class="record-center svelte-15evzt6"></span></span></button> <button class="round-button help-button svelte-15evzt6" type="button" aria-label="关于角色祈愿" title="关于角色祈愿" aria-haspopup="dialog"><span aria-hidden="true">?</span></button></div> <dialog class="help-dialog svelte-15evzt6" aria-labelledby="about-wish-title"><div class="help-heading svelte-15evzt6"><span class="help-eyebrow svelte-15evzt6">东方杏坛铭</span> <button class="close-button svelte-15evzt6" type="button" aria-label="关闭说明">×</button></div> <h2 id="about-wish-title" class="svelte-15evzt6">让每一份惊喜，都有归属</h2> <p class="svelte-15evzt6">这是一个以「东方杏坛铭」角色祈愿为主题的抽奖网页。选好奖品，从角色与村民组成的奖池中随机抽出获奖者，用祈愿动画揭晓结果。</p> <ol class="svelte-15evzt6"><li class="svelte-15evzt6"><strong class="svelte-15evzt6">设置奖池</strong><span class="svelte-15evzt6">在「设置」中调整村民数量，添加并指定本轮奖品。</span></li> <li class="svelte-15evzt6"><strong class="svelte-15evzt6">开启祈愿</strong><span class="svelte-15evzt6">选择「祈愿一次」或「祈愿多次」，揭晓本轮获奖角色。</span></li> <li class="svelte-15evzt6"><strong class="svelte-15evzt6">回顾结果</strong><span class="svelte-15evzt6">在「祈愿记录」中查看奖品和获奖者。已抽出的角色不会重复入选，重置记录后可重新参与。</span></li></ol> <p class="storage-note svelte-15evzt6">奖品与祈愿记录保存在当前浏览器中。右上角的唱片按钮可静音或恢复主页面背景音乐。</p> <button class="understood-button svelte-15evzt6" type="button">开始期待吧</button></dialog>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let showWishSummary = false;
    selectWishAssets();
    let flipped = false;
    let savingDraw = false;
    let errorToastTimer;
    let inputVillagerCount = get(villagerCount);
    let currentPrizeName = "暂未指定奖品";
    let themeTimer;
    onDestroy(() => {
      clearTimeout(errorToastTimer);
      clearTimeout(themeTimer);
      stopTheme();
    });
    $$renderer2.push(`<div class="root svelte-1uha8ag"${attr("inert", showWishSummary, true)}>`);
    {
      $$renderer2.push("<!--[0-->");
      HomeTools($$renderer2);
    }
    $$renderer2.push(`<!--]--> <section class="svelte-1uha8ag"><div class="col top svelte-1uha8ag"><div class="header-content svelte-1uha8ag"><h1 class="wish-title svelte-1uha8ag"><span class="logo-star svelte-1uha8ag">✦</span> <span>东方杏坛铭 · 角色祈愿</span></h1> <p class="wish-desc svelte-1uha8ag">虽然说抽到了也不能把角色给你，但是，我们的小奖品还是不错的哦</p></div></div> <div class="col banner svelte-1uha8ag"><div class="item svelte-1uha8ag"><div${attr_class("flip-container svelte-1uha8ag", void 0, { "flipped": flipped })}><div class="flip-front banner-card svelte-1uha8ag"${attr("inert", flipped, true)}><div class="card-bg svelte-1uha8ag"></div> <div class="card-glow top-left svelte-1uha8ag"></div> <div class="card-glow bottom-right svelte-1uha8ag"></div> <div class="card-border svelte-1uha8ag"><div class="corner tl svelte-1uha8ag"></div><div class="corner tr svelte-1uha8ag"></div> <div class="corner bl svelte-1uha8ag"></div><div class="corner br svelte-1uha8ag"></div></div>  <div class="prize-preview svelte-1uha8ag"><div class="prize-label svelte-1uha8ag">${escape_html("当前奖品")}</div> <div class="prize-img-box svelte-1uha8ag"><img${attr("src", "/img/gift_default.png")} alt="奖品预览" class="svelte-1uha8ag"/></div> <span class="prize-name svelte-1uha8ag">${escape_html(currentPrizeName)}</span></div> <div class="card-info svelte-1uha8ag"><button class="detail-btn svelte-1uha8ag">设置</button></div></div> <div class="flip-back banner-card svelte-1uha8ag"${attr("inert", !flipped, true)}><div class="card-bg-back svelte-1uha8ag"></div> <div class="card-border svelte-1uha8ag"><div class="corner tl svelte-1uha8ag"></div><div class="corner tr svelte-1uha8ag"></div> <div class="corner bl svelte-1uha8ag"></div><div class="corner br svelte-1uha8ag"></div></div> <div class="settings-title svelte-1uha8ag">奖池设置</div> <div class="back-panels svelte-1uha8ag"><div class="back-panel svelte-1uha8ag" id="back-panel-1"><div class="panel-title svelte-1uha8ag">村民数量</div> <div class="panel-subtitle svelte-1uha8ag">大家都参与进来才有意思嘛！</div> <div class="panel-content svelte-1uha8ag"><div class="villager-ctrl svelte-1uha8ag"><button class="adj-btn svelte-1uha8ag">−</button> <input class="settings-value-input svelte-1uha8ag" type="number" aria-label="村民数量" min="0" max="99"${attr("value", inputVillagerCount)}/> <button class="adj-btn svelte-1uha8ag">+</button></div> <div class="control-note svelte-1uha8ag" style="text-align: center;">输入数字或按下 +/- 以改变村民数量</div> <div class="control-note svelte-1uha8ag" style="text-align: center;">村民数量至多99个</div></div></div> <div class="back-panel svelte-1uha8ag" id="back-panel-2"><div class="panel-title svelte-1uha8ag">奖品管理</div> `);
    PrizeManager($$renderer2);
    $$renderer2.push(`<!----></div></div> <div class="card-info svelte-1uha8ag"><button class="detail-btn svelte-1uha8ag">返回</button></div></div></div></div></div> <div class="col button svelte-1uha8ag">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="draw-btn history-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}>祈愿记录</button> <button class="draw-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}><span class="btn-icon svelte-1uha8ag">✦</span> ${escape_html("祈愿一次")}</button> <button class="draw-btn multi-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}><span class="btn-icon svelte-1uha8ag">✦</span> 祈愿多次</button>`);
    }
    $$renderer2.push(`<!--]--></div></section></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
