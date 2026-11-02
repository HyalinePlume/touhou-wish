/* 
 * characters.js — 角色奖池数据
 * race: 0=人类  1=妖怪  2=神明  3=妖精  4=幽灵(死人)  5=月人
 * villagerCount 使用 Svelte writable store，保证在 .svelte 模板中响应式更新
 */

import { writable, get } from "svelte/store";

/** 村民数量（响应式 store，自动同步 localStorage） */
const STORAGE_KEY = "xtm_villager_count";
function getStoredCount() {
  if (typeof localStorage === "undefined") return 50;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return 50;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 50 : Math.max(0, Math.min(99, n));
}
export const villagerCount = writable(getStoredCount());
villagerCount.subscribe((n) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, String(n));
});

/** 供外部安全修改 villagerCount */
export function setVillagerCount(n) {
  villagerCount.set(Math.max(0, n));
}

const VILLAGER_ART = "/chr/villager.png";
const VILLAGER_RACE = 0;
const VILLAGER_TITLE = "一般路过的绿宝石爱好者";
const VILLAGER_THEME = "villager_theme.mp3";
export const VILLAGER_THEME_START = 0.32;

export class Character {
  constructor(name, title, race, artSrc, theme, themeStart = 0) {
    this.name = name;
    this.title = title;
    this.race = race;
    this.artSrc = artSrc;
    this.theme = theme;
    this.themeStart = themeStart; // 起始播放位置，单位：秒。
    // 用于去除音乐开头静音部分，使立绘揭示时立刻播放音乐。
    // 保留至小数点后两位
  }
}

