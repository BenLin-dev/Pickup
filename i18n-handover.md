# 多语言（FR / ES / IT / DE）交接说明

站点：https://cantonpickup.com ｜ 代码：`CantonPickup/`
实现日期：2026-09-30

---

## 1. 做了什么

英文仍是站点的**唯一作者来源**，也是 Google 索引与所有现成链接所指向的版本。
在它之上加了一层客户端语言层：

| 语言 | 代码 | 状态 |
| --- | --- | --- |
| English | `en` | 基准语言（`en.json` 自动生成） |
| Français | `fr` | 1263 / 1263 |
| Español | `es` | 1263 / 1263 |
| Italiano | `it` | 1263 / 1263 |
| Deutsch | `de` | 1263 / 1263 |

四项硬约束，落地结果：

1. **网址完全不变。** 只有一份 31 页的静态 HTML，`/airport-transfer/`、`/blog/...`
   等路径在五种语言下完全相同 —— 不做 `/fr/` 子目录，不做 `?lang=fr`。已有外链、
   sitemap、canonical 一个字节都不用改。
2. **按浏览器语言自动切换。** 首次访问读 `navigator.languages`；`fr-FR` 命中法语，
   `de-AT` 命中德语。**中文、葡语等不猜最近邻，一律落回英文**（宁可给英文，
   也不要给一个半懂的法语页）。
3. **用户可以手动切换，三个入口。**
   - **页脚的语言行** —— 所有页面、所有宽度都在，这是唯一「永远可达」的入口；
   - 页头右上角胶囊（地球图标 + `EN`/`FR`/…），需要 ≥1160px 才放得下；
   - 抽屉菜单里的一排语言胶囊（汉堡菜单展开后）。
   选择存 `localStorage`，之后不再自动覆盖。
4. **英文文案零变化。** 重构前后抓取 32 页可见文本做 diff，唯一差异是新增控件本身
   （页头胶囊 `English` → `EN`，以及新增的页脚语言行）；原有文案、链接、图片、
   `<title>`、canonical 一个字符都没动。

> 页头那一行的宽度是**算出来的，不是调出来的**，改语言或改导航标签前请先读
> `main.css` 里 `header, by language` 那段注释：

| 语言 | 页头一行需求宽度 | 说明 |
| --- | --- | --- |
| en | 1165px | 原本只剩 35px 余量 |
| fr | 1187px | |
| it | 1208px | 本次改造前就已溢出 8px |
| de | 1290px | 溢出 90px（`Startseite` / `Bewertungen`） |
| es | 1399px | 溢出 199px —— `Preguntas frecuentes` 单个标签 183px，而 `FAQs` 只有 65px |

容器宽 1200px。所以：非英语的导航内边距和字号收窄（英语保留原样，因为它是被索引、
被投放广告的版本）；页头胶囊只在 ≥1160px 出现；非英语的导航在 ≤1100px 折进汉堡，
英语仍在 ≤940px 折。西班牙语的 `FAQs` 改成了 `FAQ`（西语网站的标准写法）。

---

## 2. 文案放在哪里

全部文案集中在**一个目录**：`src/i18n/locales/`，每种语言一个 JSON。

```
src/i18n/
  index.js           运行时：语言判定、t()、tr()、切换
  README.md          维护手册（改文案 / 加语言前先读这个）
  locales/
    en.json          1259 → 1263 条，由脚本生成，不要手改
    fr.json  es.json  it.json  de.json
```

**键就是英文原句本身**，没有 `home.hero.title` 这类点号键：

```json
{
  "Book Now": "Réserver",
  "Airport transfers in Guangzhou": "Transferts aéroport à Canton"
}
```

这样设计换来三件事：改英文不会留下失配的键；某个词没翻到就**退回显示英文**
（永远不会出现空白或 `undefined`）；同一句英文在十个组件里出现也只翻一次。

两个 API：

