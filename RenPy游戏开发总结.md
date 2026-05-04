# Ren'Py 视觉小说游戏引擎开发总结

> 基于 Ren'Py 8.x 系列（Python 3），适用于 2025 年最新版本

---

## 目录

1. [什么是 Ren'Py](#1-什么是-renpy)
2. [环境搭建与项目结构](#2-环境搭建与项目结构)
3. [核心语法与脚本基础](#3-核心语法与脚本基础)
4. [角色与对话系统](#4-角色与对话系统)
5. [图像与立绘系统](#5-图像与立绘系统)
6. [菜单与分支选项](#6-菜单与分支选项)
7. [变量、Flag 与持久化数据](#7-变量flag-与持久化数据)
8. [Screen 界面语言](#8-screen-界面语言)
9. [ATL 动画与变换语言](#9-atl-动画与变换语言)
10. [音频系统](#10-音频系统)
11. [Python 集成](#11-python-集成)
12. [多语言与翻译](#12-多语言与翻译)
13. [多平台打包与发布](#13-多平台打包与发布)
14. [Ren'Py 8.x 新特性速览](#14-renpy-8x-新特性速览)
15. [开发调试技巧](#15-开发调试技巧)
16. [学习资源与社区](#16-学习资源与社区)

---

## 1. 什么是 Ren'Py

**Ren'Py** 是一个开源、跨平台的视觉小说（Visual Novel）游戏引擎，以 **Python 3** 为基础，专为叙事型游戏设计。自 2004 年发布以来，已成为全球最流行的视觉小说引擎之一。

### 核心特性

| 特性 | 说明 |
|------|------|
| **脚本驱动** | 基于类剧本语法，上手快，专注内容创作 |
| **Python 集成** | 完整 Python 3 支持，可嵌入复杂逻辑 |
| **Screen 界面语言** | 声明式 UI 系统，自由定制游戏界面 |
| **ATL 动画语言** | 内置动画与变换系统 |
| **跨平台引擎** | 一套代码发布到 Windows、macOS、Linux、Android、iOS、Web |
| **存档系统** | 内置存档/读档/回滚功能 |
| **Steam 集成** | 原生 Steam SDK 支持 |

### Ren'Py 8 vs Ren'Py 7

| 版本 | Python | 特性 |
|------|--------|------|
| **Ren'Py 8.x** | Python 3.9+ | 现代版本，支持 Harfbuzz 文字塑形、Emoji、Web 平台 |
| **Ren'Py 7.x** | Python 2.7 | 旧版维护线，仅修复安全问题，不建议新项目使用 |

---

## 2. 环境搭建与项目结构

### 2.1 下载与安装

- **官网下载**：<https://www.renpy.org/>
- **GitHub Releases**：<https://github.com/renpy/renpy/releases>
- 下载后解压即可运行，无需额外安装

### 2.2 推荐编辑器

- **Visual Studio Code** + **Ren'Py Language** 插件（语法高亮、代码补全）
- 也可使用 Ren'Py 自带的编辑器（JEdit 模式）

### 2.3 项目目录结构

```
MyProject/
├── game/                   # 游戏脚本与资源目录
│   ├── script.rpy          # 主脚本文件
│   ├── screens.rpy         # 界面定义
│   ├── gui.rpy             # GUI 样式配置
│   ├── options.rpy         # 游戏选项配置
│   ├── images/             # 图片资源
│   ├── audio/              # 音频资源
│   ├── fonts/              # 字体文件
│   └── tl/                 # 翻译文件目录
├── gui/                    # 默认 GUI 图片资源
└── renpy/                  # Ren'Py 引擎本体（不修改）
```

`.rpy` 文件是 Ren'Py 的脚本文件，编译后生成对应的 `.rpyc` 缓存文件。

### 2.4 快速启动新项目

启动 Ren'Py 后：
1. 点击 **"Create New Project"**
2. 输入项目名称、选择分辨率（建议 1280×720）
3. 选择配色主题
4. 项目创建完成后，编辑 `game/script.rpy` 开始创作

---

## 3. 核心语法与脚本基础

### 3.1 标签（Label）

`label` 是脚本的基本执行单元，类似函数：

```renpy
label start:
    "欢迎来到视觉小说的世界！"
    jump next_scene

label next_scene:
    "这是下一幕。"
    return   # 返回主菜单或调用点
```

### 3.2 特殊标签

| 标签 | 作用 |
|------|------|
| `label start:` | 游戏入口（必须） |
| `label splashscreen:` | 启动画面（可选） |
| `label main_menu:` | 主菜单（可选，自定义时使用） |
| `label after_load:` | 读档后执行 |
| `label quit:` | 退出游戏前执行 |

### 3.3 jump / call / return

```renpy
label start:
    call scene_one     # 调用子标签（会返回）
    jump scene_two     # 跳转（不返回）
    return

label scene_one:
    "场景一"
    return

label scene_two:
    "场景二"
    jump start         # 循环
```

### 3.4 注释

```renpy
# 这是单行注释
"对话1"  # 行尾注释
```

### 3.5 文本标签（Text Tags）

内联文本样式控制：

```renpy
"普通 {b}粗体{/b} {i}斜体{/i} {u}下划线{/u}"
"{s}删除线{/s} {color=#ff0000}红色文字{/color}"
"{size=+4}大号字{/size} {size=-2}小号字{/size}"
"文字{w=1.0}停顿1秒{fast}跳过等待{nw}不换行"
```

---

## 4. 角色与对话系统

### 4.1 定义角色

```renpy
# 基本定义
define e = Character("艾琳")
define l = Character("李华")

# 带颜色和样式的定义
define m = Character("神秘人", color="#c8ffc8", what_color="#ffffff")

# 带侧像
define s = Character("？？？", who_suffix="：", what_prefix="「", what_suffix="」")
```

### 4.2 对话

```renpy
e "你好！"
e "今天天气真不错。"
e "你喜欢视觉小说吗？"
```

### 4.3 叙述（ narrator）

```renpy
"这是叙述性文字。"
"不需要指定角色，直接用字符串即可。"
```

### 4.4 角色高级配置参数

```renpy
define c = Character(
    "名字",
    color="#ffffff",          # 名字颜色
    what_color="#cccccc",    # 对话颜色
    who_suffix=":",          # 名字后缀
    what_prefix="",          # 对话前缀
    what_suffix="",          # 对话后缀
    ctc="ctc.png",           # 点击继续提示图标（Click-to-Continue）
    ctc_position="fixed",    # 图标位置
    callback=my_callback,    # 回调函数
    image="side_eileen.png", # 侧像
    window_background="frame.png",  # 对话框背景
)
```

### 4.5 对话延伸控制

```renpy
e "第一行" extend "同一句话的延伸"
e "带{fast}这个字出现前不用等待"
```

---

## 5. 图像与立绘系统

### 5.1 声明图像

```renpy
# 方式一：image 声明
image bg 教室 = "bg_classroom.png"
image bg 公园 = "bg_park.jpg"

# 方式二：自动根据文件名匹配（推荐）
# 将文件放入 game/images/ 目录即可自动识别
```

### 5.2 图像控制命令

```renpy
scene bg 教室       # 切换背景（清空当前场景）
show eileen happy   # 显示一个角色图像
show eileen happy at left   # 指定位置
hide eileen         # 隐藏角色
```

### 5.3 图像位置与变换

```renpy
show eileen happy at left          # 左
show eileen happy at right         # 右
show eileen happy at center        # 中
show eileen happy:
    xalign 0.5 yalign 0.0          # 自定义位置
```

Ren'Py 内置位置：`left`, `right`, `center`, `truecenter`, `topleft`, `topright`, `bottomleft`, `bottomright`

### 5.4 过渡效果（Transitions）

```renpy
scene bg 教室 with fade           # 淡入
show eileen happy with dissolve   # 溶解
hide eileen with moveoutright     # 向右移出
scene bg 公园 with pixellate      # 像素化过渡
with Pause(1.0)                   # 暂停
```

**常用过渡效果**：

| 效果 | 说明 |
|------|------|
| `fade` | 淡入淡出（黑屏过渡） |
| `dissolve` | 溶解叠加 |
| `pixellate` | 像素化过渡 |
| `move` / `moveoutleft` / `moveoutright` | 位移 |
| `slideleft` / `slideright` / `slideup` / `slidedown` | 滑动 |
| `easeinleft` / `easeoutright` | 缓动出入 |
| `ImageDissolve("mask.png")` | 自定义形状过渡 |

### 5.5 复合立绘（Layered Image）

支持角色服装、表情、配件的自由组合：

```renpy
layeredimage eileen:
    always "eileen_base.png"
    group outfit:
        attribute casual default:
            "eileen_casual.png"
        attribute formal:
            "eileen_formal.png"
    group expression:
        attribute happy:
            "eileen_happy.png"
        attribute sad:
            "eileen_sad.png"

# 使用
show eileen casual happy
show eileen formal sad
```

### 5.6 Live2D 支持

Ren'Py 8.1+ 支持 Live2D Cubism 4.2 模型：

```renpy
define e = Character("艾琳", image="eileen")
image eileen = Live2D("eileen", base=.6, top=.6, height=1.0)
show eileen speak_1
```

---

## 6. 菜单与分支选项

### 6.1 基础菜单

```renpy
menu:
    "你要做什么？"
    "去公园散步":
        jump park
    "在家看书":
        jump home
    "什么也不做":
        jump lazy
```

### 6.2 条件菜单

```renpy
menu:
    "冒险者，你选择："
    "进入洞穴" if sword_obtained:
        jump cave
    "回城镇":
        jump town
    "查看背包" (sensitive=not is_battle):
        "当前没有背包可查看。"
```

### 6.3 带变量的菜单显示

```renpy
$ affection_points = 85

menu:
    "好感度 [affection_points]"
    "送礼物 (+10好感)":
        $ affection_points += 10
        "好感度增加了！"
    "聊天 (不增加好感)":
        "随便聊了聊。"
```

---

## 7. 变量、Flag 与持久化数据

### 7.1 变量定义规范

```renpy
# define —— 常量（init 时设置，运行时不变，不存档）
define e = Character("艾琳")
define MIN_LEVEL = 5

# default —— 变量（推荐！可以被存档/读档）
default level = 1
default hp = 100
default has_key = False

# $ —— 单行 Python 赋值
$ level += 1
$ hp = max(hp - 20, 0)
```

> **重要**：所有会在运行时改变的变量**必须**用 `default` 声明，否则存档/读档会出问题！

### 7.2 条件判断

```renpy
if has_key:
    "你打开了门。"
elif strength > 10:
    "你用蛮力推开了门。"
else:
    "门打不开。"
```

### 7.3 持久化数据（persistent）

跨存档、跨游戏会话的永久数据：

```renpy
# 声明
default persistent.unlocked_gallery = False
default persistent.play_count = 0
default persistent.endings = set()

# 使用（在任何位置）
$ persistent.play_count += 1
$ persistent.endings.add("good_ending")

# 在主菜单中检查
if persistent.unlocked_gallery:
    "画廊已解锁"
```

| 用途 | 示例 |
|------|------|
| 解锁画廊/结局 | `persistent.gallery_unlocked = True` |
| 统计游玩次数 | `persistent.plays += 1` |
| 跨游戏系列数据 | `MultiPersistent("my_series_id")` |
| 存档合并 | `renpy.register_persistent('endings', merge_func)` |

---

## 8. Screen 界面语言

Ren'Py 的声明式 UI 系统，用于自定义游戏界面。

### 8.1 基本语法

```renpy
screen my_screen:
    text "你好世界" xalign 0.5 yalign 0.5
    vbox:
        xalign 0.5 yalign 0.3
        textbutton "开始":
            action Start()
        textbutton "加载":
            action ShowMenu("load")
        textbutton "退出":
            action Quit(confirm=True)
```

### 8.2 常用组件

| 组件 | 用途 |
|------|------|
| `text` | 显示文本 |
| `button` / `textbutton` / `imagebutton` | 按钮 |
| `vbox` / `hbox` / `grid` | 布局容器 |
| `frame` / `window` | 带背景的容器 |
| `input` | 文本输入框 |
| `bar` / `vbar` | 进度条（HP、音量等） |
| `viewport` | 可滚动区域 |
| `fixed` | 固定布局（子项可自由定位） |
| `side` | 固定布局模板 |
| `timer` | 定时器 |
| `key` | 按键绑定 |

### 8.3 常用 Action

| Action | 作用 |
|--------|------|
| `Start()` | 开始新游戏 |
| `Load(filename)` / `Save(filename)` | 读档 / 存档 |
| `ShowMenu("save")` / `ShowMenu("load")` | 打开存档/读档界面 |
| `Quit(confirm=True)` | 退出游戏 |
| `Return(value)` | 返回并回传值 |
| `Jump(label)` / `Call(label)` | 跳转 / 调用标签 |
| `Show(screen)` / `Hide(screen)` | 显示/隐藏界面 |
| `SetVariable("name", value)` | 设置变量 |
| `ToggleVariable("flag")` | 切换布尔变量 |
| `Play("sound", "audio.ogg")` | 播放音频 |
| `SetMute()` / `ToggleMute()` | 静音控制 |
| `FileLoad(n)` / `FileSave(n)` | 指定存档位操作 |
| `Preference("display", "fullscreen")` | 设置偏好 |

### 8.4 带参数屏幕

```renpy
screen character_status(name, hp, max_hp):
    frame:
        xalign 0.0 yalign 0.0
        vbox:
            text "[name]"
            bar:
                value hp
                range max_hp
                xmaximum 200
            text "HP: [hp]/[max_hp]"

# 调用
show screen character_status("勇者", 75, 100)
```

### 8.5 showif 条件显示（8.1+）

```renpy
screen example:
    showif some_condition:
        at transform:
            on show:
                alpha 0.0
                linear .5 alpha 1.0
            on hide:
                linear .5 alpha 0.0
        text "条件满足时显示"
```

---

## 9. ATL 动画与变换语言

ATL（Animation and Transformation Language）是 Ren'Py 的 **动画与变换语言**，用于控制图像的位置、旋转、缩放、透明度以及动画序列。

### 9.1 Transform 声明

```renpy
# 定义可复用的变换
transform left_to_right:
    xalign 0.0
    linear 3.0 xalign 1.0
    repeat

transform bounce_in:
    xalign 0.5 yalign 0.0
    easein 1.0 yalign 0.5

transform fade_in_out:
    alpha 0.0
    linear 1.0 alpha 1.0
    pause 0.5
    linear 1.0 alpha 0.0
```

### 9.2 使用 ATL

```renpy
# show 时使用
show eileen happy at left_to_right

# 内联 ATL
show eileen happy:
    xalign 0.0
    ease 2.0 xalign 1.0
    pause 1.0
    ease 2.0 xalign 0.0
    repeat

# scene 时使用动画
scene bg forest:
    blur 10
    linear 2.0 blur 0
```

### 9.3 动画图像定义

```renpy
image eileen_blink:
    "eileen_open.png"
    pause 2.0
    "eileen_closed.png"
    pause 0.1
    "eileen_open.png"
    pause 2.0
    repeat
```

### 9.4 ATL 核心语句

| 语句 | 作用 |
|------|------|
| `linear n` | 线性插值（匀速） |
| `ease n` | 缓出 |
| `easein n` | 缓入 |
| `pause n` | 暂停 |
| `repeat` / `repeat n` | 循环/循环N次 |
| `choice` | 随机选择分支 |
| `parallel` | 并行执行 |
| `time n` | 跳转到指定时间点 |
| `on show` / `on hide` | 显示/隐藏事件 |
| `function` | 调用 Python 函数 |
| `clockwise` / `counterclockwise` | 旋转方向 |
| `circles n` | 旋转圈数 |
| `knot` | 样条曲线控制点 |
| `warp` | 自定义缓动函数 |
| `blur n` | 高斯模糊 |
| `matrixcolor` | 颜色矩阵变换 |

### 9.5 缓动函数

```renpy
# 内置缓动
transform demo:
    linear 2.0 xalign 1.0    # 匀速
    ease 2.0 xalign 0.0      # 缓出（平滑结束）
    easein 2.0 xalign 1.0    # 缓入（平滑开始）
    easeout 2.0 xalign 0.5   # 仅缓出
```

### 9.6 3D 变换（8.1+）

```renpy
transform three_d:
    xalign 0.5 yalign 0.5
    xrotate 0
    linear 2.0 xrotate 360
    repeat
```

### 9.7 在 Screen 中使用 ATL

```renpy
transform btn_hover:
    on idle:
        linear 0.2 zoom 1.0
    on hover:
        linear 0.2 zoom 1.1

screen main_menu:
    textbutton "开始游戏":
        at btn_hover
        action Start()
```

---

## 10. 音频系统

### 10.1 基本命令

```renpy
# 播放背景音乐
play music "bgm_happy.ogg" fadein 1.0

# 播放音效
play sound "sfx_door.ogg"

# 播放语音
play voice "vo_hello.ogg"

# 停止
stop music fadeout 1.0
stop sound

# 淡出替换
play music "bgm_sad.ogg" fadeout 1.0 fadein 1.0

# 排队播放
queue music "bgm_next.ogg"
```

### 10.2 音频通道

| 通道 | 用途 |
|------|------|
| `music` | 背景音乐（自动循环） |
| `sound` | 音效（不循环） |
| `voice` | 语音（自动停止） |
| 自定义 | `define audio.my_channel = 4`（最多 32 个） |

### 10.3 音频文件支持

| 格式 | 说明 |
|------|------|
| `.ogg` | 推荐，开源格式 |
| `.mp3` | 广泛兼容 |
| `.wav` | 无损，文件较大 |
| `.opus` | 压缩率更高（8.1+） |

---

## 11. Python 集成

Ren'Py = Ren'Py 脚本 + **完整 Python 3 语言**。

### 11.1 嵌入 Python

```renpy
# 单行
$ score = 100
$ renpy.notify("分数更新！")

# 多行
python:
    def calculate_damage(base, modifier):
        return base * modifier
    damage = calculate_damage(50, 1.5)
```

### 11.2 init python 块

```renpy
init python:
    # 游戏启动时执行一次
    import math
    def custom_function():
        return math.pi
```

### 11.3 可用的 Ren'Py 内置函数

```renpy
$ renpy.notify("提示消息")          # 显示通知
$ renpy.screenshot("screenshot.png") # 截图
$ renpy.movie_cutscene("intro.ogv")  # 播放视频
$ renpy.input("输入名字：")           # 文本输入
$ renpy.random.randint(1, 6)         # 随机数
$ renpy.show("eileen", "happy")      # Python 方式 show
$ renpy.jump("label_name")           # Python 方式 jump
$ renpy.call("label_name")           # Python 方式 call
$ renpy.full_restart()               # 完全重启
$ renpy.save_persistent()            # 手动保存持久数据
```

### 11.4 Python 文件（.py）

Ren'Py 脚本（`.rpy`）中的列表、字典、集合默认是可回滚的。
如果使用单独的 `.py` 文件，这些对象**不会**回滚，需要手动使用 `RevertableList` / `RevertableDict` / `RevertableSet`。

```python
# my_module.py (放在 game/ 目录下)
def helper():
    return 42
```

```renpy
# 在 .rpy 中使用
init python:
    import my_module
    $ result = my_module.helper()
```

### 11.5 _ren.py 文件（8.1+）

使用 Python 语法编写 Ren'Py 脚本：

```python
# game/my_script._ren.py
label start():
    "Hello from _ren.py!"
```

---

## 12. 多语言与翻译

Ren'Py 内置**完整的翻译系统**。

### 12.1 生成翻译文件

在 launcher 中选择 **"Generate Translations"** → 选择语言 → 生成 `.rpy` 文件

### 12.2 翻译文件结构

```
game/tl/chinese/
├── script.rpy        # 脚本翻译
├── screens.rpy       # 界面翻译
└── options.rpy       # 配置翻译
```

### 12.3 翻译文件示例

```renpy
# game/tl/chinese/script.rpy
translate chinese start_53b1a4e9:
    # "Hello, world!"  # 原文注释
    "你好，世界！"       # 翻译
```

### 12.4 inline 翻译（8.1+）

```renpy
e "Hello"  # translator: 你好
```

执行 `Generate Translations` 后，会自动识别并生成待翻译条目。

### 12.5 字体配置

```renpy
# options.rpy
define gui.text_font = "NotoSansSC-Regular.otf"
define gui.name_text_font = "NotoSansSC-Bold.otf"
```

> 中文游戏推荐字体：Noto Sans CJK、思源黑体、方正系列

---

## 13. 多平台打包与发布

### 13.1 在 Launcher 中打包

打开 Ren'Py Launcher → 选择项目 → 选择分发方式：

| 平台 | 说明 |
|------|------|
| **Windows** | 生成 `.exe` 可执行文件（包含 Windows 运行环境） |
| **Linux** | 生成 `.sh` / `.tar.bz2` |
| **macOS** | 生成 `.dmg` / `.app`（通用二进制，支持 Apple Silicon） |
| **Android** | 生成 `.apk` / `.aab`（需 JDK 21、Android SDK） |
| **Web** | 生成 HTML5 / WebAssembly 版本（8.1+） |
| **iOS** | 生成 Xcode 项目（需 macOS + Xcode） |

### 13.2 Web 发布（8.1+）

```renpy
# options.rpy 中配置
define build.web_name = "mygame"
```

发布后可使用 PWA（渐进式 Web 应用）功能，支持离线缓存和安装到桌面。

### 13.3 Android 打包注意事项

- 需要 **Java 21（JDK 21）**
- 需要 Android SDK + Android Studio
- 最大 APK 大小 2GB（Google Play 已支持 4GB）
- 支持 `aab`（Android App Bundle）格式

### 13.4 存档安全问题

Ren'Py 8.1+ 引入了 **存档安全令牌（Save Token）**，跨设备读取存档时会警告。

### 13.5 Steam 发布

- 内置重写的 Steamworks SDK，支持完整 API
- 支持 Steam Deck（自动适配按键布局）
- `config.steam_appid` 配置 Steam App ID
- Ren'Py Sync：跨设备存档同步（手机 ↔ 电脑 ↔ Web）

---

## 14. Ren'Py 8.x 新特性速览

### 8.0 "Heck Freezes Over"（2022年6月）

| 特性 | 说明 |
|------|------|
| **Python 3** | 从 Python 2.7 迁移到 Python 3.9 |
| Steam Deck | 原生支持 |
| VS Code 插件 | 官方 Ren'Py Language 扩展 |
| 新的音量混合器 | 主音量控制 |
| 无 32 位支持 | 仅 64 位 |
| Web 临时移除 | 8.1 恢复 |

### 8.1 "Where No One Has Gone Before"（2023年5月）

| 特性 | 说明 |
|------|------|
| **Web 回归** | 支持 HTML5 + WebAssembly 发布 |
| **漫画对话框** | 内置气泡对话框系统 |
| **Ren'Py Sync** | 跨设备存档同步 |
| **图片新格式** | AVIF、SVG |
| **视频新格式** | AV1 |
| **3D Stage** | 3D 旋转/定位 |
| **Live2D** | Cubism 4.2 支持 |
| **Apple Silicon** | 原生支持 |
| **音频重写** | 分贝系统、防爆音 |
| `_ren.py` | Python 语法写 Ren'Py 脚本 |

### 8.2（2023年-2024年）

| 特性 | 说明 |
|------|------|
| Harfbuzz 文字塑形 | 复杂文字（梵文系）正确渲染 |
| **Emoji 支持** | Emoji 15.1，肤色/性别修饰 |
| **可变字体** | OpenType 可变字体 |
| **fetch API** | `renpy.fetch()` HTTP 请求 |
| 数据 Actions | `CycleVariable`、`IncrementVariable` 等 |
| 开发者工具 | 编辑器跳转、跳过启动画面 |
| COLRv0 彩色表情 | |

### 8.3（2024年8月）

| 特性 | 说明 |
|------|------|
| **音频滤镜** | 实时音频处理（高通/低通/混响） |
| **文字着色器** | GLSL 着色器自定义文字效果 |
| 窗口语句改进 | `window auto False` 等 |
| 截图 Displayable | 截图任意可显示对象 |
| Android 15 | API Level 35 目标 |

---

## 15. 开发调试技巧

### 15.1 开发者菜单

游戏中按 **`Shift + D`** 打开开发者菜单：

| 功能 | 说明 |
|------|------|
| 变量查看器 | 显示/编辑所有变量 |
| 图像查看器 | 查看所有已加载图像 |
| 重新加载脚本 | 热重载（`Shift + R`） |
| 跳过 | 直接跳转到指定标签 |
| 样式调试器 | 查看/修改 UI 样式 |
| 显示文件名和行号 | 点击可在编辑器中打开（8.2+） |

### 15.2 热重载

游戏运行时按 **`Shift + R`** 可重新加载脚本，无需重启游戏（某些修改不支持，此时建议重启）。

### 15.3 跳过文本

- 按 **Ctrl** 或 **Tab** 快速跳过对话
- 鼠标中键也可跳过

### 15.4 常用测试技巧

```renpy
# 快速跳转到特定场景测试
label start:
    jump chapter_3  # 直接跳到第三章测试

# 显示所有变量
label debug_vars:
    python:
        for k, v in sorted(store.__dict__.items()):
            if not k.startswith("_"):
                renpy.say("", f"[k] = [v]")
    return
```

### 15.5 options.rpy 常用配置

```renpy
# 游戏窗口标题
define config.name = "我的游戏"

# 版本号
define config.version = "1.0"

# 设置分辨率（默认 1280×720）
define config.screen_width = 1280
define config.screen_height = 720

# 窗口图标
define config.window_icon = "icon.png"

# 是否允许跳过已读文本
define config.has_autosave = True

# 自动前进模式时间（秒）
define config.auto_forward_time = 3.0

# 设置存档位的数量
define config.save_slots = 36
```

### 15.6 gui.rpy 常用配置

```renpy
# 文字与字体
define gui.text_font = "NotoSansSC-Regular.otf"
define gui.name_text_font = "NotoSansSC-Bold.otf"
define gui.text_size = 22

# 对话框
define gui.textbox_height = 185
define gui.name_xalign = 0.5

# 按钮
define gui.button_text_size = 22

# 颜色
define gui.accent_color = '#c8c8ff'
define gui.idle_color = '#888888'
define gui.hover_color = '#ffffff'
define gui.selected_color = '#ffffff'
define gui.insensitive_color = '#8888887f'
```

---

## 16. 学习资源与社区

### 官方资源

| 资源 | 链接 |
|------|------|
| 官方文档（英文） | <https://www.renpy.org/doc/html/> |
| 快速入门 | <https://www.renpy.org/doc/html/quickstart.html> |
| GitHub 仓库 | <https://github.com/renpy/renpy> |
| 官方发布 | <https://www.renpy.org/release/> |

### 中文社区

| 名称 | 链接 | 说明 |
|------|------|------|
| Ren'Py 中文空间 | <https://www.renpy.cn/> | 官方中文社区论坛 |
| Lemma Soft 论坛 | <https://lemmasoft.renai.us/> | 国际最大的 Ren'Py 社区 |

### 教程与学习路径推荐

1. **零基础入门**：官方 Tutorial 项目 / B站 "Ren'Py 教程"
2. **系统学习语法**：阅读官方 Quickstart + misaka10013 笔记（<https://misaka10013.cn/p/1005221349.html>）
3. **进阶功能**：Screen 自定义界面、Python 集成、ATL 动画
4. **多平台发布**：Windows → Android → Web → macOS
5. **汉化/翻译**：GitHub 翻译指南 + renpy.cn 社区
6. **AI 辅助开发**：使用 DeepSeek / ChatGPT 辅助写脚本和对话内容

### 推荐 B站教程（2024-2025）

| 教程系列 | 适合人群 |
|----------|----------|
| Ren'Py 核心编程系列 | 从入门到进阶的系统教程 |
| Ren'Py 零基础入门教程 | 完全新手 |
| Ren'Py 手游按钮和 Banner 轮播 | 想学 UI 定制 |
| 用 DeepSeek + Ren'Py 做视觉小说 | 想结合 AI 创作 |
| 2025 汉化教程（unren + 翻译） | 汉化组/翻译人员 |

---

> **最后更新**：2026年5月
> **Ren'Py 当前最新稳定版**：8.3.x（Python 3）
> 建议新项目直接使用 Ren'Py 8.3+，所有新功能和新特性均在 8.x 线更新。
