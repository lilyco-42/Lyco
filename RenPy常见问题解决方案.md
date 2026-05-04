# Ren'Py 常见问题解决方案（FAQ）

> 实践出真知。以下问题均在实际开发中遇到，并提供已验证的解决方案。

---

## 1. 字符串语法错误

### 问题：`end of line expected`

**错误信息**：
```
File "game/script.rpy", line XXX: end of line expected.
    narr "一栋灰色的三层楼房，门口挂着"地球特别搜救队"的牌子。"
```

**原因**：Ren'Py 使用 ASCII 双引号 `"` (U+0022) 作为字符串定界符。当中文文本中使用**同款 ASCII 双引号**做书名号或专用名标记时，Ren'Py 解析器会把内部的 `"` 当作字符串结束符号。

**修复**：将外层定界符改为单引号 `'`，内部的双引号就会成为普通文本字符：

```renpy
narr '一栋灰色的三层楼房，门口挂着"地球特别搜救队"的牌子。'
```

Ren'Py 支持用单引号包裹字符串，与双引号等效。

### 预防

尽量使用中文引号「」或『』替代 `"` 作为中文文本内部的引用标记，或在包含 `"` 的字符串统一使用单引号外层。

---

## 2. 特殊字符乱码

### 问题：`·`（中间点）显示为乱码

**错误信息**：渲染时中间点显示为问号、方框或其他乱码符号。

**原因**：
- 文件编码问题（非 UTF-8）
- 字形在特定字体中缺失
- Ren'Py 解析器与某些 Unicode 字符的兼容性问题

**修复**：将 `·` (U+00B7) 替换为安全的 ASCII 字符：

```renpy
"近地天体 - 最新进展"    # 用连字符替代
"SHIP - DATA"
"序章 - 完"
```

注释中的特殊字符不影响运行，可以保留。只有出现在运行时字符串（`narr ""`、`lk ""` 等）中的才需要修复。

---

## 3. 字符串中的转义引号

### 问题：`\"` 能否在 Ren'Py 字符串中使用？

**可以**。Ren'Py 解析器支持 Python 风格的 `\"` 转义：

```renpy
narr "{i}\"我知道你会回来的。\"{/i}"
```

渲染结果为：*"我知道你会回来的。"*

但如果外部已经使用单引号，则内部 `"` 无需转义：

```renpy
narr '{i}"我知道你会回来的。"{/i}'
```

### 选择建议

| 情况 | 推荐写法 |
|------|----------|
| 文本中包含 `"` 但无 `'` | 用单引号包裹：`narr '她说："好。"'` |
| 文本中包含 `'` 但无 `"` | 用双引号包裹：`narr "It's fine."` |
| 文本中同时包含 `"` 和 `'` | 用双引号 + 转义：`narr "It's \"fine.\""` |

---

## 4. 项目文件组织最佳实践

### 推荐结构

```
game/
├── definitions.rpy    # 角色、图像、变量定义（集中管理）
├── script.rpy         # 序章/主入口
├── chapter2.rpy       # 第二章
├── chapter3.rpy       # 第三章（后续添加）
├── screens.rpy        # GUI 界面（系统生成）
├── gui.rpy            # GUI 样式（系统生成）
├── options.rpy        # 项目配置
└── tl/                # 翻译文件
```

### 分离定义的优点

- `definitions.rpy` 集中管理所有角色、图像、变量，便于查找和修改
- 各章节文件只包含剧情内容，专注于写作
- 新加角色或图像时，不需要在各章节文件中重复定义
- Ren'Py 自动加载 `game/` 目录下所有 `.rpy` 文件，无需手动 `include`

### define / default / image 放哪里？

**放在 definitions.rpy 中**即可。Ren'Py 在编译阶段会处理所有文件中的定义语句，文件间顺序无关。

---

## 5. 色块占位图的使用

### 用纯色替代图片

在开发阶段，可以用色块替代真实的背景和立绘：

```renpy
image bg forest = "#2d5a2d"    # 深绿色代表森林
image lk happy  = "#b8a88a"     # 米色代表李可立绘占位
```

### 替换为真实图片

准备好图片后，将文件放入 `game/images/` 目录，然后修改定义：

```renpy
image bg forest = "bg_forest.png"
image lk happy  = "lk_happy.png"
```

### 图片文件名建议

```
game/images/
├── bg_wilderness.png        # 荒野背景
├── bg_base_interior.png     # 基地内部
├── lk_neutral.png           # 李可-普通表情
├── lk_happy.png             # 李可-开心表情
├── chen_neutral.png         # 陈锋-普通表情
└── chen_urgent.png          # 陈锋-紧急表情
```

