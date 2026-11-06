<script>
  import { autoHomeColor } from "$lib/helpers/autoHomeColors.js";
  import { onDestroy } from "svelte";
  import { createHomeImageView, prepareHomeImage } from "$lib/helpers/homeImages.js";
  import { get } from "svelte/store";
  import DialogCloseButton from "$lib/components/DialogCloseButton.svelte";
  import { DEFAULT_COLORS, colorStyle } from "$lib/helpers/homeColors.js";
  import { titleColor, toolsColor, drawColor, wishTitle, wishSubtitle, getHomeImage, loadHomeContent, setHomeContent, resetWishTitle, resetWishSubtitle, resetMainVisual, resetBackgroundImage } from "$lib/data/homeContent.js";

  const colorFields=[{key:'titleColor',label:'左上角文字颜色'},{key:'toolsColor',label:'右上角按钮颜色'},{key:'drawColor',label:'底部祈愿按钮颜色'}];
  let dialog;
  let draft = $state({ wishTitle: "", wishSubtitle: "", mainVisual: "", backgroundImage: "" });
  let images = $state.raw({ mainVisual: null, backgroundImage: null });
  const ownedViews = new Set();
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

  function enterImageUrl(key, value) {
    setImage(key, createHomeImageView(value));
  }

  let error = $state("");
  let loading = $state(false);
  let session = 0;
  let visualInput;
  let backgroundInput;

  function loadCurrent() {
    releaseDraftImages();
    draft = { titleColor: get(titleColor), toolsColor: get(toolsColor), drawColor: get(drawColor), wishTitle: get(wishTitle), wishSubtitle: get(wishSubtitle), mainVisual: "", backgroundImage: "" };
    setImage("mainVisual", getHomeImage("mainVisual"));
    setImage("backgroundImage", getHomeImage("backgroundImage"));
    error = "";
    visualInput.value = "";
    backgroundInput.value = "";
  }

  export async function open() {
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

  async function selectImage(event, key) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      error = "请选择图片文件。";
      return;
    }
    const currentSession = session;
    error = "";
    loading = true;
    try {
      const value = await prepareHomeImage({ blob: file, name: file.name });
      if (session !== currentSession) return;
      const view = createHomeImageView(value);
      ownedViews.add(view);
      setImage(key, view);
    } catch (cause) {
      if (session === currentSession) error = cause.message;
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function autoColor(key) {
    if (loading) return;
    const currentSession = session;
    loading = true;
    error = '';
    try {
      const color = await autoHomeColor(images.backgroundImage.url, key);
      if (session === currentSession) draft[key] = color;
    } catch (cause) {
      if (session === currentSession) error = cause.message;
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    if (loading) return;
    const currentSession = session;
    loading = true;
    error = "";
    try {
      await setHomeContent({ ...draft, mainVisual: images.mainVisual.value, backgroundImage: images.backgroundImage.value });
      if (session === currentSession) dialog.close();
    } catch {
      if (session === currentSession) error = "保存失败，请检查浏览器存储空间或权限后重试。";
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function restore(key, reset) {
    const currentSession = session;
    loading = true;
    error = "";
    try {
      const value = await reset();
      if (session !== currentSession) return;
      if (key === "mainVisual" || key === "backgroundImage") setImage(key, getHomeImage(key));
      else draft[key] = value;
      if (key === "mainVisual") visualInput.value = "";
      if (key === "backgroundImage") backgroundInput.value = "";
    } catch {
      if (session === currentSession) error = "恢复默认值失败，请检查浏览器存储空间或权限后重试。";
    } finally {
      if (session === currentSession) loading = false;
    }
  }

</script>

<dialog bind:this={dialog} aria-labelledby="home-editor-title" onclose={() => { session++; releaseDraftImages(); }}>
  <form onsubmit={save}>
    <header>
      <h2 id="home-editor-title">编辑首页内容</h2>
      <DialogCloseButton label="关闭编辑窗口" onclick={() => dialog.close()} />
    </header>
    <div class="scroll-content">
    <div class="fields">
      <div class="field-heading">
        <label for="home-wish-title">标题</label>
        <button class="restore" type="button" disabled={loading} onclick={() => restore("wishTitle", resetWishTitle)}>恢复默认值</button>
      </div>
      <input id="home-wish-title" type="text" disabled={loading} bind:value={draft.wishTitle} />
      <div class="field-heading">
        <label for="home-wish-subtitle">副标题</label>
        <button class="restore" type="button" disabled={loading} onclick={() => restore("wishSubtitle", resetWishSubtitle)}>恢复默认值</button>
      </div>
      <textarea id="home-wish-subtitle" rows="3" disabled={loading} bind:value={draft.wishSubtitle}></textarea>
      <fieldset>
<legend>界面配色</legend>
<p class="note">每个区域选择一种主色，自动搭配文字、边框和阴影。“自动选色”根据当前背景图和主页位置推荐颜色，可继续微调，保存后应用。</p>
{#each colorFields as field}
<div class="color-row"><label for={field.key}>{field.label}</label><input id={field.key} type="color" value={draft[field.key] || DEFAULT_COLORS[field.key]} disabled={loading} oninput={event => draft[field.key] = event.currentTarget.value} /><button class="restore" type="button" disabled={loading} onclick={() => draft[field.key] = DEFAULT_COLORS[field.key]}>恢复默认</button><button class="restore" type="button" disabled={loading} onclick={() => autoColor(field.key)}>自动选色</button></div>
{/each}
<div class="color-preview" style={colorStyle(draft)} aria-label="配色预览"><div class="sample-title">✦ {draft.wishTitle || '标题'}<small>{draft.wishSubtitle || '副标题'}</small></div><span class="sample-tool">?</span><span class="sample-draw">✦ 祈愿一次</span></div>
</fieldset>
<div class="image-fields">
      <fieldset>
        <legend>主视觉图</legend>
        <div class="field-heading">
          <label for="home-main-visual">图片地址</label>
          <button class="restore" type="button" disabled={loading} onclick={() => restore("mainVisual", resetMainVisual)}>恢复默认值</button>
        </div>
        <input id="home-main-visual" type="text" disabled={loading} value={draft.mainVisual} oninput={(event) => enterImageUrl("mainVisual", event.currentTarget.value)} placeholder="输入图片地址，或选择本地图片" />
        <label class="file-label" for="home-visual-file">选择本地图片</label>
        <input id="home-visual-file" type="file" accept="image/*" bind:this={visualInput} disabled={loading} onchange={(event) => selectImage(event, "mainVisual")} />
        {#if images.mainVisual?.name}<p class="image-name">{images.mainVisual.name}（本地图片）</p>{/if}
        {#if images.mainVisual?.preview}<img class="preview" decoding="async" src={images.mainVisual.preview} alt="主视觉图预览" />{/if}
      </fieldset>
      <fieldset>
        <legend>背景图</legend>
        <div class="field-heading">
          <label for="home-background">图片地址</label>
          <button class="restore" type="button" disabled={loading} onclick={() => restore("backgroundImage", resetBackgroundImage)}>恢复默认值</button>
        </div>
        <input id="home-background" type="text" disabled={loading} value={draft.backgroundImage} oninput={(event) => enterImageUrl("backgroundImage", event.currentTarget.value)} placeholder="输入图片地址，或选择本地图片" />
        <label class="file-label" for="home-background-file">选择本地图片</label>
        <input id="home-background-file" type="file" accept="image/*" bind:this={backgroundInput} disabled={loading} onchange={(event) => selectImage(event, "backgroundImage")} />
        {#if images.backgroundImage?.name}<p class="image-name">{images.backgroundImage.name}（本地图片）</p>{/if}
        {#if images.backgroundImage?.preview}<img class="preview" decoding="async" src={images.backgroundImage.preview} alt="背景图预览" />{/if}
      </fieldset>
      </div>
    </div>
    <p class="note">主视觉图请裁剪为2:1横幅；背景图推荐进行一定高斯模糊处理</p>
    <p class="note"></p>
    {#if loading}<p role="status">正在处理，请稍候…</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    </div>
    <footer>
      <button type="button" onclick={() => dialog.close()}>取消</button>
      <button class="primary" type="submit" disabled={loading}>保存</button>
    </footer>
  </form>
</dialog>

<style>
.color-row {display:flex;align-items:center;gap:10px;flex-wrap:wrap;}.color-row label {flex:1;}input[type="color"] {width:42px;height:34px;padding:2px;cursor:pointer;}
.color-preview {padding:16px;border-radius:8px;background:linear-gradient(110deg,#34434d 50%,#ddd6c6 50%);display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
.sample-title {width:100%;color:var(--home-title);}.sample-title small {display:block;margin-top:6px;}
.sample-tool {display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--home-tools);color:var(--home-ink);border:1px solid var(--home-toolBorder);}
.sample-draw {padding:10px 20px;border-radius:30px;background:linear-gradient(135deg,var(--home-start),var(--home-end));color:var(--home-text);border:1px solid var(--home-drawBorder);}

  dialog { position: fixed; inset: 0; margin: auto; width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: hidden; padding: 0; border: 1px solid #dfbf8e; border-radius: 20px; background: #f7efdf; color: #594632; box-shadow: 0 24px 80px #0005; }
  form { display: flex; flex-direction: column; max-height: calc(100dvh - 34px); }
  .scroll-content { min-height: 0; overflow-y: auto; padding: 4px 28px 0; }
  dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 28px 28px 16px; flex-shrink: 0; }
  h2 { margin: 0; font-size: 1.35rem; color: #9a592b; }
  button, input, textarea { font: inherit; }
  button { border: 1px solid #dfbf8e; border-radius: 20px; padding: 9px 16px; background: #eadac0; color: #784923; cursor: pointer; }
  button:hover { background: #e3cba7; }
  .fields { display: grid; gap: 10px; }
  .image-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  label, legend { font-size: .9rem; font-weight: 600; }
  input[type="text"], textarea { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid #d8bd96; border-radius: 8px; background: #fffbf3; color: #594632; }
  textarea { resize: vertical; }
  fieldset { min-width: 0; display: grid; gap: 10px; margin: 8px 0 0; padding: 14px; border: 1px solid #dfbf8e; border-radius: 10px; }
  legend { padding: 0 6px; color: #9a592b; }
  input[type="file"] { width: 100%; min-width: 0; font-size: .8rem; }
  .file-label { font-size: .8rem; font-weight: 400; }
  .image-name { margin: 0; font-size: .8rem; overflow-wrap: anywhere; }
  .preview { display: block; width: 100%; height: 120px; object-fit: contain; border-radius: 6px; background: #eadac0; }
  .note { font-size: .78rem; line-height: 1.7; color: #89745b; margin: 8px 0; }
  .error { color: #b13928; }
  footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 28px 24px; border-top: 1px solid #dfbf8e; background: #f7efdf; flex-shrink: 0; }
  .field-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .restore { padding: 5px 10px; font-size: .78rem; white-space: nowrap; }
  .primary { background: #bc7338; color: #fff4e2; border-color: #bc7338; }
  .primary:hover { background: #a9622e; }
  button:disabled { opacity: .5; cursor: wait; }
  button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #dc904d; outline-offset: 3px; }
  @media (max-width: 700px) {
    header { padding: 20px 20px 16px; }
    .scroll-content { padding: 4px 20px 0; }
    footer { padding: 14px 20px 20px; }
  }
</style>
