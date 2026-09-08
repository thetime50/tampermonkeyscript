# read_copy 站点配置

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.js` | 油猴入口：`@match` / `@require`、组装 `cfgList`、调用 `cfgListExec` |
| `common.js` | 公共工具：`cfgListExec`、`readToCopy`、`delay` 等 |
| 站点脚本 xxx.js | 各站点逻辑，导出 `xxxCfg` |

新增站点：写站点脚本 → 在 `index.js` 加 `@match`、`@require` → 把配置放进 `cfgList`。

## 匹配与执行（`cfgListExec`）

`cfgList` 项可以是单个配置对象，或配置数组（会先 `concat` 展平）。

按数组顺序 **找第一条命中的配置**，只执行它的 `cb()`。匹配字段三选一，优先顺序：`hostname` → `includes` → `re`。

```ts
type SiteCfg = {
  hostname?: string // href 或 hostname 包含该字符串，如 'xx.com'
  includes?: string // href.includes(...)，如 '//xx.com/a/'
  re?: RegExp       // 正则测 href，如 /^https:\/\/xx\.com\/user\//
  cb: () => void | Promise<void> // 命中后执行
}

type SiteCfgExport = SiteCfg | SiteCfg[]
```

同站点多 URL 要用数组多项，一条配置只会跑一次。

## `xxxCfg` 返回值

IIFE 返回 **配置对象或配置数组**。数组需在 `cfgList` 里展开：`...xxxCfg`；单个对象直接写入变量名。

```ts
const xxxCfg: SiteCfg[] = (() => {
  return [
    { re: /^https:\/\/xx\.com\//, cb: fun1 }, // 功能1
    { re: /^https:\/\/yy\.xx\.com\//, cb: fun2 }, // 功能2
  ]
})()

const yyyCfg: SiteCfg = (() => {
  return { includes: '//xx.com/a/', cb: fun3 } // 功能3
})()
```
