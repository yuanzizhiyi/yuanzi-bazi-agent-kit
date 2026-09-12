# Chart structure and rule conventions

Use this reference to explain the image's composition percentages, shensha and combinations. They are deterministic descriptions under the conventions below, not predictions or strength scores.

## Equal stem occurrences: `equal-stem-occurrence/v1`

Count each visible heavenly stem, including the day master, once. Count each hidden stem once. Represent branches through their hidden stems; do not add the branch's principal element again. Omit an unknown hour pillar entirely. No seasonal, root-strength or hidden-stem weighting is applied.

Each occurrence contributes to one of the ten gods relative to the day stem. The day master itself counts as Peer (比肩). Divide each count by the total occurrences. For display, allocate 1,000 tenths-of-a-percent using the largest remainder method, breaking equal remainders in the fixed displayed Ten God order. Thus the displayed ten percentages sum to 100.0%. Element shares are sums of their two displayed Ten God shares, preserving cross-chart agreement; raw counts remain available. Equal counts may differ by 0.1 percentage point after rounding.

The older `fiveElements.visible` and `fiveElements.hiddenStems` fields keep their original, separate count meanings. Do not mix their denominator with the new percentages. The two image panels explicitly use the new stem-occurrence denominator.

For the synthetic pillars 戊辰 / 庚申 / 丙申 / 己亥, there are 15 occurrences: wood 2, fire 1, earth 5, metal 3, water 4. Ten God counts in display order are 1, 0, 4, 1, 0, 3, 1, 3, 1, 1. These differ from the percentages in the design mockup, whose values were illustrative.

Element relationships have fixed direction: wood → fire → earth → metal → water → wood (generating); wood → earth → water → fire → metal → wood (controlling). The node at the top is the day master's element. Role labels and bar colors are derived from that day's stem, including yin/yang polarity.

## Shensha: `yuanzi-shensha/v1`

This finite rule set covers the reference image's eight names. It does not claim to implement every traditional school's rule set. Each match has a stable `id`, a name, and a `basis` array identifying the source pillar, part and value. Multiple matching bases produce one displayed name with multiple evidence records. All matching is against the calculated natal pillars; it does not recalculate dates or request identity data.

| ID / name | Adopted convention |
| --- | --- |
| `tai_ji` / 太极贵人 | Check year and day stems against each target branch. 甲乙→子午; 丙丁→卯酉; 戊己→辰戌丑未; 庚辛→寅亥; 壬癸→巳申. Either listed branch is a match; the full pair is not required. |
| `hua_gai` / 华盖 | Check year and day branches. 申子辰→辰; 寅午戌→戌; 巳酉丑→丑; 亥卯未→未. |
| `tian_de_he` / 天德合 | Use the solar-term month branch and target visible stem. 寅→壬; 辰→丁; 巳→丙; 未→己; 申→戊; 戌→辛; 亥→庚; 丑→乙. The four directional months 子午卯酉 have no stem target in this convention; do not invent branch-combination matches. |
| `kong_wang` / 空亡 | Check target branches against the two empty branches of the day pillar's ten-day xun, using tyme4ts `getExtraEarthBranches()`. This is not the separate empty-pair annotation of each target pillar. |
| `wen_chang` / 文昌贵人 | Day stem only. 甲→巳; 乙→午; 丙戊→申; 丁己→酉; 庚→亥; 辛→子; 壬→寅; 癸→卯. |
| `tian_yi` / 天乙贵人 | Day stem only. 甲戊庚→丑未; 乙己→子申; 丙丁→亥酉; 壬癸→巳卯; 辛→午寅. Both day/night targets are retained; no birth-gender or day/night filter. |
| `wang_shen` / 亡神 | Check year and day branches. 申子辰→亥; 寅午戌→巳; 巳酉丑→申; 亥卯未→寅. |
| `hong_luan` / 红鸾 | Year branch only, with 子→卯, then the target moving backward one branch for each forward year branch (辰→亥). Only branch matching is adopted; no relationship forecast. |

The existing site's Tianyi, Wenchang and Huagai lookup conventions were retained for the overlapping rules. The source tradition has variants; the table above, not an unqualified label such as “universal”, defines this implementation.

Historical reference material: [三命通会·卷三](https://zh.wikisource.org/zh/三命通會/卷三) discusses Tianyi, Taiji, heavenly-virtue combinations, lost spirit and xun emptiness; [选择纪要·上编](https://zh.wikisource.org/zh-hant/選擇紀要/上編) supplies the eight stem targets for heavenly-virtue combinations. The red-phoenix branch sequence is also recorded in [紫微斗数全书·安红鸾天喜诀](https://libokang.com/zh-hant/guji/ziwei/紫微斗數全書/6/). These are historical conventions, not evidence of predictive accuracy. The choice of year/day reference fields and the cross-pillar presentation are explicitly fixed by this project.

## Combinations and unknowns

Only two combinations are currently defined, as same-target-pillar set intersections:

- `canopy_empty` / 华盖逢空 requires `hua_gai` and `kong_wang`.
- `canopy_taiji` / 华盖太极同宫 requires `hua_gai` and `tai_ji`.

These labels describe co-occurrence; they add no auspicious/inauspicious meaning. A calculated column with no match displays “无 / None”. An unknown hour has `status: hour_unknown`, empty arrays, and displays “未计算 / Not calculated”. Never present an unknown result as a verified absence. Existing calendar-boundary warnings also apply to any structure derived from the affected pillars.

## Rendering and fonts

The layout keeps the day-column cinnabar tint, while the actual day-master tag applies to its heavenly stem. Month emphasis refers to the month branch. Table height adapts to wrapped labels and rule matches; the lower diagrams share the same counting method and colors. Bar scales expand beyond 50% when necessary; zeros receive zero-width fills. Each relationship edge has one arrowhead.

The header uses the site's complete brand lockup: the original `yuanzi-logo-mark.png` mark, the brand name and romanized name. The bundled PNG is copied unchanged from the site's `public/assets/brand/` directory and embedded as a local data URI; rendering never requests the website. Logo rights remain governed by `TRADEMARKS.md`.

PNG width is 2160 pixels. Noto Sans CJK SC Regular and Noto Serif CJK SC SemiBold are subsetted and renamed under the OFL; the files and license ship with the kit. The renderer does not load system fonts or make network requests. Fixed advance metrics support wrapping across all three locales. To regenerate subsets after copy changes, install Python `fonttools` and run `scripts/build-chart-fonts.py --sans <Noto-Sans-OTF-or-TTC> --serif <Noto-Serif-OTF-or-TTC>`. For TTC input the script selects the SC face. Runtime rendering requires no Python installation.