const baseCharacters = [
  // ======== 主角组 ========
  new Character("博丽灵梦",
    "乐园的可爱巫女",
    0,
    "/chr/hakurei_reimu.png",
    "th19_02.mp3", // 世界万物皆可爱
    0.35 
  ),
  new Character("雾雨魔理沙",
    "普通的魔法使",
    0,
    "/chr/kirisame_marisa.png",
    "th08_10.mp3", // 恋色Master spark
    0.05 
  ),
  // ======== 正作 ========
  new Character("露米娅",
    "宵暗的妖怪",
    1,
    "/chr/rumia.png",
    "th06_03.mp3", // 妖魔夜行
    0.06 
  ),
  new Character("大妖精",
    "现身于雾中的妖精",
    3,
    "/chr/daiyousei.png",
    "th06_04.mp3", // Lunate Elf
    0.06 
  ),
  new Character("琪露诺",
    "湖上的冰精",
    3,
    "/chr/cirno.png",
    "th06_05.mp3", // 活泼的纯情小姑娘
    0.06 
  ),
  new Character("红美铃",
    "华人小姑娘",
    1,
    "/chr/hong_meiling.png",
    "th06_07.mp3", // 明治十七年的上海爱丽丝
    0.06 
  ),
  new Character("小恶魔",
    "就职于蒙尘图书馆的魔物",
    1,
    "/chr/koakuma.png",
    "th06_08.mp3", // 	伏瓦鲁魔法图书馆
    0.06 
  ),
  new Character("帕秋莉·诺蕾姬",
    "不动的大图书馆",
    1,
    "/chr/patchouli_knowledge.png",
    "th06_09.mp3", // 	Locked Girl　～ 少女密室
    0.05 
  ),
  new Character("十六夜咲夜",
    "完美而潇洒的从者",
    0,
    "/chr/izayoi_sakuya.png",
    "th06_11.mp3", // 月时计　～ Luna Dial
    0.08 
  ),
  new Character("蕾米莉亚·斯卡蕾特",
    "永远鲜红的幼月",
    1,
    "/chr/remilia_scarlet.png",
    "th06_13.mp3", // 献给已逝公主的七重奏
    0.06 
  ),
  new Character("芙兰朵露·斯卡蕾特",
    "恶魔之妹",
    1,
    "/chr/flandre_scarlet.png",
    "th06_15.mp3", //	U.N.OWEN就是她吗？
    2.47 
  ),

  new Character("蕾蒂·霍瓦特洛克",
    "冬天的遗忘之物",
    1,
    "/chr/letty_whiterock.png",
    "th07_03.mp3", // Crystallize Silver
    0.06 
  ),
  new Character("橙",
    "凶兆的黑猫",
    1,
    "/chr/chen.png",
    "th07_05.mp3", // 凋叶棕（withered leaf）
    0.06 
  ),
  new Character("爱丽丝·玛格特罗伊德",
    "七色的人偶师",
    1,
    "/chr/alice_margatroid.png",
    "th07_07.mp3", // 人偶裁判　～ 玩弄人形的少女
    0.06 
  ),
  new Character("莉莉霍瓦特",
    "带来春天的妖精",
    3,
    "/chr/lily_white.png",
    "th07_08.mp3", // 天空的花都
    0.06 
  ),
  new Character("露娜萨·普莉兹姆利巴",
    "骚灵小提琴手",
    4,
    "/chr/lunasa_prismriver.png",
    "th07_09.mp3", //	幽灵乐团　～ Phantom Ensemble
    0.06 
  ),
  new Character("梅露兰·普莉兹姆利巴",
    "骚灵小号手",
    4,
    "/chr/merlin_prismriver.png",
    "th07_09.mp3", // 幽灵乐团　～ Phantom Ensemble
    0.06 
  ),
  new Character("莉莉卡·普莉兹姆利巴",
    "骚灵键盘手",
    4,
    "/chr/lyrica_prismriver.png",
    "th07_09.mp3", // 幽灵乐团　～ Phantom Ensemble
    0.06 
  ),
  new Character("魂魄妖梦",
    "半人半灵的庭师",
    0,
    "/chr/konpaku_youmu.png",
    "th07_11.mp3", // 广有射怪鸟事　～ Till When?
    0.06 
  ),
  new Character("西行寺幽幽子",
    "天衣无缝的亡灵",
    4,
    "/chr/saigyouji_yuyuko.png",
    "th07_13.mp3", // 幽雅地绽放吧，墨染的樱花　～ Border of Life
    0.06 
  ),
  new Character("八云蓝",
    "策士的九尾",
    1,
    "/chr/yakumo_ran.png",
    "th07_16.mp3", // 少女幻葬　～ Necro-Fantasy
    0.06 
  ),
  new Character("八云紫",
    "神隐的主犯",
    1,
    "/chr/yakumo_yukari.png",
    "th07_18.mp3", // Necro-Fantasia
    0.06 
  ),

  new Character("莉格露·奈特巴格",
    "暗中蠢动的光虫",
    1,
    "/chr/wriggle_nightbug.png",
    "th08_03.mp3", // 蠢蠢的秋月　～ Mooned Insect
    0.79 
  ),
  new Character("米斯蒂娅·萝蕾拉",
    "歌喉婉转的夜雀",
    1,
    "/chr/mystia_lorelei.png",
    "th08_05.mp3", // 已经只能听见歌声了
    1.47 
  ),
  new Character("上白泽慧音",
    "知识与历史的半兽",
    1,
    "/chr/kamishirasawa_keine.png",
    "th08_07.mp3", // Plain Asia
    0.77 
  ),
  new Character("因幡帝",
    "幸运的白兔",
    1,
    "/chr/inaba_tewi.png",
    "th09_10.mp3", // 宇佐大人的白旗
    0.06 
  ),
  new Character("铃仙·优昙华院·因幡",
    "地上的月兔",
    1,
    "/chr/reisen_udongein_inaba.png",
    "th08_12.mp3", // 狂气之瞳　～ Invisible Full Moon
    0.76 
  ),
  new Character("八意永琳",
    "月之头脑",
    5,
    "/chr/yagokoro_eirin.png",
    "th08_14.mp3", // 千年幻想乡　～ History of the Moon
    0.06 
  ),
  new Character("蓬莱山辉夜",
    "永远与须臾的罪人",
    5,
    "/chr/houraisan_kaguya.png",
    "th08_15.mp3", // 竹取飞翔　～ Lunatic Princess
    0.06 
  ),
  new Character("藤原妹红",
    "蓬莱人形",
    0,
    "/chr/fujiwara_no_mokou.png",
    "th08_18.mp3", // 飘上月球，不死之烟
    0.06 
  ),

  new Character("风见幽香", 
    "四季的鲜花之主",
    1,
    "/chr/kazami_yuuka.png",
    "th09_13.mp3", // 今昔幻想乡　～ Flower Land
    0.06 
  ),
  new Character("四季映姬",
    "乐园的最高裁判长",
    2,
    "/chr/shiki_eiki.png",
    "th09_15.mp3", // 第六十年的东方审判　～ Fate of Sixty Years
    0.05 
  ),
  new Character("小野塚小町",
    "三途川的引路人",
    2,
    "/chr/onozuka_komachi.png",
    "th09_14.mp3", // 彼岸归航　～ Riverside View
    0.06 
  ),
  new Character("梅蒂欣·梅兰可莉",
    "小小的甜蜜毒药",
    1,
    "/chr/medicine_melancholy.png",
    "th09_12.mp3", // 	剧毒身体　～ Forsaken Doll
    0.06 
  ),

  new Character("秋静叶",
    "寂寞与终焉的象征",
    2,
    "/chr/aki_shizuha.png",
    "th10_02.mp3", // 眷爱众生之神　～ Romantic Fall
    0.06 
  ),
  new Character("秋穰子",
    "丰裕与收成的象征",
    2,
    "/chr/aki_minoriko.png",
    "th10_03.mp3", // 会受稻田姬的斥责啦
    0.06 
  ),
  new Character("键山雏",
    "秘神流雏",
    2,
    "/chr/kagiyama_hina.png",
    "th10_05.mp3", // 命运的阴暗面
    0.06 
  ),
  new Character("河城荷取",
    "超妖怪弹头",
    1,
    "/chr/kawashiro_nitori.png",
    "th10_07.mp3", // 芥川龙之介的河童　～ Candid Friend
    0.07 
  ),
  new Character("犬走椛",
    "下位哨戒天狗",
    1,
    "/chr/inubashiri_momiji.png",
    "th10_08.mp3", // Fall of Fall　～ 秋意渐浓之瀑
    0.06 
  ),
  new Character("射命丸文",
    "传统的幻想记者",
    1,
    "/chr/shameimaru_aya.png",
    "th09.5_06.mp3", // 风神少女
    1.55 
  ),
  new Character("东风谷早苗",
    "被祭祀的风之人",
    0,
    "/chr/kochiya_sanae.png",
    "th10_11.mp3", // 信仰是为了虚幻之人
    1.48 
  ),
  new Character("八坂神奈子",
    "山丘与湖泊的化身",
    2,
    "/chr/yasaka_kanako.png",
    "th10_13.mp3", // 神圣庄严的古战场　～ Suwa Foughten Field
    0.05 
  ),
  new Character("泄矢诹访子",
    "土著神的顶点",
    2,
    "/chr/moriya_suwako.png",
    "th10_15.mp3", // Native Faith
    0.05 
  ),

  new Character("琪斯美",
    "钓瓶落之怪",
    1,
    "/chr/kisume.png",
    "th11_02.mp3", // 昏暗的风穴
    0.47 
  ),
  new Character("黑谷山女",
    "黑暗洞窟的明亮网",
    1,
    "/chr/kurodani_yamame.png",
    "th11_03.mp3", // 被封印的妖怪　～ Lost Place
    0.26 
  ),
  new Character("水桥帕露西",
    "地壳下的嫉妒心",
    1,
    "/chr/mizuhashi_parsee.png",
    "th11_05.mp3", // 绿眼的嫉妒
    0.00 
  ),
  new Character("星熊勇仪",
    "被谈论的怪力乱神",
    1,
    "/chr/hoshiguma_yuugi.png",
    "th11_07.mp3", // 大江山的花之酒宴
    0.41 
  ),
  new Character("古明地觉",
    "连怨灵也为之惧怯的少女",
    1,
    "/chr/komeiji_satori.png",
    "th11_09.mp3", // 少女觉　～ 3rd eye
    0.32 
  ),
  new Character("火焰猫燐",
    "地狱的车祸",
    1,
    "/chr/kaenbyou_rin.png",
    "th11_11.mp3", // 尸体旅行　～ Be of good cheer!
    0.09 
  ),
  new Character("灵乌路空",
    "地底的太阳",
    1,
    "/chr/reiuji_utsuho.png",
    "th11_13.mp3", // 地底的太阳　～ Nuclear Fusion
    0.19 
  ),
  new Character("古明地恋",
    "紧闭的恋之瞳",
    1,
    "/chr/komeiji_koishi.png",
    "th11_15.mp3", // 哈德曼的妖怪少女
    0.20 
  ),

  new Character("纳兹琳",
    "探宝的小小大将",
    1,
    "/chr/nazrin.png",
    "th12_03.mp3", // 小小的贤将
    0.06 
  ),
  new Character("多多良小伞",
    "愉快的遗忘之伞",
    1,
    "/chr/tatara_kogasa.png",
    "th12_05.mp3", // 请注意万年备用伞
    0.06 
  ),
  new Character("云居一轮 & 云山",
    "守护与被守护的大轮",
    1,
    "/chr/kumoi_ichirin.png",
    "th12_07.mp3", // 守旧老爹与前卫少女
    0.05 
  ),
  new Character("村纱水蜜",
    "水难事故的念缚灵",
    4,
    "/chr/murasa_minamitsu.png",
    "th12_09.mp3", // Captain Murasa
    0.08 
  ),
  new Character("寅丸星",
    "毗沙门天的弟子",
    1,
    "/chr/toramaru_shou.png",
    "th12_11.mp3", // 虎纹的毘沙门天
    0.05 
  ),
  new Character("圣白莲",
    "被封印的大魔法师",
    1,
    "/chr/hijiri_byakuren.png",
    "th12_13.mp3", // 感情的摩天楼　～ Cosmic Mind
    0.02 
  ),
  new Character("封兽鵺",
    "未确认幻想飞行少女",
    1,
    "/chr/houjuu_nue.png",
    "th12_15.mp3", // 平安时代的外星人
    0.05 
  ),

  new Character("幽谷响子",
    "诵读经卷的妖怪",
    1,
    "/chr/kasodani_kyouko.png",
    "th13_05.mp3", // 寺门前的妖怪小姑娘
    0.78 
  ),
  new Character("宫古芳香",
    "忠实的僵尸",
    4,
    "/chr/miyako_yoshika.png",
    "th13_07.mp3", // Rigid Paradise
    0.36 
  ),
  new Character("霍青娥",
    "穿墙的邪仙",
    2,
    "/chr/kaku_seiga.png",
    "th13_09.mp3", // 古老的元神
    0.34 
  ),
  new Character("苏我屠自古",
    "神灵大祀庙的亡灵",
    4,
    "/chr/soga_no_tojiko.png",
    "th13_10.mp3", // 梦殿大祀庙
    0.39 
  ),
  new Character("物部布都",
    "古代日本的尸解仙",
    2,
    "/chr/mononobe_no_futo.png",
    "th13_11.mp3", // 大神神话传
    0.37 
  ),
  new Character("丰聪耳神子",
    "圣德道士",
    2,
    "/chr/toyosatomimi_no_miko.png",
    "th13_13.mp3", // 圣德传说　～ True Administrator
    0.38 
  ),
  new Character("二岩猯藏",
    "佐渡的二岩",
    1,
    "/chr/futatsuiwa_mamizou.png",
    "th13_15.mp3", // 佐渡的二岩
    0.37 
  ),

  new Character("若鹭姬",
    "淡水的人鱼",
    1,
    "/chr/wakasagihime.png",
    "th14_03.mp3", // 秘境的人鱼
    0.78 
  ),
  new Character("赤蛮奇",
    "辘轳首的怪奇",
    1,
    "/chr/sekibanki.png",
    "th14_05.mp3", // 柳树下的杜拉罕
    0.69 
  ),
  new Character("今泉影狼",
    "竹林中的狼人",
    1,
    "/chr/imaizumi_kagerou.png",
    "th14_07.mp3", // 孤独的狼人
    0.67 
  ),
  new Character("九十九弁弁",
    "古旧琵琶的付丧神",
    1,
    "/chr/tsukumo_benben.png",
    "th14_09.mp3", // 幻想净琉璃
    0.74 
  ),
  new Character("九十九八桥",
    "古旧琴的付丧神",
    1,
    "/chr/tsukumo_yatsuhashi.png",
    "th14_09.mp3", // 幻想净琉璃
    0.74 
  ),
  new Character("鬼人正邪",
    "逆袭的天邪鬼",
    1,
    "/chr/kijin_seija.png",
    "th14_11.mp3", // Reverse Ideology
    0.76 
  ),
  new Character("少名针妙丸",
    "小人的末裔",
    0,
    "/chr/sukuna_shinmyoumaru.png",
    "th14_13.mp3", // 辉光之针的小人族　～ Little Princess
    0.73 
  ),
  new Character("堀川雷鼓",
    "梦幻的打击乐手",
    1,
    "/chr/horikawa_raiko.png",
    "th14_15.mp3", // 原初的节拍　～ Pristine Beat
    0.75 
  ),

  new Character("清兰",
    "浅葱的Eagel Rabbit",
    1,
    "/chr/seiran.png",
    "th15_04.mp3", // 兔已着陆
    0.70 
  ),
  new Character("铃瑚",
    "橘色的Eagel Rabbit",
    1,
    "/chr/ringo.png",
    "th15_05.mp3", // 九月的南瓜
    0.72 
  ),
  new Character("哆来咪·苏伊特",
    "梦境的支配者",
    1,
    "/chr/doremy_sweet.png",
    "th15_07.mp3", // 永远的春梦
    0.67 
  ),
  new Character("稀神探女",
    "招来口舌之祸的女神", 
    5, 
    "/chr/kishin_sagume.png",
    "th15_09.mp3", // 逆转的命运之轮
    0.67 
  ),
  new Character("克劳恩皮丝",
    "地狱的妖精",
    3,
    "/chr/clownpiece.png",
    "th15_11.mp3", // 星条旗的小丑
    0.66 
  ),
  new Character("纯狐",
    "无名的存在",
    2,
    "/chr/junko.png",
    "th15_13.mp3", // Pure Furies　～ 心之所在
    0.68 
  ),
  new Character("赫卡提亚·拉碧斯拉祖利",
    "地狱的女神",
    2,
    "/chr/hecatia_lapislazuli.png",
    "th15_15.mp3", // Pandemonic Planet
    0.67 
  ),

  new Character("爱塔妮缇拉尔瓦",
    "接近神的蝴蝶妖精",
    3,
    "/chr/eternity_larva.png",
    "th16_03.mp3", // 仲夏的妖精梦
    0.36 
  ),
  new Character("坂田合欢",
    "跨越浮世门关的山彦",
    1,
    "/chr/sakata_nemuno.png",
    "th16_05.mp3", // 深山的遭遇
    0.34 
  ),
  new Character("高丽野阿吽",
    "忠诚的守护兽",
    1,
    "/chr/komano_aunn.png",
    "th16_07.mp3", // 成对的神兽
    0.34 
  ),
  new Character("矢田寺成美",
    "垂迹于森林的魔法地藏",
    1,
    "/chr/yatadera_narumi.png",
    "th16_09.mp3", // 魔法的笠地藏
    0.69 
  ),
  new Character("尔子田里乃",
    "过于危险的背景舞者",
    1,
    "/chr/nishida_satono.png",
    "th16_11.mp3", // Crazy Back Dancers
    0.70 
  ),
  new Character("丁礼田舞",
    "过于危险的背景舞者",
    1,
    "/chr/teireida_mai.png",
    "th16_11.mp3", // Crazy Back Dancers
    0.70 
  ),
  new Character("摩多罗隐岐奈",
    "究极的绝对秘神",
    2,
    "/chr/mataru_okina.png",
    "th16_13.mp3", // 被秘匿的四个季节
    0.71 
  ),

  new Character("戎璎花",
    "河原的偶像",
    4,
    "/chr/ebisu_eika.png",
    "th17_03.mp3", // Jelly Stone
    0.34 
  ),
  new Character("牛崎润美",
    "古代鱼的守卫",
    1,
    "/chr/ushizaki_urumi.png",
    "th17_05.mp3", // 石之婴儿与水中牛
    0.35 
  ),
  new Character("庭渡久侘歌",
    "地狱关所的看门人",
    2,
    "/chr/niwatari_kutaka.png",
    "th17_07.mp3", // Seraphic Chicken
    0.78 
  ),
  new Character("吉吊八千慧",
    "鬼杰组组长",
    1,
    "/chr/kicchou_yachie.png",
    "th17_09.mp3", // Tortoise Dragon　～ 幸运与不幸
    0.69 
  ),
  new Character("杖刀偶磨弓",
    "埴轮偶像",
    1,
    "/chr/joutougu_mayumi.png",
    "th17_11.mp3", // 陶瓷的杖刀人
    0.71 
  ),
  new Character("埴安神袿姬",
    "孤立无援造就的造形神",
    2,
    "/chr/haniyasushin_keiki.png",
    "th17_13.mp3", // 寄世界于偶像　～ Idoratrize World
    0.70 
  ),
  new Character("骊驹早鬼",
    "劲牙组组长",
    1,
    "/chr/kurokoma_saki.png",
    "th17_15.mp3", // 圣德太子的天马　～ Dark Pegasus 
    0.70 
  ),

  new Character("豪德寺三花",
    "生意兴隆的吉祥物",
    1,
    "/chr/goutokuji_mike.png",
    "th18_03.mp3", // 大吉猫咪
    0.35 
  ),
  new Character("山城高岭",
    "深山的经商妖怪",
    1,
    "/chr/yamashiro_takane.png",
    "th18_05.mp3", // Banditry Technology
    0.72 
  ),
  new Character("驹草山如",
    "栖息于高地的山女郎",
    1,
    "/chr/komakusa_sannyo.png",
    "th18_07.mp3", // Smoking Dragon
    0.71 
  ),
  new Character("玉造魅须丸",
    "真正的勾玉匠人",
    2,
    "/chr/tamatsukuri_misumaru.png",
    "th18_09.mp3", // 神代矿石
    0.70 
  ),
  new Character("菅牧典",
    "耳边低语的邪恶白狐",
    1,
    "/chr/kudamaki_tsukasa.png",
    "th19_16.mp3", // 渴盼已久的逢魔之刻
    0.72 
  ),
  new Character("饭纲丸龙",
    "鸦天狗的首领",
    1,
    "/chr/iizunamaru_megumu.png",
    "th18_11.mp3", // 天魔之山漫天星
    0.73 
  ),
  new Character("天弓千亦",
    "无主物之神",
    2,
    "/chr/tenkyuu_chimata.png",
    "th18_13.mp3", // 熙攘市场今何在　～ Immemorial Marketeers
    0.69 
  ),
  new Character("姬虫百百世",
    "漆黑的噬龙者",
    1,
    "/chr/himemushi_momoyo.png",
    "th18_15.mp3", // 灭杀龙王的公主
    0.70 
  ),

  new Character("孙美天",
    "小小圣域的大圣",
    1,
    "/chr/son_biten.png",
    "th19_05.mp3", // Tiny Shangri-La
    0.30 
  ),
  new Character("三头慧之子",
    "死寂的刻耳柏洛斯",
    1,
    "/chr/mitsugashira_enoko.png",
    "th19_06.mp3", // 勇敢又慵懒的妖兽
    0.71 
  ),
  new Character("天火人血枪",
    "污秽的有机怪物",
    1,
    "/chr/tenkajin_chiyari.png",
    "th19_07.mp3", // 吸血怪兽卓柏卡布拉
    0.71 
  ),
  new Character("豫母都日狭美",
    "地狱的美貌跟踪狂",
    1,
    "/chr/yomotsu_hisami.png",
    "th19_08.mp3", // 不回首的黄泉路
    0.67 
  ),
  new Character("日白残无",
    "寂灭为乐之王",
    1,
    "/chr/nippaku_zanmu.png",
    "th19_09.mp3", // 越轨者们的无碍光　～ Kingdom of Nothingness.
    0.69 
  ),

  new Character("尘塚姥芽",
    "栖息于圣域的山姥之长",
    1,
    "/chr/chirizuka_ubame.png",
    "th20_03.mp3", // 即便为世间所遗忘
    0.70 
  ),
  new Character("封兽魑魅",
    "原形不明的反骨妖兽",
    1,
    "/chr/houju_chimi.png",
    "th20_05.mp3", // 森林里面有鬼怪哦
    0.70 
  ),
  new Character("道神驯子",
    "闭门不出的圣地道祖神",
    2,
    "/chr/michigami_nareko.png",
    "th20_07.mp3", // 事已至此就赌上性命来猜谜吧
    0.68 
  ),
  new Character("维缦·浅间",
    "锦上京的命脉",
    2,
    "/chr/yuiman_asama.png",
    "th20_09.mp3", // 猎鹿旧忆回潮
    0.70 
  ),
  new Character("磐永阿梨夜",
    "恒久姬",
    2,
    "/chr/iwanaga_ariya.png",
    "th20_12.mp3", // 早已习惯最终孑然一身　～ Stone Goddess
    0.70 
  ),
  new Character("渡里贝子",
    "创造虚构都市之怪",
    1,
    "/chr/watari_nina.png",
    "th20_18.mp3", // 双壳贝上的幻觉
    0.68 
  ),
  // ======== 小数点作 ========
  new Character("姬海棠果",
    "被炉里的洗稿天狗",
    1,
    "/chr/himekaidou_hatate.png",
    "th12.5_05.mp3", // 无间之钟　～ Infinite Nightmare
    0.06 
  ),
  new Character("伊吹萃香",
    "小小的百鬼夜行",
    1,
    "/chr/ibuki_suika.png",
    "TFM-001b_17.mp3", // 碎月
    1.30 
  ),
  new Character("比那名居天子",
    "非想非非想天之女",
    2,
    "/chr/hinanawi_tenshi.png",
    "TFM-003O_15.mp3", // 有顶天变 ～ Wonderful Heaven
    1.06 
  ),
  new Character("永江衣玖",
    "美丽的绯之衣",
    1,
    "/chr/nagae_iku.png",
    "TFM-003O_13.mp3", // 黑海中的绯红 ～ Legendary Fish
    1.06 
  ),
  new Character("秦心",
    "表情丰富的扑克脸",
    1,
    "/chr/hata_no_kokoro.png",
    "TFM-006a_19.mp3", // 心绮楼囃子
    0.53 
  ),
  new Character("宇佐见堇子",
    "秘封俱乐部初代部长",
    0,
    "/chr/usami_sumireko.png",
    "TFM-007a_16.mp3", // Last Occultism　～ 现世的秘术师
    0.55 
  ),
  new Character("依神紫苑",
    "最凶最恶的双子之姐",
    2,
    "/chr/yorigami_shion.png",
    "TFM-009b_14.mp3", // 今宵是飘逸的利己主义者(Live ver)　～ Egoistic Flowers.
    0.59 
  ),
  new Character("依神女苑",
    "最凶最恶的双子之妹",
    2,
    "/chr/yorigami_jyoon.png",
    "TFM-009b_14.mp3", // 今宵是飘逸的利己主义者(Live ver)　～ Egoistic Flowers.
    0.59 
  ),
  new Character("饕餮尤魔",
    "刚欲同盟盟主",
    1,
    "/chr/toutetsu_yuuma.png",
    "TFM-010b_07.mp3", // 贪欲之兽的记忆
    0.54 
  ),
  // ======== 书籍和CD ========
  new Character("稗田阿求",
    "幻想乡的记忆",
    0,
    "/chr/hieda_no_akyuu.png",
    "seeyouagain_speedy.mp3", // 请输入文本
    // "take_no_hana.mp3", // 备选bgm：竹之花
    // 因为和阿求相关的原作只有《求闻史记》的三首，而感觉都不太合适……
    // 如果用《竹之花》的话，起始播放位置建议设置为 1.50
    0.00
  ),
  new Character("森近霖之助",
    "香霖堂店主",
    1,
    "/chr/morichika_rinnosuke.png",
    "hr06_01.mp3", // 未知之花 魅知之旅
    1.01 
  ),
  new Character("桑尼米尔克",
    "闪耀的日之光",
    3,
    "/chr/sunny_milk.png",
    "sanyousei_say_ya_deFirstVerse.mp3", // 三妖精 SAY YA!!! 从第一段副歌开始
    0.10 
  ),
  new Character("露娜切露德",
    "静谧的月之光",
    3,
    "/chr/luna_child.png",
    "sanyousei_say_ya_deFirstVerse.mp3", // 三妖精 SAY YA!!! 从第一段副歌开始
    0.10 
  ),
  new Character("斯塔萨菲雅",
    "倾泻的星之光",
    3,
    "/chr/star_sapphire.png",
    "sanyousei_say_ya_deFirstVerse.mp3", // 三妖精 SAY YA!!! 从第一段副歌开始
    0.10 
  ),
  new Character("茨木华扇",
    "片腕有角的仙人",
    2,
    "/chr/ibaraki_kasen.png",
    "TFM-007b_13.mp3", // 华狭间的战场(深秘录)
    0.62 
  ),
  new Character("本居小铃",
    "识文解意的爱书人",
    0,
    "/chr/motoori_kosuzu.png",
    "FS01_01.mp3", // 识文解意的爱书人 (东方铃奈庵6限定版	附属CD 第1轨)
    0.47 
  ),
  new Character("奥野田美宵",
    "梦幻酒家的店花",
    1,
    "/chr/okunoda_miyoi.png",
    "hr10_01.mp3", // Bar·Old Adam
    0.40 
  ),
  new Character("宫出口瑞灵",
    "人厌妖嫌的反狱王",
    4,
    "/chr/miyadeguchi_mizuchi.png",
    "hr12_11.mp3", // 毕竟不单夜晚有鬼怪
    0.85 
  ),
  new Character("绵月丰姬",
    "连接山与海的月之公主",
    5,
    "/chr/watatsuki_no_toyohime.png",
    "th20_11.mp3", //	绵月的符卡　～ Lunatic Blue
    0.71 
  ),
  new Character("绵月依姬",
    "神灵附体的月之公主",
    5,
    "/chr/watatsuki_no_yorihime.png",
    "hr05_07.mp3", // G Free
    0.05 
  ),
  new Character("Reisen",
    "迟钝的月兔",
    1,
    "/chr/reisen.png",
    "hr05_10.mp3", // 另一侧的月
    0.17 
  ),
  new Character("宇佐见莲子",
    "物理学的实干家",
    0,
    "/chr/usami_renko.png",
    "hr05_04.mp3", // 轮椅上的未来宇宙
    0.09 
  ),
  new Character("玛艾露贝莉·赫恩",
    "精神学的灵视者",
    0,
    "/chr/maribel_hearn.png",
    "hr02_02.mp3", // 少女秘封俱乐部
    0.08 
  ),
  // ======== 其他 ========
  new Character("朱鹭子",
    "无名的读书妖怪",
    1,
    "/chr/tokiko.png",
    "hr09_01.mp3", // 二人不值一提的博物志
    0.49 
  ),
  new Character("冴月麟",
    "被遗忘的风与花",
    0,
    "/chr/satsuki_rin.png",
    "hr08_09.mp3", // 收集日本各地的不可思议
    0.52 
  ),
  new Character("Zun",
    "一切幻想的起源",
    0,
    "/chr/zun.png",
    "hr03_01.mp3", // 童祭　～ Innocent Treasures
    0.09 
  ),
];

// ==================== 动态奖池 ====================

/** 构造完整奖池：基础角色 + N 个村民 */
export function getFullPool(count = get(villagerCount)) {
  const villagers = [];
  for (let i = 1; i <= count; i++) {
    villagers.push(
      new Character("村民" + i + "号", VILLAGER_TITLE, VILLAGER_RACE, VILLAGER_ART, VILLAGER_THEME, VILLAGER_THEME_START)
    );
  }
  return [...baseCharacters, ...villagers];
}

/** 按历史名称排除已抽出的角色，包括各编号村民。 */
export function getAvailablePool(records, count = get(villagerCount)) {
  const drawnNames = new Set(records.map(record => record.characterName));
  return getFullPool(count).filter(character => !drawnNames.has(character.name));
}

/** 从剩余奖池中等概率随机抽取一个角色。 */
export function drawOne(records, count = get(villagerCount)) {
  const pool = getAvailablePool(records, count);
  if (pool.length === 0) throw new Error("当前奖池中的角色已全部抽出，请重置祈愿记录或增加村民数量后再试。");
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
