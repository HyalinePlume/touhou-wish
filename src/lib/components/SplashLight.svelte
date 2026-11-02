<script>
  /*
   * SplashLight.svelte — 光圈扩散动画
   * 照搬原项目，仅保留 4 星紫色配色
   */
  export let type = '';

  const removeAfterAnimate = (el) => {
    el.addEventListener('animationend', () => el?.remove());
  };
</script>

{#if type === 'in'}
  <div class="star4 orbs in5" data-result-independent></div>
  <div class="in star4 orbs in1" data-result-independent style="animation-duration: 1s;"></div>
  <div class="in star4 orbs in2" data-result-independent style="animation-duration: 1.2s;"></div>
  <div class="in star4 orbs in3" data-result-independent style="animation-duration: 1.1s;"></div>
  <div class="in star4 orbs in4" data-result-independent style="animation-duration: .75s;"></div>
{/if}

{#if type === 'out'}
  <div class="out star4 orbs out1" style="animation-duration: 0.8s; animation-delay: .1s;" use:removeAfterAnimate></div>
  <div class="out star4 orbs out2" style="animation-duration: 2s;" use:removeAfterAnimate></div>
  <div class="out star4 orbs out3" style="animation-duration: 1.2s; animation-delay: .1s;" use:removeAfterAnimate></div>
{/if}

<style>
  .orbs {
    background-color: transparent;
    border-radius: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    transform-origin: 0 0;
    pointer-events: none;
    opacity: 0;
  }

  .in  { animation: orbsIn forwards 1; }
  .in1 { width: 100%; }
  .in2 { width: 80%; }
  .in3 { width: 40%; }
  .in4 { width: 70%; }
  .in5 {
    position: fixed;
    transform: translate(-50%, 50%);
    bottom: 0;
    width: 100vw;
    aspect-ratio: 1/1;
    opacity: 1;
    animation: orbs2 forwards 1s 1;
  }

  .out {
    transform: scale(0) translate(-50%, -50%);
    opacity: 0;
    animation: outOrbs forwards 1;
  }
  .out1 { width: 50%; background-color: rgb(241 143 223 / 5%); }
  .out2 { width: 100%; }
  .out3 { width: 150%; }

  .star4.in1 {
    background-color: rgba(241, 143, 223, 0.05);
    box-shadow: 0 0 50px rgba(126, 20, 158, 0.1), inset 0 0 70px rgba(159, 51, 241, 0.1);
  }
  .star4.in2 {
    box-shadow: 0 0 50px rgb(113 34 221 / 30%), inset 0 0 70px rgb(113 34 221 / 30%);
  }
  .star4.in3 {
    box-shadow: 0 0 50px rgb(180 47 248 / 50%), inset 0 0 70px rgb(180 47 248 / 0%);
    background-image: radial-gradient(rgba(156, 71, 218, 1), rgb(180, 47, 248, 0));
  }
  .star4.in4 {
    box-shadow: 0 0 30px rgb(113 34 221 / 10%), inset 0 0 30px rgb(113 34 221 / 10%);
  }
  .star4.in5 {
    background-image: radial-gradient(
      rgba(156, 71, 218, 0.5),
      rgb(156, 71, 218, 0),
      rgba(156, 71, 218, 0)
    );
  }
  .star4.out1 {
    box-shadow: 0 0 50px rgb(180 47 248 / 50%), inset 0 0 50px rgb(180 47 248 / 50%);
  }
  .star4.out2 {
    box-shadow: 0 0 150px rgb(255 255 255 / 50%), inset 0 0 170px rgb(255 255 255 / 50%);
  }
  .star4.out3 {
    box-shadow: 0 0 200px rgb(113 34 221 / 60%), inset 0 0 170px rgb(113 34 221 / 60%);
  }

  @keyframes orbsIn {
    0%   { transform: scale(0) translate(-50%, -50%); }
    90%  { transform: scale(1) translate(-50%, -50%); opacity: 1; }
    100% { transform: scale(1) translate(-50%, -50%); opacity: 0; }
  }

  @keyframes orbs2 {
    0%   { transform: scale(0) translateX(-50%); }
    90%  { transform: scale(1) translateX(-50%); opacity: 1; }
    100% { transform: scale(1) translateX(-50%); opacity: 0; }
  }

  @keyframes outOrbs {
    30%  { opacity: 1; }
    100% { transform: scale(2) translate(-50%, -50%); opacity: 0; }
  }
</style>