- `t('单句')` —— 翻一个字符串，支持 `{city}` 占位符。
- `tr(结构)` —— 递归翻一个对象/数组里的每一个字符串叶子。用于 `fleet`、
  `pricing`、`intercityRoutes`、运行时的 `vehicles.json` 等数据结构。

`src/data/site.js` 里被 `tr()` 包住的是「会翻译的文案」，裸着的是「配置」
（电话、邮箱、`addressLine`、GTM ID、web3forms key）。唯一的例外是
`footerKeywords` —— 那是给搜索引擎看的关键词锚文本，**故意保持英文**。

---

## 3. 日常维护

```bash
npm run i18n      # 重新扫描源码 → 重生成 en.json → 报告各语言覆盖率
npm run build     # 内部第一步就是 npm run i18n，然后 SSG 31 页
```

新增一句英文文案后：

1. 写在它该在的地方（模板里，或数据模块的导出里）。
2. 模板里包一层 `{{ t('新句子') }}`（属性用 `:alt="t('…')"`）；
   数据模块里把导出整体包一层 `tr([...])`。
3. `npm run i18n`，然后把新键翻译进 `fr/es/it/de.json`。

**唯一会漏的地方是组件的 prop 默认值。** `<script setup>` 会把 `default:` 提升到
模块作用域，写成 `default: t('Videos')` 会在预渲染时报 `ReferenceError`，所以组件里
保留英文字面量、在渲染处 `{{ t(title) }}`。扫描器看不到这种字符串，
`scripts/extract-i18n.mjs` 用一份 `MANUAL_KEYS` 名单兜住，并会在发现**不在名单里**
的 prop 默认值时打印警告。目前名单里 4 条：`Get Your Free Quote`、
`Tell us the trip and we will come back with a fixed, all-inclusive price.`、
`Videos`、`We accept:`。

**不要改翻译文件里的键。** 差一个字符（撇号 `'` vs `’`、连字符类型）就静默失配，
页面退回英文。

新增一种语言：拷 `en.json` → `xx.json`，在 `src/i18n/index.js` 的 `LOCALES` 里加
一条（含 `ogLocale`），把 `SiteHeader.vue` 的语言菜单加一项，`npm run i18n` 核对。

---

## 4. 刻意保持英文的部分

| 内容 | 原因 |
| --- | --- |
| `/blog` 下 10 篇长文 | 深度指南，英文版即索引版 |
| 隐私政策 / 条款 | 法律文本指名数据控制者与管辖法律，机器翻译是风险 |
| 页尾 SEO 关键词锚文本 | 英文搜索词，翻了就丢了排名也丢了链接相关性 |
| 预填的 WhatsApp 消息 | 收件箱由运营方分流，非英文消息反而降低处理效率 |
| 电话、邮箱、`addressLine`、GTM / web3forms | 配置项，不是文案 |

---

## 5. 含英文文案的图片（按要求：图片不翻译，仅列出）

图片一律不做多语言版本 —— 五种语言共用同一张。以下这些**图片内烤进了英文**：

### 需要留意（真的会被海外用户看到）

| 文件 | 里面是什么 |
| --- | --- |
| `public/images/og-image.jpg` | **最要紧的一张。** 大标题 "Guangzhou & Foshan Airport Transfers & Private Drivers"、卖点行 "English-speaking drivers · Fixed prices · 24/7 support"、按钮 "Get a free quote"，左上角 "CantonPickup" 标识。它出现在分享链接预览、WhatsApp 预览、搜索结果里 —— 法语用户也会看到这张英文图。 |
| `public/images/reviews/*.png` ×10 | WhatsApp 聊天截图（`ahmed-sa-family-pickup`、`daniel-uk-airport-transfer`、`grace-us-sourcing-trip`、`james-au-half-day`、`kenji-jp-rail-transfer`、`lucas-br-guangzhou-shenzhen`、`marta-es-canton-fair`、`nadia-ae-business-trip`、`priya-in-week-charter`、`sofia-it-city-tour`）。气泡里全是英文对话，右上/右下有 "CantonPickup" 水印。这是**社会证明**，语言不通但图是「真的」。 |
| `public/images/reviews/gabriella-it-airport-pickup.jpg` | 手写接机牌 "Gabriella Rubagotti" + 底部中文水印（`2026.09.28 星期一 广州市·广州白云国际机场`、「水印相机」App 章）。人名不该翻，但**中文水印在英文站上略显突兀**，建议裁剪掉底部那条。 |

