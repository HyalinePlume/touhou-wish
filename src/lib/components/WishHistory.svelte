<script>
  import DialogCloseButton from "$lib/components/DialogCloseButton.svelte";
  import { onMount } from "svelte";
  import { listWishRecords, resetWishRecords, formatDrawTime } from "$lib/data/wishHistory.js";

  let { onClose = () => {} } = $props();
  let historyDialog;
  let confirmationDialog;
  let records = $state([]);
  let loading = $state(true);
  let resetting = $state(false);
  let error = $state("");

  onMount(() => {
    historyDialog.showModal();
    let alive = true;
    listWishRecords()
      .then(list => {
        if (!alive) return;
        // 每条特等奖独立随机设置起点和 80%～125% 的流速，仅在读取记录时生成。
        records = list.map(record => record.stars === 6
          ? {
              ...record,
              rainbowOffset: -(0.01 + Math.random() * 0.98),
              rainbowSpeed: 0.8 + Math.random() * 0.45
            }
          : record);
      })
      .catch(err => { if (alive) error = err.message || "无法读取祈愿记录"; })
      .finally(() => { if (alive) loading = false; });
    return () => { alive = false; };
  });

  function closeHistory() {
    historyDialog.close();
    onClose();
  }

  async function confirmReset() {
    if (resetting) return;
    resetting = true;
    error = "";
    try {
      await resetWishRecords();
      records = [];
      confirmationDialog.close();
    } catch (err) {
      error = err.message || "清空失败，请重试";
    } finally {
      resetting = false;
    }
  }
</script>

