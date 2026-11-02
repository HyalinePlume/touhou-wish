<script>
  import { onMount } from "svelte";

  let { onCancel = () => {}, onConfirm = () => {} } = $props();
  let promptDialog;
  let count = $state(undefined);
  let error = $state("");
  onMount(() => { promptDialog.showModal(); });

  function cancel() {
    promptDialog.close();
    onCancel();
  }

  function confirm(event) {
    event.preventDefault();
    const input = event.currentTarget.querySelector('#wish-count');
    const requestedCount = count ?? 10;
    if (input.validity.badInput || !Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 10) {
      error = "请输入 1～10 之间的整数。";
      return;
    }
    promptDialog.close();
    onConfirm(requestedCount);
  }
</script>

<dialog bind:this={promptDialog} aria-labelledby="multi-wish-title"
  oncancel={(event) => { event.preventDefault(); cancel(); }}>
  <form onsubmit={confirm} novalidate>
    <div class="count-fields">
    <div class="count-row">
    <label id="multi-wish-title" for="wish-count">祈愿次数：</label>
    <input id="wish-count" type="number" min="1" max="10" step="1" placeholder="留空则设置为10次"
      bind:value={count} aria-describedby="wish-count-help" aria-invalid={Boolean(error)}
      oninput={() => { error = ""; }} />
    </div>
    <p id="wish-count-help">请输入 1～10 之间的整数</p>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    </div>
    <div class="actions">
      <button type="button" onclick={cancel}>取消</button>
      <button class="confirm" type="submit">确定</button>
    </div>
  </form>
</dialog>

<style>
  dialog { position: fixed; inset: 0; margin: auto; width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 32px; box-sizing: border-box; color: #594632; background: #f7efdf; border: 1px solid #dfbf8e; border-radius: 20px; box-shadow: 0 24px 80px #0005; }
  dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  .count-fields { width: fit-content; max-width: 100%; margin: 0 auto; }
  .count-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
  label { flex-shrink: 0; font-size: 1.4rem; }
  input { box-sizing: border-box; width: 260px; min-width: 0; min-height: 56px; font: inherit; font-size: 1.2rem; color: #594632; background: #fffbf3; border: 1px solid #d8bd96; border-radius: 6px; padding: 12px 14px; }
  input::placeholder { color: #89745b; font-size: 1rem; }
  p { margin: 12px 0 0; text-align: left; color: #89745b; font-size: 1rem; }
  @media (max-width: 480px) {
    dialog { padding: 24px 18px; }
    .count-row { gap: 8px; }
    label { font-size: 1.1rem; }
    input { width: 210px; padding: 10px; }
    input::placeholder { font-size: .85rem; }
  }
  .error { color: #b13928; }
  .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  button { font: inherit; cursor: pointer; color: #784923; background: #eadac0; border: 1px solid #dfbf8e; border-radius: 20px; padding: 10px 18px; }
  button:hover { background: #e3cba7; }
  .confirm { background: #bc7338; border-color: #bc7338; color: #fff4e2; }
  .confirm:hover { background: #a9622e; }
  button:focus-visible, input:focus-visible { outline: 3px solid #dc904d; outline-offset: 2px; }
</style>
