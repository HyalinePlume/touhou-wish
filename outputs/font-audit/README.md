# 粗金陵补字版

## 当前第三版：直接复刻新参考图

“咲、鵺、椛、吽”现已直接从用户新图 `reference-r3.png` 描摹矢量轮廓。
四个字共用一个等比缩放（232 / 161）及平移，没有单独改变部件比例、间距或笔画。
使用 8 倍精度的复合字形，减少原字体 256 UPM 网格造成的轮廓取整误差。
其余字形和字宽经过逐一对比保留。页面引用版本为 `?v=3`。

重建顺序（项目根目录）：
1. `python tools/trace-jinling-reference.py`（需要 vtracer 0.6.15）
2. `python tools/patch-jinling-font.py`
3. `python tools/verify-jinling-reference.py`
4. `node tools/verify-jinling-font.cjs`

`reference-overlay-r3.png` 展示同尺寸新参考图、字体渲染、红蓝差异叠图。
`reference-validation-r3.json` 保存轮廓比对结果：二值墨迹交并比约 97.5%，没有超出原图一个像素容差的差异。
`revised-four-r3.png` 为当前四字预览。`revision-2/` 保留上一版字体和脚本。
下面的第一、二版说明仅作为历史记录；四个字的当前实现以本节为准。

原字体：`static/fonts/FZCuJinLing-Regular.ttf`，保留不覆盖。
派生字体：`static/fonts/FZCuJinLing-Patched.ttf`，项目 `+layout.svelte` 已引用。

新增：咲、塚、椛、燐、鵺、猯、吽、侘、袿、冴。
这些是本项目制作的拼字字形，并非字体厂商提供的官方字形。
全部轮廓取自原字体，调整比例与位置后进行矢量布尔合并。
“鵺”的鳥部由白、鸟的下部和焉的四点组合；其余字的配方见生成脚本。

生成：在仓库根目录执行 `python tools/patch-jinling-font.py`。
依赖：fonttools 4.68.0、pillow 13.0.0、skia-pathops 0.9.2；可安装到本目录的 dependencies 中或当前 Python 环境。
网页验证：`node tools/verify-jinling-font.cjs`，使用 Playwright；可通过 PLAYWRIGHT_MODULE 指定包路径。

- `patched-preview.png`：新增字放大、微软雅黑结构参考及完整角色名。
- `browser-preview.png`：浏览器加载项目字体后的实拍。
- `patched-validation.json`：字体校验、原字形保留校验、内置角色名覆盖校验。
- `browser-validation.json`：浏览器实际使用字体的验证；10 个新增字均使用自定义补字版字体，无后备字体。
- `coverage.json`：修改前的覆盖检查结果。

当前新增字形没有单独制作 TrueType hinting，小字号下的精细显示仍可继续调整。

## 第二版：按用户参考图调整

参考文件 `reference.png` 为用户提供的原图副本。
仅调整“咲、鵺、椛、吽”：口旁比例与位置、右部舒展程度、花部宽度，以及鳥部横画间距和四点排列。
“椛”的木旁右侧收回，避免与花部相接。轮廓仍来自原字体的矢量部件。
第一版字体、脚本和浏览器预览保存在 `revision-1/`。
网页字体 URL 添加 `?v=2`，避免沿用旧缓存。

- `reference-comparison-r2.png`：用户参考图、调整前、调整后三列对照。
- `revised-four.png`：四个调整后字形。
- `revision-2-validation.json`：确认仅这四个字的字形或度量发生变化。
- `tools/preview-jinling-revision.py`：生成对照图并运行上述保留检查（从项目根目录运行）。
