// 各星级使用对应文件夹中的特效素材。
const VFX_STARS = { 3: 3, 4: 4, 5: 5, 6: 6 };
// 三等奖 / 二等奖 / 一等奖与特等奖共用的三档音效。
const SHOW_SFX_STARS = { 3: 3, 4: 4, 5: 5, 6: 5 };

/** 播放前选定素材。drawMode 预留 single / multi 接口。 */
export function selectWishAssets({ rarity = 4, drawMode = "single" } = {}) {
  if (!Object.hasOwn(VFX_STARS, rarity)) throw new Error("不支持的奖品星级");
  if (drawMode !== "single" && drawMode !== "multi") throw new Error("不支持的抽卡模式");

  const vfxDirectory = `/img/vfx_${VFX_STARS[rarity]}star`;
  return {
    rarity,
    drawMode,
    show1Src: `/sfx/show1_${SHOW_SFX_STARS[rarity]}stars.mp3`,
    show2Src: `/sfx/show2_${SHOW_SFX_STARS[rarity]}stars.mp3`,
    videoSrc: `/videos/${rarity}star-${drawMode}.mp4`,
    vfxDirectory,
    lightSrc: `${vfxDirectory}/light.png`,
    particleSources: Array.from({ length: 8 }, (_, i) => `${vfxDirectory}/vfx_1_${i + 1}.png`),
    secondarySources: Array.from({ length: 12 }, (_, i) => `${vfxDirectory}/vfx_2_${i + 1}.png`)
  };
}
