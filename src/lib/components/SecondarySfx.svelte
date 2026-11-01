<script>
  import { onMount } from "svelte";

  let { sources } = $props();
  const COUNT = 12;
  const DELAY = 1100;
  const DURATION = 800;

  const OFFSETS = [
    { dx:  678, dy:  412 },
    { dx:  723, dy:  114 },
    { dx:  794, dy: -288 },
    { dx:  552, dy: -446 },
    { dx:  -52, dy: -462 },
    { dx: -751, dy: -375 },
    { dx: -693, dy: -138 },
    { dx: -709, dy:    3 },
    { dx: -688, dy:  184 },
    { dx: -528, dy:  394 },
    { dx: -243, dy:  508 },
    { dx:   15, dy:  507 },
  ];

  let imgs = $state([]);

  function flyOut(node, theta) {
    const k = window.innerWidth/2 * Math.abs(Math.cos(theta)) + window.innerHeight/2 * Math.abs(Math.sin(theta));
    const dx = k * Math.cos(theta);
    const dy = k * Math.sin(theta);

    const anim = node.animate(
      [
        { transform: "translate(0px, 0px)", opacity: 0,   offset: 0 },
        { transform: "translate(0px, 0px)", opacity: 1,   offset: 0.001 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 1,   offset: 1 }
      ],
      { duration: DURATION, delay: DELAY, fill: "both", easing: "linear" }
    );
    return { destroy() { anim.cancel(); } };
  }

  onMount(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    imgs = Array.from({ length: COUNT }, (_, i) => {
      const sx = OFFSETS[i].dx * (W / 1920);
      const sy = OFFSETS[i].dy * (H / 1080);
      return {
        src: sources[i],
        theta: Math.atan2(sy, sx)
      };
    });
  });
</script>

<div class="sfx-layer">
  {#each imgs as img, i (i)}
    <img class="sfx-img" src={img.src} alt="" use:flyOut={img.theta} />
  {/each}
</div>

<style>
  .sfx-layer {
    position: fixed;
    inset: 0;
    z-index: 27;
    pointer-events: none;
    overflow: hidden;
  }
  .sfx-img {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
</style>