---

## 6. 分支路线的实现

### 基于变量的分支跳转

```renpy
# 定义变量
default route_chosen = ""

# 选择菜单
menu:
    "去档案馆":
        $ route_chosen = "memory"
        jump route_memory

# 后续章节入口
label chapter2:
    if route_chosen == "memory":
        jump chapter2_memory
    elif route_chosen == "duty":
        jump chapter2_duty
    # ...
```

### 每条路由独立标签

每条分支使用独立的 `label`，内容分离，方便管理和扩展。

---

## 7. 序章结束自动进入第二章

在序章结尾使用 `jump` 而非 `return`：

```renpy
label prologue_end:
    narr "序章 - 完"
    jump chapter2    # 自动进入第二章
```

`return` 会返回主菜单，`jump` 则会继续执行。

---

## 8. 角色定义不可用 callback 回调

### 错误示例

```renpy
define lk = Character("李可",
    callback=speaker_callback)    # 未定义的函数 → 报错
```

### 正确做法

只有在你确实定义了回调函数时才使用 `callback` 参数。最简单的角色定义：

```renpy
define lk = Character("李可",
    color="#d4c5a9",
    who_suffix="")
```

---

## 9. 开发者调试技巧

| 快捷键 | 作用 |
|--------|------|
| `Shift + D` | 打开开发者菜单 |
| `Shift + R` | 热重载脚本（改代码后快速测试） |
| `Ctrl` / `Tab` | 快速跳过对话 |

---

## 10. .rpyc 文件说明

每次运行游戏时，Ren'Py 会将 `.rpy` 编译为 `.rpyc` 缓存文件。如果修改了 `.rpy` 文件后游戏仍运行旧版本，删除 `.rpyc` 文件强制重新编译即可。

---

## 11. 字符串中的 `%` 格式化冲突

### 问题：`ValueError: unsupported format character`

当字符串中出现 `%` 时，Ren'Py 会将其视为 Python 格式字符串处理的起点：

```renpy
narr "翻译进度 - 47%{/i}"    # 报错：%{ 不是合法格式说明符
```

**原因**：Ren'Py 字符串底层使用 Python 的 `%` 格式化机制。`%` 后面跟随的字符会被解析为格式说明符（如 `%d`、`%s`）。如果 `%` 后跟 `{` 等不合法字符，就会抛出 `ValueError`。

**修复方案**（按推荐优先级）：

1. **改写文本，避免使用 `%`**（推荐，中文场景通常可行）：
   ```renpy
   narr "翻译进度 - 百分之四十七"
   ```

2. **使用 `%%` 转义**（单个 `%` 替换为 `%%`）：
   ```renpy
   narr "翻译进度 - 47%%"
   ```

3. **拼接字符串**：
   ```renpy
   $ progress = "%"
   narr "翻译进度 - 47" + progress
   ```

### 预防

在 Ren'Py 字符串中使用 `%` 时，确认其用途。如果是百分比文本：
- 中文文本中优先用"百分之X"替代
- 确需 `%` 符号时使用 `%%` 转义

---

## 12. 新增 `.rpy` 文件需要重启 Ren'Py

### 问题：`LabelNotFound: could not find label 'chapter3'`

**场景**：在项目中新增了一个 `.rpy` 文件（如 `chapter3.rpy`），运行时报错找不到 label。

**原因**：Ren'Py 在启动时编译所有 `.rpy` 文件并缓存为 `.rpyc`。热重载（`Shift+R`）**不会**识别全新添加的 `.rpy` 文件——它只重新编译已有文件。只有完整的 Ren'Py 重启（关闭窗口并重新启动）才能加载新文件。

**修复**：
1. 关闭 Ren'Py 窗口
2. 删除 `game/` 目录下所有 `.rpyc` 缓存文件（可选，重启 Ren'Py 也会自动清理）
3. 重新运行 Ren'Py 项目

### 鉴别方法

| 修改类型 | Shift+R 热重载 | 完全重启 |
|----------|---------------|----------|
| 修改已有 `.rpy` 内容 | 有效 | 有效 |
| 新增 `.rpy` 文件 | **无效** | 有效 |
| 修改 `gui.rpy` / `screens.rpy` | 部分有效 | 推荐 |

### 预防

每次新增 `.rpy` 文件后，完整重启 Ren'Py。修改已有文件则可以使用 `Shift+R` 快速测试。
