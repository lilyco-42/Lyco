# 《Lyco》背景生成 API

## SD WebUI Forge

Cloud Studio 上运行的 Stable Diffusion WebUI Forge 实例：

```
https://a931e157612e4707947cb969965ecd6c--7860.ap-shanghai2.cloudstudio.club
```

### API 端点

| 功能 | 端点 | 方法 |
|------|------|------|
| 文生图 | `/sdapi/v1/txt2img` | POST |
| 图生图 | `/sdapi/v1/img2img` | POST |
| 获取模型列表 | `/sdapi/v1/sd-models` | GET |
| 获取配置 | `/sdapi/v1/options` | GET |
| 设置配置 | `/sdapi/v1/options` | POST |
| 获取采样器 | `/sdapi/v1/samplers` | GET |
| 获取进度 | `/sdapi/v1/progress` | GET |

### 文生图请求格式

```json
POST /sdapi/v1/txt2img

{
  "prompt": "欲生成的提示词（英文）",
  "negative_prompt": "nsfw, lowres, bad anatomy...",
  "steps": 28,
  "width": 960,
  "height": 540,
  "cfg_scale": 7,
  "sampler_name": "Euler a",
  "batch_size": 1,
  "seed": -1
}
```

### 文生图响应格式

```json
{
  "images": ["base64编码的PNG图片..."],
  "parameters": "{...}",
  "info": "{...}"
}
```

### 快速测试

```bash
# 用 curl 测试
curl -X POST "https://<你的地址>/sdapi/v1/txt2img" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test, masterpiece",
    "steps": 20,
    "width": 512,
    "height": 512
  }' -o test.json

# 提取图片（base64在images[0]）
# 然后用 node 解析保存
```

---

## 批量生成脚本

### `generate_bg.js`

一键生成全部 10 张场景背景图：

```bash
# 直接运行（使用脚本内默认 URL）
node generate_bg.js

# 或指定 URL
SD_URL="https://你的地址" node generate_bg.js
```

生成的图片保存到 `game/images/` 目录，自动按 `bg_xxx.png` 命名。

### 生成的背景列表

| 文件 | 场景 | 路线 |
|------|------|------|
| `bg_wilderness.png` | 荒野黄昏 | 开幕 |
| `bg_base_interior.png` | 基地内部 | 日常 |
| `bg_base_exterior.png` | 基地外部 | 日常 |
| `bg_city_ruins.png` | 城市废墟 | 灾后 |
| `bg_archives.png` | 档案馆 | Route A |
| `bg_rescue_site.png` | 救援点 | Route B |
| `bg_observatory.png` | 天文台 | Route C |
| `bg_hometown.png` | 家乡小镇 | Route D |
| `bg_highway.png` | 公路 | 路途 |
| `bg_night_sky.png` | 夜空 | 闭幕 |

### 注意事项

- 提示词必须用**英文**
- 首次生成较慢（加载模型），后续会快很多
- 每张之间间隔 3 秒，避免请求过载
- 图片已存在则自动跳过，可删除后重跑
- 输出分辨率为 960×540（16:9），适合 RenPy 缩放显示