### 只有品牌水印（品牌名本来就不翻）

| 文件 | 说明 |
| --- | --- |
| `public/videos/baiyun-airport-pickup.jpg` | 视频封面，左下角 "CantonPickup" 水印 |
| `public/videos/guangzhou-airport-transfer.jpg` | 同上 |
| `public/videos/private-car-service.jpg` | 同上 |
| `public/logo.svg` / `public/logo-inverse.svg` | 文字即品牌名 "CantonPickup" |
| `public/apple-touch-icon.png` / `public/favicon.svg` | 品牌标识 |

### 不含英文文案（确认过，无需处理）

`public/images/gallery/` 下 7 张：`cabin-mpv.jpg`、`curbside-wait.jpg`、
`luggage-cart.jpg`、`name-sign.jpg`、`terminal-walk.jpg`、`trunk-loading.jpg`、
`gabriella-name-sign.jpg`（只有手写英文人名 + 中文时间戳）。

**结论：真正需要处理的只有 `og-image.jpg`（值得做 5 个语言版本）和
`gabriella-it-airport-pickup.jpg` 的中文水印条（裁剪即可）。其余都是品牌水印或
个人姓名，保持原样。**

---

## 6. 验证读数（本地实测）

```
extract-i18n        en.json 1263 条
                    fr / es / it / de 均 1263/1263 已翻译
                    0 占位符失配，0 冗余键
verify-locales      35 PASS / 0 FAIL
                    5 语言：<html lang> 正确、语言确实生效、屏幕无未覆盖键、
                    无渲染报错、无空白标题、1440px 无横向溢出
verify-lang-switch  18 PASS / 0 FAIL
                    含 1200 / 1161 / 1150 / 1024 四个断点：胶囊该出现时出现、
                    该隐藏时隐藏，且隐藏后有抽屉或页脚接手
verify-spa-nav      36 PASS / 0 FAIL（站内跳转、标题/canonical/JSON-LD 同步、
                    抽屉、锚点落点、控制台真实报错 0 条）
audit-links         31 页全量点击：covered=0 suspect-cta=0 zero=0 → AUDIT PASS
漏翻扫描            fr / es / it / de 均 0 条未走 t() 的英文
                    （页尾 SEO 关键词锚文本与地名 "Baiyun District" 属刻意保留，
                      已从扫描白名单中排除）
页头适配            1920→390px 共 15 档 × 5 语言：全部有富余，无一档溢出
构建                npm run build → SSG 31 页 + sitemap 31 条，无报错
英文基线 diff        唯一差异 = 本次新增的两个控件本身：
                      · 页头语言胶囊：English → EN（32 页）
                      · 页脚语言行：每页新增 5 个语言名（32 页）
                    原站文案、链接、图片、<title>、canonical 零变化
```

URL、`<title>`、canonical、sitemap、GTM、JSON-LD 全部未改动 —— 这次改动只增加了一层
客户端翻译，没有触碰任何 SEO 载体。

### 本轮修掉的两个真问题

1. **首页视频区块标题整段空白。** `VideoGallery.vue` 的模板调用了 `t(title)`，
   但文件只导入了 `tr`、没导入 `t` —— 编译成 `_ctx.t(...)`，渲染时抛异常，Vue 接住后
   该 `<h2>` 直接留空，页面「看起来正常」，所有文本断言都能过。已补导入。
   已在 `verify-locales.mjs` 增加两项永久断言：**无渲染报错** + **无空白标题**。
2. **页头一行在 1080–1600px 区间横向溢出。** 见上文宽度表。已重排断点，
   并给页脚补了常驻语言行。
