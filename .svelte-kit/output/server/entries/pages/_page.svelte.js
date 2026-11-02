import { a6 as ssr_context, e as escape_html, a7 as attr, a8 as ensure_array_like, a9 as attr_class, aa as bind_props, ab as attr_style, ac as store_get, ad as unsubscribe_stores } from "../../chunks/index.js";
import "clsx";
import { w as writable, g as get } from "../../chunks/index2.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
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
let userBgmMuted = false;
function isBgmMuted() {
  return userBgmMuted;
}
let themeAudio = null;
const retiringThemes = /* @__PURE__ */ new Set();
let cancelPendingTheme = null;
function cancelThemeSchedule() {
  cancelPendingTheme?.();
  cancelPendingTheme = null;
}
function stopThemeAudio(audio) {
  clearInterval(audio._fadeTimer);
  audio._fadeTimer = null;
  audio.pause();
  audio.currentTime = 0;
}
function stopTheme() {
  cancelThemeSchedule();
  for (const finish of retiringThemes) finish();
  if (themeAudio) stopThemeAudio(themeAudio);
  themeAudio = null;
}
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
const SHOW_SFX_STARS = { 3: 3, 4: 4, 5: 5, 6: 5 };
function selectWishAssets({ rarity = 4, drawMode = "single" } = {}) {
  if (!Object.hasOwn(VFX_STARS, rarity)) throw new Error("不支持的奖品星级");
  if (drawMode !== "single" && drawMode !== "multi") throw new Error("不支持的抽卡模式");
  const vfxDirectory = `/img/vfx_${VFX_STARS[rarity]}star`;
  return {
    rarity,
    drawMode,
    show1Src: `/sfx/show1_${SHOW_SFX_STARS[rarity]}stars.mp3`,
    show2Src: "/sfx/show2.mp3",
    videoSrc: `/videos/${rarity}star-${drawMode}.mp4`,
    vfxDirectory,
    lightSrc: `${vfxDirectory}/light.png`,
    particleSources: Array.from({ length: 8 }, (_, i) => `${vfxDirectory}/vfx_1_${i + 1}.png`),
    secondarySources: Array.from({ length: 12 }, (_, i) => `${vfxDirectory}/vfx_2_${i + 1}.png`)
  };
}
function DialogCloseButton($$renderer, $$props) {
  let { label = "关闭", onclick } = $$props;
  $$renderer.push(`<button type="button"${attr("aria-label", label)} class="svelte-h4qdaw">×</button>`);
}
function isLocalImage(value) {
  return value?.blob instanceof Blob;
}
async function prepareHomeImage(value) {
  if (typeof value === "string" && value.startsWith("data:image/")) {
    const response = await fetch(value);
    value = { blob: await response.blob(), name: "已保存的本地图片" };
  }
  if (!isLocalImage(value) || value.thumbnail instanceof Blob) return value;
  const url = URL.createObjectURL(value.blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("缩略图生成失败，请重新选择图片。")), "image/webp", 0.85);
    });
    return { blob: value.blob, name: value.name || "本地图片", thumbnail };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function createHomeImageView(value) {
  if (!isLocalImage(value)) return { value, url: value, preview: value, name: "", dispose() {
  } };
  const url = URL.createObjectURL(value.blob);
  const preview = URL.createObjectURL(value.thumbnail || value.blob);
  return { value, url, preview, name: value.name || "已保存的本地图片", dispose() {
    URL.revokeObjectURL(url);
    URL.revokeObjectURL(preview);
  } };
}
const DEFAULT_HOME_CONTENT = Object.freeze({
  wishTitle: "东方杏坛铭 · 抽奖祈愿",
  wishSubtitle: "鸟类都喜欢亮晶晶的小玩意……人又何尝不是呢？",
  mainVisual: "/img/visual.png",
  backgroundImage: "/img/bg_pic.png"
});
const wishTitle = writable(DEFAULT_HOME_CONTENT.wishTitle);
const wishSubtitle = writable(DEFAULT_HOME_CONTENT.wishSubtitle);
const mainVisual = writable(DEFAULT_HOME_CONTENT.mainVisual);
const backgroundImage = writable(DEFAULT_HOME_CONTENT.backgroundImage);
const contentStores = { wishTitle, wishSubtitle, mainVisual, backgroundImage };
let loadPromise;
const imageKeys = ["mainVisual", "backgroundImage"];
const imageViews = {};
function getHomeImage(key) {
  return imageViews[key] || createHomeImageView(DEFAULT_HOME_CONTENT[key]);
}
function transaction(mode, run) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xtm_home_content", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore("content");
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("请关闭其他旧版页面后重试"));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      let result;
      let failure;
      try {
        const tx = db.transaction("content", mode);
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onabort = () => {
          db.close();
          reject(failure || tx.error || new Error("首页内容保存失败"));
        };
        try {
          run(tx.objectStore("content"), (value) => {
            result = value;
          });
        } catch (cause) {
          failure = cause;
          tx.abort();
        }
      } catch (cause) {
        db.close();
        reject(cause);
      }
    };
  });
}
function applyContent(values) {
  for (const [key, store] of Object.entries(contentStores)) {
    const value = values?.[key];
    if (imageKeys.includes(key)) {
      if (typeof value !== "string" && !isLocalImage(value)) continue;
      if (imageViews[key]?.value === value) continue;
      const previous = imageViews[key];
      imageViews[key] = createHomeImageView(value);
      store.set(imageViews[key].url);
      if (previous) requestAnimationFrame(() => previous.dispose());
    } else if (typeof value === "string") store.set(value);
  }
}
function loadHomeContent() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("当前环境无法访问浏览器存储"));
  if (!loadPromise) {
    loadPromise = transaction("readonly", (store, done) => {
      store.get("home").onsuccess = (event) => done(event.target.result);
    }).then(async (values) => {
      const prepared = { ...values };
      await Promise.all(imageKeys.map(async (key) => {
        if (prepared[key] !== void 0) prepared[key] = await prepareHomeImage(prepared[key]);
      }));
      applyContent(prepared);
    }).catch((cause) => {
      loadPromise = void 0;
      throw cause;
    });
  }
  return loadPromise;
}
function HomeContentEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let dialog;
    let draft = {
      wishTitle: "",
      wishSubtitle: "",
      mainVisual: "",
      backgroundImage: ""
    };
    let images = { mainVisual: null, backgroundImage: null };
    const ownedViews = /* @__PURE__ */ new Set();
    function releaseDraftImages() {
      for (const view of ownedViews) view.dispose();
      ownedViews.clear();
      images = { mainVisual: null, backgroundImage: null };
    }
    onDestroy(releaseDraftImages);
    function setImage(key, view) {
      const previous = images[key];
      images = { ...images, [key]: view };
      draft[key] = view.name ? "" : view.url;
      if (ownedViews.delete(previous)) previous.dispose();
    }
    let error = "";
    let loading = false;
    let session = 0;
    let visualInput;
    let backgroundInput;
    function loadCurrent() {
      releaseDraftImages();
      draft = {
        wishTitle: get(wishTitle),
        wishSubtitle: get(wishSubtitle),
        mainVisual: "",
        backgroundImage: ""
      };
      setImage("mainVisual", getHomeImage("mainVisual"));
      setImage("backgroundImage", getHomeImage("backgroundImage"));
      error = "";
      visualInput.value = "";
      backgroundInput.value = "";
    }
    async function open() {
      const currentSession = ++session;
      loading = true;
      loadCurrent();
      dialog.showModal();
      try {
        await loadHomeContent();
        if (session === currentSession) loadCurrent();
      } catch {
        if (session === currentSession) error = "暂存内容读取失败，请关闭窗口后重试。";
      } finally {
        if (session === currentSession) loading = false;
      }
    }
    $$renderer2.push(`<dialog aria-labelledby="home-editor-title" class="svelte-11w600l"><form class="svelte-11w600l"><header class="svelte-11w600l"><h2 id="home-editor-title" class="svelte-11w600l">编辑首页内容</h2> `);
    DialogCloseButton($$renderer2, { label: "关闭编辑窗口", onclick: () => dialog.close() });
    $$renderer2.push(`<!----></header> <div class="scroll-content svelte-11w600l"><div class="fields svelte-11w600l"><div class="field-heading svelte-11w600l"><label for="home-wish-title" class="svelte-11w600l">标题</label> <button class="restore svelte-11w600l" type="button"${attr("disabled", loading, true)}>恢复默认值</button></div> <input id="home-wish-title" type="text"${attr("disabled", loading, true)}${attr("value", draft.wishTitle)} class="svelte-11w600l"/> <div class="field-heading svelte-11w600l"><label for="home-wish-subtitle" class="svelte-11w600l">副标题</label> <button class="restore svelte-11w600l" type="button"${attr("disabled", loading, true)}>恢复默认值</button></div> <textarea id="home-wish-subtitle" rows="3"${attr("disabled", loading, true)} class="svelte-11w600l">`);
    const $$body = escape_html(draft.wishSubtitle);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <div class="image-fields svelte-11w600l"><fieldset class="svelte-11w600l"><legend class="svelte-11w600l">主视觉图</legend> <div class="field-heading svelte-11w600l"><label for="home-main-visual" class="svelte-11w600l">图片地址</label> <button class="restore svelte-11w600l" type="button"${attr("disabled", loading, true)}>恢复默认值</button></div> <input id="home-main-visual" type="text"${attr("disabled", loading, true)}${attr("value", draft.mainVisual)} placeholder="输入图片地址，或选择本地图片" class="svelte-11w600l"/> <label class="file-label svelte-11w600l" for="home-visual-file">选择本地图片</label> <input id="home-visual-file" type="file" accept="image/*"${attr("disabled", loading, true)} class="svelte-11w600l"/> `);
    if (images.mainVisual?.name) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="image-name svelte-11w600l">${escape_html(images.mainVisual.name)}（本地图片）</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (images.mainVisual?.preview) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<img class="preview svelte-11w600l" decoding="async"${attr("src", images.mainVisual.preview)} alt="主视觉图预览"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></fieldset> <fieldset class="svelte-11w600l"><legend class="svelte-11w600l">背景图</legend> <div class="field-heading svelte-11w600l"><label for="home-background" class="svelte-11w600l">图片地址</label> <button class="restore svelte-11w600l" type="button"${attr("disabled", loading, true)}>恢复默认值</button></div> <input id="home-background" type="text"${attr("disabled", loading, true)}${attr("value", draft.backgroundImage)} placeholder="输入图片地址，或选择本地图片" class="svelte-11w600l"/> <label class="file-label svelte-11w600l" for="home-background-file">选择本地图片</label> <input id="home-background-file" type="file" accept="image/*"${attr("disabled", loading, true)} class="svelte-11w600l"/> `);
    if (images.backgroundImage?.name) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="image-name svelte-11w600l">${escape_html(images.backgroundImage.name)}（本地图片）</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (images.backgroundImage?.preview) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<img class="preview svelte-11w600l" decoding="async"${attr("src", images.backgroundImage.preview)} alt="背景图预览"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></fieldset></div></div> <p class="note svelte-11w600l">主视觉图请裁剪为2:1横幅；背景图推荐进行一定高斯模糊处理</p> <p class="note svelte-11w600l"></p> `);
    if (loading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p role="status">正在处理，请稍候…</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (error) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="error svelte-11w600l" role="alert">${escape_html(error)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <footer class="svelte-11w600l"><button type="button" class="svelte-11w600l">取消</button> <button class="primary svelte-11w600l" type="submit"${attr("disabled", loading, true)}>保存</button></footer></form></dialog>`);
    bind_props($$props, { open });
  });
}
function HomeTools($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let musicMuted = isBgmMuted();
    let helpDialog;
    $$renderer2.push(`<div class="home-tools svelte-15evzt6" role="group" aria-label="音乐、文本编辑与帮助"><button${attr_class("round-button music-button svelte-15evzt6", void 0, { "muted": musicMuted })} type="button" aria-label="静音背景音乐"${attr("aria-pressed", musicMuted)}${attr("title", "静音背景音乐")}><span class="record svelte-15evzt6" aria-hidden="true"><span class="record-art svelte-15evzt6"><svg class="yin-yang svelte-15evzt6" viewBox="0 0 100 100"><g transform="rotate(-145 50 50)"><circle cx="50" cy="50" r="50" fill="#706B65"></circle><path d="M50 0 A50 50 0 0 0 50 100 A25 25 0 0 0 50 50 A25 25 0 0 1 50 0" fill="#08090b"></path><circle cx="50" cy="25" r="5" fill="#08090b"></circle><circle cx="50" cy="75" r="5" fill="#706B65"></circle></g></svg> <img class="record-reimu svelte-15evzt6" src="/img/reimu-for-record.png" alt=""/></span> <span class="record-shine svelte-15evzt6"></span> <span class="record-rim svelte-15evzt6"></span> <span class="record-center svelte-15evzt6"></span></span></button> <button class="round-button edit-button svelte-15evzt6" type="button" aria-label="内容编辑" title="内容编辑" aria-haspopup="dialog"><svg class="pen-icon svelte-15evzt6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"></path></svg></button> <button class="round-button help-button svelte-15evzt6" type="button" aria-label="关于这里" title="关于这里" aria-haspopup="dialog"><span aria-hidden="true">?</span></button></div> `);
    HomeContentEditor($$renderer2, {});
    $$renderer2.push(`<!----> <dialog class="help-dialog svelte-15evzt6" aria-labelledby="about-wish-title"><div class="help-heading svelte-15evzt6"><span class="help-eyebrow svelte-15evzt6">为东方例会而作的抽奖程序</span> `);
    DialogCloseButton($$renderer2, { label: "关闭说明", onclick: () => helpDialog.close() });
    $$renderer2.push(`<!----></div> <h2 id="about-wish-title" class="svelte-15evzt6">这是什么网页？</h2> <ul class="svelte-15evzt6"><li class="svelte-15evzt6">本网页是为 <strong class="svelte-15evzt6">北京邮电大学×北京师范大学联合东方例会「东方杏坛铭」活动</strong> 的抽奖环节而开发的纯前端展示网页。</li> <li class="svelte-15evzt6">通过 <s>抄袭</s> 致敬《原神》的祈愿系统，实现了类似的、妙趣横生（?）的抽奖体验。</li> <li class="svelte-15evzt6">不过，本网页中抽取的并不是小概率获得的人物，而是从含有全部东方人物（无旧作，可能有额外的村民）的人物池中，抽出幸运的几位，并为对应的玩家发放奖品。</li></ul> <section aria-labelledby="wish-process-title" class="svelte-15evzt6"><h2 id="wish-process-title" class="svelte-15evzt6">抽奖流程是什么？</h2> <ul class="svelte-15evzt6"><li class="svelte-15evzt6">若要使用本网页进行抽奖，请确保所有参与抽奖的观众均与一名东方人物（或村民）绑定。</li> <li class="svelte-15evzt6">在抽奖前，通过右下角的「设置」按钮进入奖池设置，在这里可以调整： <ul class="svelte-15evzt6"><li class="svelte-15evzt6"><strong class="svelte-15evzt6">村民数量：</strong>加入带有独立编号的村民，以免东方人物太少，不能绑定全部观众（村民数量将实时显示）</li> <li class="svelte-15evzt6"><strong class="svelte-15evzt6">奖品设置：</strong>提前导入奖品的图片、等级和名字。抽奖结果诞生后，为对应的观众发放。</li> <li class="svelte-15evzt6"><strong class="svelte-15evzt6">悬念模式：</strong>中奖人物立绘不会直接被展示，而是保持剪影形态，直到下一次鼠标点击。如此一来，抽奖会变得更有悬念吧？</li></ul></li> <li class="svelte-15evzt6">调整完设置后，点击右下角的按钮，可以进行单次或多次抽取。</li> <li class="svelte-15evzt6">单次抽取时，将直接展示中奖人物立绘；多次抽取时，将分别展示各人物立绘，最后总览全部中奖人物和名字。</li></ul></section> <section aria-labelledby="wish-rules-title" class="svelte-15evzt6"><h2 id="wish-rules-title" class="svelte-15evzt6">关于抽取规则……</h2> <ul class="svelte-15evzt6"><li class="svelte-15evzt6">抽取时，所有东方角色（无旧作）与对应数量的村民将被投入同一个人物池，</li> <li class="svelte-15evzt6">已中奖角色将被移除，不会再次中奖。除非，您清空保存中奖数据的“祈愿记录”名单。</li> <li class="svelte-15evzt6">剔除已中奖角色后，从人物池中等概率地抽取一名角色。</li> <li class="svelte-15evzt6">当执行连抽时，重复执行上面的逻辑，每次抽取后，先剔除人物，再进行下一次抽取。</li> <li class="svelte-15evzt6">人物库与抽取代码均位于 <code class="svelte-15evzt6">src/lib/data/characters.js</code></li></ul></section> <section aria-labelledby="other-events-title" class="svelte-15evzt6"><h2 id="other-events-title" class="svelte-15evzt6">其他活动能用吗？</h2> <ul class="svelte-15evzt6"><li class="svelte-15evzt6">本网站完全可用于其他以类似方式组织的抽奖活动。欢迎大家的使用和反馈！</li> <li class="svelte-15evzt6">通过右上角的按钮可以快捷编辑主界面文本、视觉图和背景图。</li></ul></section> <section aria-labelledby="diy-pool-title" class="svelte-15evzt6"><h2 id="diy-pool-title" class="svelte-15evzt6">我想DIY奖池……</h2> <ul class="svelte-15evzt6"><li class="svelte-15evzt6">人物池位于 <code class="svelte-15evzt6">src/lib/data/characters.js</code></li> <li class="svelte-15evzt6">根据格式，新增加人物时，需要提供该人物的： <ul class="svelte-15evzt6"><li class="svelte-15evzt6">姓名</li> <li class="svelte-15evzt6">称号</li> <li class="svelte-15evzt6">种族（由数字指代，参见文件内注释）</li> <li class="svelte-15evzt6">立绘图路径（建议放置于 <code class="svelte-15evzt6">static/chr</code>）</li> <li class="svelte-15evzt6">主题曲（需放置于 <code class="svelte-15evzt6">static/sfx/theme</code>）</li> <li class="svelte-15evzt6">提前播放秒数（参见文件内注释，用于在展示立绘时对轴播放音乐）</li></ul></li> <li class="svelte-15evzt6">此外，还需要一份 <strong class="svelte-15evzt6">400×1200</strong> 竖向裁切的透明底 PNG，保持相同命名放置于 <code class="svelte-15evzt6">static/chr-summary</code> 中，用于连抽结果的展示</li></ul></section> <button class="understood-button svelte-15evzt6" type="button">开始期待吧</button></dialog>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let showWishSummary = false;
    selectWishAssets();
    let flipped = false;
    let suspenseEnabled = false;
    let savingDraw = false;
    let errorToastTimer;
    let inputVillagerCount = get(villagerCount);
    let currentPrizeName = "暂未指定奖品";
    let show2Timer;
    onDestroy(() => {
      clearTimeout(errorToastTimer);
      cancelThemeSchedule();
      clearTimeout(show2Timer);
      stopTheme();
    });
    $$renderer2.push(`<div class="root svelte-1uha8ag"${attr("inert", showWishSummary, true)}>`);
    {
      $$renderer2.push("<!--[0-->");
      HomeTools($$renderer2);
    }
    $$renderer2.push(`<!--]--> <section class="svelte-1uha8ag"${attr_style("", {
      "background-image": `url(${JSON.stringify(store_get($$store_subs ??= {}, "$backgroundImage", backgroundImage))})`
    })}><div class="col top svelte-1uha8ag"><div class="header-content svelte-1uha8ag"><h1 class="wish-title svelte-1uha8ag"><span class="logo-star svelte-1uha8ag">✦</span> <span>${escape_html(store_get($$store_subs ??= {}, "$wishTitle", wishTitle))}</span></h1> <p class="wish-desc svelte-1uha8ag">${escape_html(store_get($$store_subs ??= {}, "$wishSubtitle", wishSubtitle))}</p></div></div> <div class="col banner svelte-1uha8ag"><div class="item svelte-1uha8ag"><div${attr_class("flip-container svelte-1uha8ag", void 0, { "flipped": flipped })}><div class="flip-front banner-card svelte-1uha8ag"${attr("inert", flipped, true)}><div class="card-bg svelte-1uha8ag"${attr_style("", {
      "background-image": `url(${JSON.stringify(store_get($$store_subs ??= {}, "$mainVisual", mainVisual))})`
    })}></div> <div class="card-glow top-left svelte-1uha8ag"></div> <div class="card-glow bottom-right svelte-1uha8ag"></div> <div class="card-border svelte-1uha8ag"><div class="corner tl svelte-1uha8ag"></div><div class="corner tr svelte-1uha8ag"></div> <div class="corner bl svelte-1uha8ag"></div><div class="corner br svelte-1uha8ag"></div></div> <div class="villager-count-badge svelte-1uha8ag">当前村民数：${escape_html(store_get($$store_subs ??= {}, "$villagerCount", villagerCount))}</div> <div class="prize-preview svelte-1uha8ag"><div class="prize-label svelte-1uha8ag">${escape_html("当前奖品")}</div> <div class="prize-img-box svelte-1uha8ag"><img${attr("src", "/img/gift_default.png")} alt="奖品预览" class="svelte-1uha8ag"/></div> <span class="prize-name svelte-1uha8ag">${escape_html(currentPrizeName)}</span></div> <div class="card-info svelte-1uha8ag"><button class="detail-btn svelte-1uha8ag" type="button" aria-label="设置" title="设置"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="svelte-1uha8ag"><path d="m19.43 12.98.04-.98-.04-.98 2.11-1.65-2-3.46-2.49 1a7.54 7.54 0 0 0-1.7-.98L15 3.25h-4l-.35 2.68a7.54 7.54 0 0 0-1.7.98l-2.49-1-2 3.46 2.11 1.65-.04.98.04.98-2.11 1.65 2 3.46 2.49-1c.52.4 1.09.73 1.7.98L11 20.75h4l.35-2.68a7.54 7.54 0 0 0 1.7-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" transform="translate(-1 0)" fill-rule="evenodd"></path></svg></button></div></div> <div class="flip-back banner-card svelte-1uha8ag"${attr("inert", !flipped, true)}><div class="card-bg-back svelte-1uha8ag"></div> <div class="card-border svelte-1uha8ag"><div class="corner tl svelte-1uha8ag"></div><div class="corner tr svelte-1uha8ag"></div> <div class="corner bl svelte-1uha8ag"></div><div class="corner br svelte-1uha8ag"></div></div> <div class="settings-title svelte-1uha8ag">奖池设置</div> <div class="back-panels svelte-1uha8ag"><div class="back-panel-stack svelte-1uha8ag"><div class="back-panel svelte-1uha8ag" id="back-panel-1"><div class="panel-title svelte-1uha8ag">村民数量</div> <div class="panel-subtitle svelte-1uha8ag">大家都参与进来才有意思嘛！</div> <div class="panel-content svelte-1uha8ag"><div class="villager-ctrl svelte-1uha8ag"><button class="adj-btn svelte-1uha8ag">−</button> <input class="settings-value-input svelte-1uha8ag" type="number" aria-label="村民数量" min="0" max="99"${attr("value", inputVillagerCount)}/> <button class="adj-btn svelte-1uha8ag">+</button></div> <div class="control-note svelte-1uha8ag" style="text-align: center;">输入数字或按下 +/- 以改变村民数量</div> <div class="control-note svelte-1uha8ag" style="text-align: center;">村民数量至多99个</div></div></div> <div class="back-panel svelte-1uha8ag" id="suspense-panel"><div class="panel-title suspense-heading svelte-1uha8ag"><span class="svelte-1uha8ag">增加悬念？</span> <button${attr_class("suspense-toggle svelte-1uha8ag", void 0, { "enabled": suspenseEnabled })} type="button" role="switch"${attr("aria-checked", suspenseEnabled)} aria-label="增加悬念"><span class="suspense-label-track svelte-1uha8ag" aria-hidden="true"><span class="svelte-1uha8ag">启用！</span> <span class="svelte-1uha8ag">禁用。</span></span></button></div> <div class="panel-subtitle svelte-1uha8ag">启用后，不再直接展示中奖者…</div></div></div> <div class="back-panel svelte-1uha8ag" id="back-panel-2"><div class="panel-title svelte-1uha8ag">奖品管理</div> `);
    PrizeManager($$renderer2);
    $$renderer2.push(`<!----></div></div> <div class="card-info svelte-1uha8ag"><button class="detail-btn svelte-1uha8ag" type="button" aria-label="返回" title="返回"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="svelte-1uha8ag"><path d="M3 10 12 3v4c7 0 10 5 10 13-2.5-5-5-7-10-7v4Z" transform="translate(0 24) scale(1 -1)"></path></svg></button></div></div></div></div></div> <div class="col button svelte-1uha8ag">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="draw-btn history-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}>祈愿记录</button> <button class="draw-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}><span class="btn-icon svelte-1uha8ag">✦</span> ${escape_html("祈愿一次")}</button> <button class="draw-btn multi-btn svelte-1uha8ag"${attr("disabled", savingDraw, true)}><span class="btn-icon multi-wish-icon svelte-1uha8ag" aria-hidden="true">✦</span> 祈愿多次</button>`);
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
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
