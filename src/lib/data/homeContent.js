import { DEFAULT_COLORS, validColor } from "$lib/helpers/homeColors.js";
import { writable } from "svelte/store";
import { createHomeImageView, isLocalImage, prepareHomeImage } from "$lib/helpers/homeImages.js";

/** 首页文案和图片的默认值；图片值为可用于 CSS 的图片地址。 */
export const DEFAULT_HOME_CONTENT = Object.freeze({
  ...DEFAULT_COLORS,
  wishTitle: "东方杏坛铭 · 抽奖祈愿",
  wishSubtitle: "鸟类都喜欢亮晶晶的小玩意……人又何尝不是呢？",
  mainVisual: "/img/visual.png",
  backgroundImage: "/img/bg_pic.png",
});

export const wishTitle = writable(DEFAULT_HOME_CONTENT.wishTitle);
export const wishSubtitle = writable(DEFAULT_HOME_CONTENT.wishSubtitle);
export const mainVisual = writable(DEFAULT_HOME_CONTENT.mainVisual);
export const backgroundImage = writable(DEFAULT_HOME_CONTENT.backgroundImage);

export const titleColor = writable(DEFAULT_COLORS.titleColor);
export const toolsColor = writable(DEFAULT_COLORS.toolsColor);
export const drawColor = writable(DEFAULT_COLORS.drawColor);
const contentStores = { wishTitle, wishSubtitle, mainVisual, backgroundImage, titleColor, toolsColor, drawColor };
let loadPromise;
const imageKeys = ["mainVisual", "backgroundImage"];
const imageViews = {};

export function getHomeImage(key) {
  return imageViews[key] || createHomeImageView(DEFAULT_HOME_CONTENT[key]);
}

// 独立数据库保存文案、原图 Blob 和预览缩略图。
function transaction(mode, run) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xtm_home_content", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore("content");
    request.onerror = () => reject(request.error);
    request.onblocked = () => { blocked = true; reject(new Error("请关闭其他旧版页面后重试")); };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      let result;
      let failure;
      try {
        const tx = db.transaction("content", mode);
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onabort = () => { db.close(); reject(failure || tx.error || new Error("首页内容保存失败")); };
        try { run(tx.objectStore("content"), value => { result = value; }); }
        catch (cause) { failure = cause; tx.abort(); }
      } catch (cause) { db.close(); reject(cause); }
    };
  });
}

function applyContent(values) {
  for (const [key, store] of Object.entries(contentStores)) {
    const value = values?.[key];
    if (key in DEFAULT_COLORS && !validColor(value)) continue;
    if (imageKeys.includes(key)) {
      if (typeof value !== "string" && !isLocalImage(value)) continue;
      if (imageViews[key]?.value === value) continue;
      const previous = imageViews[key];
      imageViews[key] = createHomeImageView(value);
      store.set(imageViews[key].url);
      // 留出一帧，让页面先换用新地址。
      if (previous) requestAnimationFrame(() => previous.dispose());
    } else if (typeof value === "string") store.set(value);
  }
}

/** 页面挂载时读取暂存内容；失败后允许重试。 */
export function loadHomeContent() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("当前环境无法访问浏览器存储"));
  if (!loadPromise) {
    loadPromise = transaction("readonly", (store, done) => {
      store.get("home").onsuccess = event => done(event.target.result);
    }).then(async values => {
      const prepared = { ...values };
      await Promise.all(imageKeys.map(async key => {
        if (prepared[key] !== undefined) prepared[key] = await prepareHomeImage(prepared[key]);
      }));
      applyContent(prepared);
    }).catch(cause => { loadPromise = undefined; throw cause; });
  }
  return loadPromise;
}

/** 只更新传入的字段。例如 setHomeContent({ wishTitle: "新的标题" })。 */
export async function setHomeContent(values) {
  values = { ...values };
  // 先检查所有字段，避免错误输入导致部分字段已被修改。
  for (const [key, value] of Object.entries(values)) {
    if ((key in DEFAULT_COLORS && !validColor(value)) || !Object.hasOwn(contentStores, key) || (typeof value !== "string" && !(imageKeys.includes(key) && isLocalImage(value)))) {
      throw new TypeError(`无效的首页内容字段或值：${key}`);
    }
  }
  await loadHomeContent();
  // 保存时也将旧 Base64 图片迁移为 Blob；不把临时 URL 写入数据库。
  for (const key of imageKeys) {
    const value = Object.hasOwn(values, key) ? values[key] : getHomeImage(key).value;
    values[key] = await prepareHomeImage(value);
    if (typeof values[key] === "string" && values[key].startsWith("blob:")) {
      throw new TypeError("临时图片地址不能持久保存，请选择本地图片。");
    }
  }
  const saved = await transaction("readwrite", (store, done) => {
    store.get("home").onsuccess = event => {
      const merged = { ...DEFAULT_HOME_CONTENT, ...event.target.result, ...values };
      store.put(merged, "home");
      done(merged);
    };
  });
  // 事务成功提交后才更新页面，避免把存储失败显示为保存成功。
  applyContent(saved);
}

/** 分别恢复单项内容，并返回默认值，供编辑框同步显示。 */
export async function resetWishTitle() {
  await setHomeContent({ wishTitle: DEFAULT_HOME_CONTENT.wishTitle });
  return DEFAULT_HOME_CONTENT.wishTitle;
}

export async function resetWishSubtitle() {
  await setHomeContent({ wishSubtitle: DEFAULT_HOME_CONTENT.wishSubtitle });
  return DEFAULT_HOME_CONTENT.wishSubtitle;
}

export async function resetMainVisual() {
  await setHomeContent({ mainVisual: DEFAULT_HOME_CONTENT.mainVisual });
  return DEFAULT_HOME_CONTENT.mainVisual;
}

export async function resetBackgroundImage() {
  await setHomeContent({ backgroundImage: DEFAULT_HOME_CONTENT.backgroundImage });
  return DEFAULT_HOME_CONTENT.backgroundImage;
}
