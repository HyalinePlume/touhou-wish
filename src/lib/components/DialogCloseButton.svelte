<script>
  let { label = "关闭", onclick } = $props();
</script>

<button type="button" aria-label={label} {onclick}>×</button>

<style>
  button { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: var(--dialog-close-background, #eadac0); color: var(--dialog-close-color, #995b2d); font-family: Arial, sans-serif; font-size: 25px; font-weight: 400; line-height: normal; cursor: pointer; flex-shrink: 0; }
  button:focus-visible { outline: 3px solid #dc904d; outline-offset: 4px; }
</style>
