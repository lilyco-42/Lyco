/**
 * 《Lyco》背景图批量生成脚本（风格化版）
 * 向 Stable Diffusion WebUI Forge API 提交提示词，生成 1280×720 场景背景图
 *
 * Usage:
 *   1. 确保 Cloud Studio 上的 SD WebUI 已运行
 *   2. node generate_bg.js
 *
 * API 地址默认从环境变量 SD_URL 读取，也可以直接修改下面的 BASE_URL
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ===================== 配置 =====================

const BASE_URL = process.env.SD_URL || "https://a931e157612e4707947cb969965ecd6c--7860.ap-shanghai2.cloudstudio.club";
const TXT2IMG_URL = `${BASE_URL.replace(/\/+$/, "")}/sdapi/v1/txt2img`;

const OUTPUT_DIR = path.join(__dirname, "game", "images");

// ===================== 风格系统（来自 场景核心提示词.md） =====================

const STYLE = {
  // 通用风格锚定词 — 所有场景必加
  core: "post-apocalyptic visual novel illustration, desolate beauty, muted earth tones, ash gray atmosphere, cinematic widescreen composition, soft diffused lighting through volcanic ash haze, melancholic realism, painterly digital art, detailed backgrounds, no characters",

  quality: "masterpiece, best quality, highly detailed, 4k resolution, concept art",

  color: "desaturated, ash gray, deep crimson sky, muted ochre, cold blue shadow",
  lighting: "diffused overcast light, god rays through ash cloud, ember glow from distant fire",
  art: "anime background art, studio Ghibli apocalypse, painterly realism, atmospheric perspective",
  composition: "rule of thirds, low horizon line, vast empty sky, solitary figure scale",
};

// ===================== 背景定义 =====================

const backgrounds = [
  {
    filename: "bg_wilderness.png",
    label: "荒野（开幕场景）",
    scene: "A vast empty wilderness at dusk. Dry golden grass stretches across a barren plain. Warm orange sunset with patches of gray clouds. Distant mountain silhouettes on the horizon. A solitary figure would stand here, holding a handful of soil. Lonely melancholic atmosphere.",
    extra: `${STYLE.color}, ${STYLE.lighting}, ${STYLE.art}, ${STYLE.composition}`,
  },
  {
    filename: "bg_base_interior.png",
    label: "基地内部（日常场景）",
    scene: "Interior of a search and rescue team command base. A large world map on the wall with many red pins marking recent missions. Desks with radio equipment, monitors, and communication gear. Warm indoor lighting contrasting with cold blue-gray steel tones. Organized but lived-in space. Quiet tension in the air.",
    extra: `${STYLE.art}`,
  },
  {
    filename: "bg_base_exterior.png",
    label: "基地外部远景",
    scene: "Exterior of a gray concrete search and rescue base on the city outskirts. A rusted sign hangs by the entrance. Overcast sky with an unnatural deep crimson glow reflecting on the clouds. Distant city skyline barely visible through haze. Quiet abandoned atmosphere, as if everyone has left.",
    extra: `${STYLE.color}, ${STYLE.lighting}, ${STYLE.art}, ${STYLE.composition}`,
  },
  {
    filename: "bg_city_ruins.png",
    label: "城市废墟（灾后场景）",
    scene: "A ruined city after a major disaster. Collapsed buildings and rubble covering the streets. Fires burn in the distance casting an ember orange glow. Dark sky filled with volcanic ash. Clouds of dust and smoke. Destroyed urban landscape stretching to the horizon. Empty and silent. Post-apocalyptic desolation.",
    extra: `${STYLE.color}, ${STYLE.lighting}, ${STYLE.art}, ${STYLE.composition}`,
  },
  {
    filename: "bg_archives.png",
    label: "档案馆（Route A·记忆方舟）",
    scene: "Interior of an old city archive building. Tall wooden bookshelves filled with ancient books, scrolls, and documents. Dim warm lighting from hanging lamps. Smoke and dust creeping in from above. Historical papers piled on reading tables. Warm brown and muted ochre tones. A sense of urgency and loss.",
    extra: "desaturated warm tones, muted ochre, dust motes in light, anime background art, painterly realism",
  },
  {
    filename: "bg_rescue_site.png",
    label: "救援点废墟（Route B·最后守望）",
    scene: "Collapsed residential area after an earthquake. Rubble and twisted steel rebar everywhere. Destroyed apartment buildings on both sides. Dust and ash settling in the air. Debris field with personal belongings scattered. Gray ash and muted ochre tones. Hopeless yet resilient atmosphere.",
    extra: `${STYLE.color}, ${STYLE.lighting}, ${STYLE.art}, ${STYLE.composition}`,
  },
  {
    filename: "bg_observatory.png",
    label: "天文台（Route C·真相之巅）",
    scene: "An astronomical observatory on a mountain top at night. White domed building with the roof open, a telescope pointing at the sky. Stars visible through gaps in the ash clouds. Scientific equipment inside. Empty and quiet. Cool blue shadows and deep crimson sky. Mysterious, contemplative mood.",
    extra: "cold blue shadow, deep crimson night sky, starlight through ash haze, anime background art, atmospheric perspective",
  },
  {
    filename: "bg_hometown.png",
    label: "家乡小镇（Route D·归途）",
    scene: "A small peaceful rural town on the northern outskirts. Traditional Chinese-style houses lining an empty street. Autumn atmosphere with old trees shedding leaves. A familiar wooden house with a closed door. Warm earthy colors, soft diffused light. Nostalgic melancholy mood. Waiting for someone to return.",
    extra: "muted earth tones, warm ochre, soft overcast light, anime background art, studio Ghibli atmosphere, painterly realism",
  },
  {
    filename: "bg_highway.png",
    label: "公路（去程路途）",
    scene: "A long straight highway stretching through a barren landscape towards the horizon. Cars driving away in the opposite direction, fleeing. The road covered in a thin layer of gray ash. Power lines following the roadside. Overcast sky with muted gray tones. A desperate migration atmosphere. Cold and lonely.",
    extra: `${STYLE.color}, ${STYLE.lighting}, ${STYLE.art}, ${STYLE.composition}`,
  },
  {
    filename: "bg_night_sky.png",
    label: "夜空（沉思/闭幕场景）",
    scene: "A wide night sky filled with stars visible through gaps in drifting volcanic ash clouds. A crescent moon glows faintly behind thin layers of ash. Deep blue and dark purple tones. The ash creates subtle texture across the sky. Quiet and contemplative. Vast empty sky dominates the frame.",
    extra: "cold blue shadow, deep purple night, starlight through ash haze, anime background art, atmospheric perspective, low horizon line, vast empty sky",
  },
];

// ===================== HTTP 请求 =====================

function postJSON(url, data, timeoutMs) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const client = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: timeoutMs,
    };

    const req = client.request(options, (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`非JSON响应 (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("请求超时")); });
    req.write(body);
    req.end();
  });
}

// ===================== 构建完整提示词 =====================

function buildPrompt(bg) {
  return `${bg.scene} ${STYLE.core} ${bg.extra} ${STYLE.quality}`;
}

// ===================== 主流程 =====================

async function generateAll() {
  console.log("========================================");
  console.log("《Lyco》背景图批量生成 — 1280×720 风格化版");
  console.log(`API: ${TXT2IMG_URL}`);
  console.log(`输出: ${OUTPUT_DIR}`);
  console.log(`共 ${backgrounds.length} 张背景`);
  console.log("========================================\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 清空旧的背景图，重新生成
  let deleted = 0;
  for (const bg of backgrounds) {
    const fp = path.join(OUTPUT_DIR, bg.filename);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      deleted++;
    }
  }
  if (deleted > 0) console.log(`已删除 ${deleted} 张旧图，重新生成\n`);

  // 生成分辨率
  const W = 1280, H = 720;

  // 逐张生成（串行，避免显存爆炸）
  let success = 0;
  let fail = 0;

  for (let i = 0; i < backgrounds.length; i++) {
    const bg = backgrounds[i];
    const prompt = buildPrompt(bg);
    const filePath = path.join(OUTPUT_DIR, bg.filename);

    process.stdout.write(`[${i + 1}/${backgrounds.length}] 🎨 ${bg.label} ... `);

    const payload = {
      prompt,
      steps: 28,
      width: W,
      height: H,
      cfg_scale: 3.5,
      sampler_name: "euler",
      batch_size: 1,
      negative_prompt: "",
      seed: -1,
    };

    try {
      const result = await postJSON(TXT2IMG_URL, payload, 600000);
      if (!result.images || !result.images[0]) {
        throw new Error("API 未返回 images");
      }
      const imageBuffer = Buffer.from(result.images[0], "base64");
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`✅ ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      success++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      fail++;
    }
  }

  console.log("========================================");
  console.log(`完成！成功: ${success}, 失败: ${fail}`);
  console.log(`图片保存在: ${OUTPUT_DIR}`);
  console.log("========================================");
}

generateAll().catch((err) => {
  console.error("脚本异常:", err);
  process.exit(1);
});