<dialog class="history" bind:this={historyDialog} aria-labelledby="history-title"
  oncancel={(event) => { event.preventDefault(); closeHistory(); }}>
  <header>
    <h2 id="history-title">祈愿记录</h2>
    <DialogCloseButton label="关闭祈愿记录" onclick={closeHistory} />
  </header>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (允许键盘聚焦并滚动记录列表) -->
  <div class="record-list" tabindex="0" role="region" aria-label="过往祈愿结果" aria-busy={loading}>
    {#if loading}
      <p class="empty">正在读取记录…</p>
    {:else if records.length === 0}
      <p class="empty">暂无祈愿记录</p>
    {:else}
      <table aria-label="祈愿记录表格">
        <colgroup><col class="prize-column" /><col class="category-column" /><col class="character-column" /><col class="count-column" /><col class="time-column" /></colgroup>
        <thead><tr><th scope="col">奖品</th><th scope="col">奖品分类</th><th scope="col">祈愿结果</th><th scope="col">村民总数</th><th scope="col">时间</th></tr></thead>
        <tbody>
          {#each records as record (record.id)}
            <tr>
              <td>
                <!-- 6 星文字显示虹彩；字符数少时流动更快，时长除以独立的随机流速倍率。 -->
                <span class="prize-name" class:emphasized={record.stars >= 4}
                  class:first-prize={record.stars >= 5} class:special-prize={record.stars === 6}
                  style:--rainbow-offset={record.rainbowOffset}
                  style:--rainbow-duration={
                    record.stars === 6 ? `${3 / Math.max(3 - Array.from(record.prizeName).length, 1) / record.rainbowSpeed}s` : undefined}>
                    {record.prizeName}
                  </span>
              </td>
              <td class="category">{record.prizeTitle} · {record.stars}⭐</td>
              <td>{record.characterName}</td>
              <td class="count">{record.villagerCount}</td>
              <td><time datetime={new Date(record.drawnAt).toISOString()}>{formatDrawTime(record.drawnAt)}</time></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  {#if error && !resetting}<p class="error" role="alert">{error}</p>{/if}
  <footer>
    <button class="reset" disabled={loading || resetting || records.length === 0}
      onclick={() => { error = ""; confirmationDialog.showModal(); }}>重置记录</button>
  </footer>
</dialog>

<dialog class="confirmation" bind:this={confirmationDialog} aria-labelledby="reset-title"
  oncancel={(event) => { if (resetting) event.preventDefault(); }}>
  <h2 id="reset-title">确认重置记录？</h2>
  <p>确认后将清空全部祈愿记录，无法恢复。已抽出的角色将重新加入奖池。</p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="confirm-actions">
    <button disabled={resetting} onclick={() => confirmationDialog.close()}>取消</button>
    <button class="reset" disabled={resetting} onclick={confirmReset}>{resetting ? "正在清空…" : "确认"}</button>
  </div>
</dialog>

<style>
  dialog { position: fixed; inset: 0; margin: auto; box-sizing: border-box; color: #594632; background: #f7efdf; border: 1px solid #dfbf8e; border-radius: 20px; padding: 0; box-shadow: 0 24px 80px #0005; }
  dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  .history { --dialog-close-background: #eee8e31a; --dialog-close-color: #eee8df; color: #eee8df; background: #182733; border-color: #639bac; border-radius: 12px; box-shadow: 0 20px 80px #0008; width: min(1000px, calc(100vw - 32px)); max-height: min(80dvh, calc(100dvh - 32px)); }
  .history::backdrop { background: #060e1ac4; backdrop-filter: none; }
  .history header, .history footer { border-color: #639bac55; }
  .history h2 { color: #d4b87a; }
  .history .empty { color: #b1bec8; }
  .history .error { color: #ffb4a6; }
  .history .reset { color: #ffd3cb; background: #eee8e31a; border-color: #ca7e6d88; border-radius: 6px; }
  .history .reset:hover:not(:disabled) { background: #eee8e32e; }
  .history[open] { display: flex; flex-direction: column; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #dfbf8e; }
  h2 { margin: 0; color: #9a592b; font-size: 1.25rem; }
  button { font: inherit; cursor: pointer; color: #784923; background: #eadac0; border: 1px solid #dfbf8e; border-radius: 20px; padding: 10px 18px; }
  button:hover:not(:disabled) { background: #e3cba7; }
  button:disabled { opacity: .45; cursor: default; }
  button:focus-visible, .record-list:focus-visible { outline: 3px solid #dc904d; outline-offset: 2px; }
  .record-list { overflow: auto; min-height: 0; overscroll-behavior: contain; padding: 0 24px; }
  table { width: 100%; min-width: 820px; table-layout: fixed; border-collapse: separate; border-spacing: 0; font-size: .95rem; color: #eee8df; background: #182733; }
  .prize-column { width: 23%; } .category-column { width: calc(18%); } .character-column { width: calc(22%); } .count-column { width: 12%; } .time-column { width: 25%; }
  th, td { padding: 15px 12px; text-align: center; vertical-align: middle; border-bottom: 1px solid #639bac44; border-right: 1px solid #639bac33; overflow-wrap: anywhere; }
  th:first-child, td:first-child { border-left: 1px solid #639bac33; }
  th { position: sticky; top: 0; z-index: 1; background: #243d4d; color: #d4b87a; font-weight: 600; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #ffffff04; }
  tbody tr:hover { background: #639bac12; }
  .category, .first-prize { color: #f6d77b; }
  .prize-name.emphasized { font-weight: 700; }
  .special-prize { color: #ffd6ef; }
  @supports ((background-clip: text) or (-webkit-background-clip: text)) {
    .special-prize {
      background-image: repeating-linear-gradient(90deg, #ffb6ce 0%, #ffd58a 8.33%, #f9ee98 16.67%, #9fe5d2 25%, #a9ceff 33.33%, #d6b5ff 41.67%, #ffb6ce 50%);
      background-size: 200% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: rainbow-flow var(--rainbow-duration, 5s) linear infinite;
      animation-delay: calc(var(--rainbow-duration, 5s) * var(--rainbow-offset, 0));
    }
  }
  @keyframes rainbow-flow { from { background-position: 100% 50%; } to { background-position: 0% 50%; } }
  @media (prefers-reduced-motion: reduce) { .special-prize { animation: none; } }
  .count { text-align: center; font-variant-numeric: tabular-nums; }
  time { color: #b1bec8; font-size: .85rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .empty { text-align: center; color: #89745b; padding: 40px 0; }
  footer { padding: 16px 24px; border-top: 1px solid #dfbf8e; }
  .reset { color: #a34e3e; border-color: #ca7e6d88; }
  .error { color: #b13928; margin: 12px 24px; }
  .confirmation { width: min(400px, calc(100vw - 32px)); padding: 24px; }
  .confirmation p { line-height: 1.7; }
  .confirmation .error { margin: 12px 0; }
  .confirm-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  .confirm-actions .reset { background: #b85b49; border-color: #b85b49; color: #fff; }
  .confirm-actions .reset:hover:not(:disabled) { background: #a34e3e; border-color: #a34e3e; }
  @media (max-width: 700px) { header { padding: 12px 16px; } .record-list { padding: 0 16px; } footer { padding: 12px 16px; } }
</style>
