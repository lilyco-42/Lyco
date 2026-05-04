const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaBook, FaHandsHelping, FaSearch, FaHome,
  FaUserFriends, FaGlobeAsia, FaRocket, FaTree,
  FaMusic, FaImage, FaMapSigns, FaStar,
  FaHeart, FaBrain, FaBalanceScale, FaChevronRight,
  FaClock, FaCity, FaFire, FaCompass, FaRoad,
  FaTheaterMasks, FaLightbulb
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function createPresentation() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Lyco Project";
  pres.title = "Lyco 序章路线规划";

  // Color palette: 灰蓝 + 暖橙 (matching game's visual style)
  const C = {
    darkBg: "1B2838",
    darkBg2: "243447",
    warmAccent: "D4785C",
    warmAccent2: "E8917A",
    warmGlow: "F0A08A",
    coolBlue: "4A6B8A",
    coolBlueLight: "6B8DB5",
    cream: "F5F0EB",
    creamDark: "E8DFD6",
    textLight: "F5F0EB",
    textMuted: "A0AAB5",
    textDark: "2C3E50",
    white: "FFFFFF",
    darkCard: "1E3142",
    routeA: "D4785C",
    routeB: "4A6B8A",
    routeC: "7B9E6B",
    routeD: "C49B6C",
  };

  const makeShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.15 });

  // Load all icons (use # prefix for SVG/HTML rendering)
  const icons = {};
  const IC = "#" + C.warmAccent; // "#D4785C" for SVG
  const iconMap = {
    book: [FaBook, IC],
    hands: [FaHandsHelping, IC],
    search: [FaSearch, IC],
    home: [FaHome, IC],
    users: [FaUserFriends, IC],
    globe: [FaGlobeAsia, IC],
    rocket: [FaRocket, IC],
    tree: [FaTree, IC],
    music: [FaMusic, IC],
    image: [FaImage, IC],
    map: [FaMapSigns, IC],
    star: [FaStar, IC],
    heart: [FaHeart, IC],
    brain: [FaBrain, IC],
    balance: [FaBalanceScale, IC],
    clock: [FaClock, IC],
    city: [FaCity, IC],
    fire: [FaFire, IC],
    compass: [FaCompass, IC],
    road: [FaRoad, IC],
    masks: [FaTheaterMasks, IC],
    bulb: [FaLightbulb, IC],
    chevron: [FaChevronRight, IC],
  };
  for (const [key, [comp, color]] of Object.entries(iconMap)) {
    icons[key] = await iconToBase64Png(comp, color);
  }

  // ============ HELPER: Title/Divider Slide ============
  function addDividerSlide(number, title, subtitle, iconKey) {
    let slide = pres.addSlide();
    slide.background = { color: C.darkBg };

    // Top accent line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.warmAccent }
    });

    // Decorative circles
    slide.addShape(pres.shapes.OVAL, {
      x: 7.5, y: -2, w: 5, h: 5, fill: { color: C.darkBg2, transparency: 40 }
    });
    slide.addShape(pres.shapes.OVAL, {
      x: 8.5, y: -1, w: 3, h: 3, fill: { color: C.warmAccent, transparency: 88 }
    });

    // Section number
    if (number) {
      slide.addText(String(number).padStart(2, "0"), {
        x: 0.8, y: 1.0, w: 1.5, h: 0.8,
        fontSize: 48, fontFace: "Arial Black", color: C.warmAccent, bold: true,
        margin: 0
      });
    }

    // Icon
    if (iconKey && icons[iconKey]) {
      slide.addImage({ data: icons[iconKey], x: 0.8, y: number ? 2.0 : 1.5, w: 0.55, h: 0.55 });
    }

    // Title
    const titleY = number ? 2.8 : (iconKey ? 2.3 : 1.8);
    slide.addText(title, {
      x: 0.8, y: titleY, w: 8.0, h: 0.9,
      fontSize: 34, fontFace: "Arial Black", color: C.textLight, bold: true,
      margin: 0
    });

    // Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: titleY + 1.0, w: 8.0, h: 0.5,
        fontSize: 15, fontFace: "Calibri", color: C.textMuted,
        margin: 0
      });
    }

    // Decorative line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: titleY + 1.6, w: 1.5, h: 0.04, fill: { color: C.warmAccent }
    });

    return slide;
  }

  // ============ HELPER: Content Slide with Header ============
  function addContentSlide(title, iconKey) {
    let slide = pres.addSlide();
    slide.background = { color: C.cream };

    // Top header bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.darkBg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0.82, w: 10, h: 0.04, fill: { color: C.warmAccent }
    });

    // Title in header
    if (iconKey && icons[iconKey]) {
      slide.addImage({ data: icons[iconKey], x: 0.5, y: 0.18, w: 0.42, h: 0.42 });
      slide.addText(title, {
        x: 1.05, y: 0.1, w: 8.0, h: 0.65,
        fontSize: 20, fontFace: "Arial Black", color: C.textLight, bold: true,
        valign: "middle", margin: 0
      });
    } else {
      slide.addText(title, {
        x: 0.5, y: 0.1, w: 8.5, h: 0.65,
        fontSize: 20, fontFace: "Arial Black", color: C.textLight, bold: true,
        valign: "middle", margin: 0
      });
    }

    return slide;
  }

  // ============ SLIDE 1: TITLE ============
  {
    let slide = pres.addSlide();
    slide.background = { color: C.darkBg };

    // Top accent
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.warmAccent } });

    // Background decorative circles
    slide.addShape(pres.shapes.OVAL, { x: 3, y: -3, w: 7, h: 7, fill: { color: C.darkBg2, transparency: 30 } });
    slide.addShape(pres.shapes.OVAL, { x: 6.5, y: 0.5, w: 5, h: 5, fill: { color: C.warmAccent, transparency: 88 } });
    slide.addShape(pres.shapes.OVAL, { x: -1.5, y: 3.5, w: 3, h: 3, fill: { color: C.coolBlue, transparency: 80 } });

    // Game title
    slide.addText("《Lyco》", {
      x: 0.8, y: 1.2, w: 6, h: 0.7,
      fontSize: 18, fontFace: "Calibri", color: C.warmAccent,
      charSpacing: 6, margin: 0
    });

    // Main title
    slide.addText("序章路线规划", {
      x: 0.8, y: 1.85, w: 7, h: 1.2,
      fontSize: 44, fontFace: "Arial Black", color: C.textLight, bold: true, margin: 0
    });

    // Decorative line
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.3, w: 2, h: 0.04, fill: { color: C.warmAccent } });

    // Core theme
    slide.addText("人类，是一种，会为了一捧土背后的记忆，所悲伤的动物。", {
      x: 0.8, y: 3.6, w: 7.5, h: 0.6,
      fontSize: 14, fontFace: "Calibri", color: C.textMuted, italic: true, margin: 0
    });

    // Info
    slide.addText("哲学科幻视觉小说  |  主角：李可  |  地球特别搜救队  |  2026", {
      x: 0.8, y: 4.5, w: 7, h: 0.4,
      fontSize: 11, fontFace: "Calibri", color: C.coolBlueLight, margin: 0
    });
  }

  // ============ SLIDE 2: 故事脉络 ============
  {
    let slide = addContentSlide("故事脉络", "map");

    const flowSteps = [
      { title: "开幕", sub: "尘土", desc: "哲学独白\n「一捧土」" },
      { title: "日常", sub: "基地", desc: "角色介绍\n团队日常" },
      { title: "坠落", sub: "末日", desc: "灾难降临\n社会崩塌" },
      { title: "混乱", sub: "抉择", desc: "四条路线\n价值抉择" },
      { title: "分支", sub: "尾声", desc: "记忆·责任\n真相·归途" },
    ];

    const boxW = 1.35, gap = 0.50;
    const totalW = flowSteps.length * boxW + (flowSteps.length - 1) * gap;
    const startX = (10 - totalW) / 2;
    const boxY = 1.4;
    const boxH = 2.4;

    flowSteps.forEach((step, i) => {
      const x = startX + i * (boxW + gap);

      // Card background
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: boxY, w: boxW, h: boxH,
        fill: { color: C.white },
        shadow: makeShadow()
      });

      // Top accent on card
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: boxY, w: boxW, h: 0.06,
        fill: { color: C.warmAccent }
      });

      // Step number
      slide.addText(String(i + 1), {
        x, y: boxY + 0.15, w: boxW, h: 0.45,
        fontSize: 24, fontFace: "Arial Black", color: C.warmAccent, bold: true,
        align: "center", margin: 0
      });

      // Title
      slide.addText(step.title, {
        x, y: boxY + 0.55, w: boxW, h: 0.4,
        fontSize: 16, fontFace: "Arial Black", color: C.textDark, bold: true,
        align: "center", margin: 0
      });

      // Subtitle
      slide.addText(step.sub, {
        x, y: boxY + 0.9, w: boxW, h: 0.3,
        fontSize: 12, fontFace: "Calibri", color: C.coolBlue,
        align: "center", margin: 0
      });

      // Separator line
      slide.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.3, y: boxY + 1.3, w: boxW - 0.6, h: 0.01,
        fill: { color: C.creamDark }
      });

      // Description
      slide.addText(step.desc, {
        x: x + 0.15, y: boxY + 1.4, w: boxW - 0.3, h: 0.85,
        fontSize: 11, fontFace: "Calibri", color: C.textMuted,
        align: "center", valign: "top", margin: 0
      });

      // Arrow between cards
      if (i < flowSteps.length - 1) {
        slide.addImage({
          data: icons.chevron,
          x: x + boxW + 0.05, y: boxY + boxH / 2 - 0.15,
          w: 0.35, h: 0.3
        });
      }
    });

    // Bottom note
    slide.addText("五段式叙事结构  ·  从开幕独白到分支抉择", {
      x: 0.5, y: 4.3, w: 9, h: 0.4,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted,
      align: "center", margin: 0
    });
  }

  // ============ SLIDE 3: 角色设定 ============
  {
    let slide = addContentSlide("角色设定", "users");

    const headerRow = [
      { text: "角色", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 12, align: "center" } },
      { text: "身份", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 12, align: "center" } },
      { text: "性格", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 12, align: "center" } },
      { text: "叙事作用", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 12, align: "center" } },
    ];

    const charData = [
      ["李可", "主角，搜救队长，30岁", "外冷内热，理性中透着深情", "玩家视角，哲学思考的载体"],
      ["陈锋", "副队长，38岁，退伍军人", "沉默寡言，行动派", "务实声音，与李可形成对照"],
      ["周晴", "医疗员，26岁", "温柔坚韧，理想主义", "代表「未来」与「希望」"],
      ["赵明远", "市档案馆长，68岁", "博学，执着于记忆", "代表「历史」与「记忆」维度"],
      ["播音员", "新闻/广播声音", "客观冷静→逐渐崩溃", "传递外部世界信息"],
    ];

    const dataRows = charData.map((row, idx) =>
      row.map(cell => ({
        text: cell,
        options: {
          fontSize: 11, color: C.textDark,
          fill: { color: idx % 2 === 0 ? C.cream : C.white },
          align: idx === 0 ? "center" : "left"
        }
      }))
    );

    // Bold first column
    dataRows.forEach(row => {
      row[0].options.bold = true;
      row[0].options.color = C.warmAccent;
    });

    const finalTableData = [headerRow, ...dataRows];

    slide.addTable(finalTableData, {
      x: 0.5, y: 1.15, w: 9.0,
      colW: [1.3, 2.5, 2.8, 2.4],
      border: { pt: 0.5, color: C.creamDark },
      rowH: [0.45, 0.55, 0.55, 0.55, 0.55, 0.55],
    });
  }

  // ============ SLIDE 4: 序章结构概览 ============
  addDividerSlide(1, "序章结构详解", "五段式叙事 · 约 25-35 分钟游戏时长", "clock");

  // ============ SLIDE 5: 开幕·尘土 ============
  {
    let slide = addContentSlide("Part 1 · 开幕 · 尘土", "globe");
    slide.background = { color: C.darkBg };
    // Override header
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "1A2535" } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.82, w: 10, h: 0.04, fill: { color: C.warmAccent } });
    if (icons.globe) {
      slide.addImage({ data: icons.globe, x: 0.5, y: 0.18, w: 0.42, h: 0.42 });
    }
    slide.addText("Part 1 · 开幕 · 尘土", {
      x: 1.05, y: 0.1, w: 8.0, h: 0.65,
      fontSize: 20, fontFace: "Arial Black", color: C.textLight, bold: true,
      valign: "middle", margin: 0
    });

    // Scene info
    slide.addText("场景：空旷的荒野  |  氛围：安静、沉思、略带忧伤", {
      x: 0.5, y: 1.15, w: 9, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Content layout - left column with bullet points
    slide.addText([
      { text: "核心内容", options: { bold: true, fontSize: 15, color: C.warmAccent, breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 6 } },
      { text: "李可手中握着一捧土，独白引入主题", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "回溯「这捧土」背后的记忆：一个普通下午，一次救援任务，一个孩子的笑脸", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "建立情感基调：人类为何会为「土」而悲伤？因为土承载着记忆", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "过渡：从回忆回到现实，世界即将改变", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
    ], {
      x: 0.5, y: 1.65, w: 5.5, h: 2.8,
      valign: "top", margin: 0,
      paraSpaceAfter: 6,
    });

    // Right side - narrative technique card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.5, y: 1.65, w: 3.0, h: 2.0,
      fill: { color: C.darkBg2 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.5, y: 1.65, w: 0.06, h: 2.0,
      fill: { color: C.warmAccent }
    });

    slide.addText("叙事技巧", {
      x: 6.75, y: 1.75, w: 2.5, h: 0.35,
      fontSize: 13, fontFace: "Arial Black", color: C.warmAccent, bold: true, margin: 0
    });

    slide.addText("倒叙 + 内心独白\n画面从特写（手心的土）\n拉开到全景\n（末日前的世界）", {
      x: 6.75, y: 2.15, w: 2.5, h: 1.3,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Runtime badge
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.5, y: 3.85, w: 3.0, h: 0.5,
      fill: { color: C.warmAccent, transparency: 15 }
    });
    slide.addText("⏱ 预计时长：约 3-5 分钟", {
      x: 6.5, y: 3.85, w: 3.0, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 6: 日常·基地 ============
  {
    let slide = addContentSlide("Part 2 · 日常 · 基地", "city");

    // Scene info
    slide.addText("场景：地球特别搜救队基地  |  氛围：紧张有序，隐约的不安", {
      x: 0.5, y: 1.15, w: 9, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Three content cards
    const cards = [
      {
        title: "角色互动",
        items: [
          "陈锋检查设备——「最近任务多了」",
          "周晴整理医疗包——「天气越来越不正常」",
          "建立角色关系，展现团队动态"
        ]
      },
      {
        title: "背景叙事",
        items: [
          "电视新闻播报天文异常",
          "专家争论：彗星还是小行星？",
          "为灾难降临埋下伏笔"
        ]
      },
      {
        title: "情节推进",
        items: [
          "李可接到上级通知",
          "待命状态升级",
          "不安感逐渐累积"
        ]
      }
    ];

    const cardW = 2.8;
    const cardGap = 0.3;
    const cardStartX = 0.5;

    cards.forEach((card, i) => {
      const x = cardStartX + i * (cardW + cardGap);
      const y = 1.65;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: cardW, h: 2.9,
        fill: { color: C.white },
        shadow: makeShadow()
      });

      // Card accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: cardW, h: 0.06,
        fill: { color: C.warmAccent }
      });

      // Card number
      slide.addText(String(i + 1), {
        x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.4,
        fontSize: 20, fontFace: "Arial Black", color: C.warmAccent, bold: true, margin: 0
      });

      // Card title
      slide.addText(card.title, {
        x: x + 0.55, y: y + 0.15, w: 2.0, h: 0.4,
        fontSize: 15, fontFace: "Arial Black", color: C.textDark, bold: true,
        valign: "middle", margin: 0
      });

      // Separator
      slide.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.15, y: y + 0.65, w: cardW - 0.3, h: 0.01,
        fill: { color: C.creamDark }
      });

      // Items
      const itemTexts = card.items.map((item, idx) => ({
        text: item,
        options: { bullet: true, breakLine: idx < card.items.length - 1, fontSize: 11, color: C.textDark }
      }));

      slide.addText(itemTexts, {
        x: x + 0.15, y: y + 0.75, w: cardW - 0.3, h: 2.0,
        valign: "top", margin: 0, paraSpaceAfter: 6
      });
    });

    // Runtime
    slide.addText("⏱ 预计时长：约 5-8 分钟", {
      x: 0.5, y: 4.7, w: 9, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: C.coolBlue, align: "right", margin: 0
    });
  }

  // ============ SLIDE 7: 坠落·末日 ============
  {
    let slide = addContentSlide("Part 3 · 坠落 · 末日", "fire");
    slide.background = { color: C.darkBg };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "1A2535" } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.82, w: 10, h: 0.04, fill: { color: C.warmAccent } });
    if (icons.fire) {
      slide.addImage({ data: icons.fire, x: 0.5, y: 0.18, w: 0.42, h: 0.42 });
    }
    slide.addText("Part 3 · 坠落 · 末日", {
      x: 1.05, y: 0.1, w: 8.0, h: 0.65,
      fontSize: 20, fontFace: "Arial Black", color: C.textLight, bold: true,
      valign: "middle", margin: 0
    });

    slide.addText("场景：基地 → 城市废墟  |  氛围：混乱、震撼、绝望", {
      x: 0.5, y: 1.15, w: 9, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Left column - events
    slide.addText("灾难序列", {
      x: 0.5, y: 1.6, w: 4.5, h: 0.4,
      fontSize: 16, fontFace: "Arial Black", color: C.warmAccent, bold: true, margin: 0
    });

    slide.addText([
      { text: "小行星撞击——视觉 + 音效高潮", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "地震、警报、断电", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "冲击波过境，玻璃碎裂，建筑摇晃", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "火山喷发，灰烬遮蔽天空", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "通讯中断，磁场异常，指南针失灵", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "商业火箭大规模发射——「他们在逃离」", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textLight } },
      { text: "城市变成灰烬笼罩的废墟", options: { bullet: true, fontSize: 12, color: C.textLight } },
    ], {
      x: 0.5, y: 2.05, w: 5.0, h: 2.5,
      valign: "top", margin: 0, paraSpaceAfter: 4
    });

    // Right column - key dialogue
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 1.6, w: 3.3, h: 1.6,
      fill: { color: C.darkBg2 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 1.6, w: 0.06, h: 1.6,
      fill: { color: C.warmAccent }
    });

    slide.addText("关键对话", {
      x: 6.45, y: 1.7, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.warmAccent, bold: true, margin: 0
    });

    slide.addText([
      { text: "陈锋：", options: { bold: true, color: C.coolBlueLight, fontSize: 12 } },
      { text: "「队长，我们撤不撤？」", options: { fontSize: 12, color: C.textLight, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "李可的回应将展现她的性格核心", options: { italic: true, fontSize: 11, color: C.textMuted } },
    ], {
      x: 6.45, y: 2.05, w: 2.8, h: 1.0,
      valign: "top", margin: 0
    });

    // Key dialogue card 2
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.4, w: 3.3, h: 1.2,
      fill: { color: C.darkBg2 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.4, w: 0.06, h: 1.2,
      fill: { color: C.coolBlue }
    });

    slide.addText("外部视角", {
      x: 6.45, y: 3.5, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.coolBlue, bold: true, margin: 0
    });

    slide.addText("新闻最后广播：\n「……官方建议……保持冷静……」\n播音员的声音从客观到逐渐崩溃", {
      x: 6.45, y: 3.85, w: 2.8, h: 0.7,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    slide.addText("⏱ 预计时长：约 8-10 分钟", {
      x: 0.5, y: 4.7, w: 9, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: C.warmAccent, align: "right", margin: 0
    });
  }

  // ============ SLIDE 8: 混乱·抉择 ============
  {
    let slide = addContentSlide("Part 4 · 混乱 · 抉择", "compass");

    slide.addText("场景：废墟中的临时指挥点  |  氛围：压抑、紧迫、需要决断", {
      x: 0.5, y: 1.15, w: 9, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Four direction cards
    const directions = [
      { label: "① 市区", target: "档案馆起火，文物面临毁灭", icon: "book" },
      { label: "② 城西", target: "被困群众，救援信号不断", icon: "hands" },
      { label: "③ 天文台", target: "科学家发现异常数据", icon: "search" },
      { label: "④ 北郊", target: "李可家乡的方向", icon: "home" },
    ];

    const dirW = 2.0, dirGap = 0.30;
    const dirTotalW = 4 * dirW + 3 * dirGap;
    const dirStartX = (10 - dirTotalW) / 2;

    directions.forEach((dir, i) => {
      const x = dirStartX + i * (dirW + dirGap);
      const y_c = 1.7;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: y_c, w: dirW, h: 2.5,
        fill: { color: C.white },
        shadow: makeShadow()
      });

      // Icon
      if (icons[dir.icon]) {
        slide.addImage({
          data: icons[dir.icon],
          x: x + dirW / 2 - 0.25, y: y_c + 0.2, w: 0.5, h: 0.5
        });
      }

      // Label
      slide.addText(dir.label, {
        x, y: y_c + 0.8, w: dirW, h: 0.35,
        fontSize: 15, fontFace: "Arial Black", color: C.textDark, bold: true,
        align: "center", margin: 0
      });

      // Description
      slide.addText(dir.target, {
        x: x + 0.1, y: y_c + 1.2, w: dirW - 0.2, h: 1.0,
        fontSize: 11, fontFace: "Calibri", color: C.textMuted,
        align: "center", valign: "top", margin: 0
      });
    });

    // Bottom callout
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.4, w: 9.0, h: 0.55,
      fill: { color: C.warmAccent, transparency: 10 }
    });

    slide.addText("李可只能去一个地方——她的选择将决定故事的走向", {
      x: 0.5, y: 4.4, w: 9.0, h: 0.55,
      fontSize: 13, fontFace: "Calibri", color: C.textDark, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("⏱ 预计时长：约 3-5 分钟", {
      x: 0.5, y: 5.05, w: 9, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.coolBlue, align: "right", margin: 0
    });
  }

  // ============ SLIDE 9: 分支路线总览 ============
  addDividerSlide(2, "四条分支路线", "四种价值观的探索  ·  各约 3-5 分钟", "road");

  // ============ SLIDE 10: Route A - 记忆方舟 ============
  {
    let slide = addContentSlide("Route A · 记忆方舟", "book");

    // Tag
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fill: { color: C.routeA }
    });
    slide.addText("记忆 · 文明 · 传承", {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    // Core question
    slide.addText("当世界即将消亡，人类的记忆还重要吗？", {
      x: 0.5, y: 1.65, w: 9, h: 0.4,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, italic: true, margin: 0
    });

    // Left - story points
    slide.addText([
      { text: "剧情脉络", options: { bold: true, fontSize: 14, color: C.routeA, breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 5 } },
      { text: "李可选择前往市档案馆", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "与赵明远馆长一起抢救文物、书籍、档案", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "大火逼近，只能带走一小部分", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "赵老的抉择：他选择留在档案馆", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark, bold: true } },
      { text: "李可带走了一本日记、一叠照片、一盘录音带——普通人一生的记忆", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
    ], {
      x: 0.5, y: 2.15, w: 5.2, h: 2.5,
      valign: "top", margin: 0, paraSpaceAfter: 4
    });

    // Right - theme card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 3.3, h: 1.6,
      fill: { color: C.routeA, transparency: 8 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 0.06, h: 1.6,
      fill: { color: C.routeA }
    });

    slide.addText("主题升华", {
      x: 6.45, y: 2.25, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.routeA, bold: true, margin: 0
    });

    slide.addText("文明不只是宏伟的建筑，\n更是每个普通人记忆的总和", {
      x: 6.45, y: 2.6, w: 2.8, h: 0.8,
      fontSize: 12, fontFace: "Calibri", color: C.textDark, margin: 0
    });

    // Ending image
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fill: { color: C.routeA, transparency: 12 }
    });
    slide.addText("结局意象：李可抱着一个盒子走出火海\n盒子里装着「一座城市的记忆」", {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fontSize: 10, fontFace: "Calibri", color: C.textDark,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 11: Route B - 最后守望 ============
  {
    let slide = addContentSlide("Route B · 最后守望", "hands");

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fill: { color: C.routeB }
    });
    slide.addText("责任 · 生命 · 坚守", {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("即使救不了所有人，还要救人吗？", {
      x: 0.5, y: 1.65, w: 9, h: 0.4,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, italic: true, margin: 0
    });

    slide.addText([
      { text: "剧情脉络", options: { bold: true, fontSize: 14, color: C.routeB, breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 5 } },
      { text: "李可选择前往城西救援点", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "废墟中搜索幸存者，团队合作", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "一次次在余震中进出危楼", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "陈锋受伤——代价开始显现", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark, bold: true } },
      { text: "救出了一个女孩，她问：「地球真的要完了吗？」", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
    ], {
      x: 0.5, y: 2.15, w: 5.2, h: 2.5,
      valign: "top", margin: 0, paraSpaceAfter: 4
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 3.3, h: 1.6,
      fill: { color: C.routeB, transparency: 8 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 0.06, h: 1.6,
      fill: { color: C.routeB }
    });

    slide.addText("主题升华", {
      x: 6.45, y: 2.25, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.routeB, bold: true, margin: 0
    });

    slide.addText("救一个人，不是改变了世界，\n而是没有让世界改变你", {
      x: 6.45, y: 2.6, w: 2.8, h: 0.8,
      fontSize: 12, fontFace: "Calibri", color: C.textDark, margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fill: { color: C.routeB, transparency: 12 }
    });
    slide.addText("结局意象：李可背着受伤的陈锋，\n牵着女孩的手，在灰烬中前行", {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fontSize: 10, fontFace: "Calibri", color: C.textDark,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 12: Route C - 真相之巅 ============
  {
    let slide = addContentSlide("Route C · 真相之巅", "search");

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fill: { color: C.routeC }
    });
    slide.addText("真相 · 科学 · 理解", {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("末日之中，知道真相还有意义吗？", {
      x: 0.5, y: 1.65, w: 9, h: 0.4,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, italic: true, margin: 0
    });

    slide.addText([
      { text: "剧情脉络", options: { bold: true, fontSize: 14, color: C.routeC, breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 5 } },
      { text: "李可选择前往天文观测站", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "艰难的旅程，磁场异常导致导航失效", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "科学家发现惊人信息", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "这颗小行星不是自然天体", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark, bold: true } },
      { text: "模糊的数据指向……某种「意图」", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
    ], {
      x: 0.5, y: 2.15, w: 5.2, h: 2.5,
      valign: "top", margin: 0, paraSpaceAfter: 4
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 3.3, h: 1.6,
      fill: { color: C.routeC, transparency: 8 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 0.06, h: 1.6,
      fill: { color: C.routeC }
    });

    slide.addText("主题升华", {
      x: 6.45, y: 2.25, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.routeC, bold: true, margin: 0
    });

    slide.addText("面对未知，恐惧的反面不是勇敢，\n是好奇心", {
      x: 6.45, y: 2.6, w: 2.8, h: 0.8,
      fontSize: 12, fontFace: "Calibri", color: C.textDark, margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fill: { color: C.routeC, transparency: 12 }
    });
    slide.addText("结局意象：李可站在天文台废墟上，\n仰望被灰烬遮蔽的天空，思考「为什么」", {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fontSize: 10, fontFace: "Calibri", color: C.textDark,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 13: Route D - 归途 ============
  {
    let slide = addContentSlide("Route D · 归途", "home");

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fill: { color: C.routeD }
    });
    slide.addText("羁绊 · 告别 · 亲情", {
      x: 0.5, y: 1.15, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("末日之前，你最想见到谁？", {
      x: 0.5, y: 1.65, w: 9, h: 0.4,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, italic: true, margin: 0
    });

    slide.addText([
      { text: "剧情脉络", options: { bold: true, fontSize: 14, color: C.routeD, breakLine: true } },
      { text: "", options: { breakLine: true, fontSize: 5 } },
      { text: "李可选择前往北郊家乡", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "一路上看到无数逃难的人，方向相反", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "回忆起与家人/重要之人的过往（回忆杀）", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "抵达后发现……（留白，由玩家决定情感基调）", options: { bullet: true, breakLine: true, fontSize: 12, color: C.textDark, bold: true } },
    ], {
      x: 0.5, y: 2.15, w: 5.2, h: 2.2,
      valign: "top", margin: 0, paraSpaceAfter: 4
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 3.3, h: 1.6,
      fill: { color: C.routeD, transparency: 8 },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 2.15, w: 0.06, h: 1.6,
      fill: { color: C.routeD }
    });

    slide.addText("主题升华", {
      x: 6.45, y: 2.25, w: 2.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.routeD, bold: true, margin: 0
    });

    slide.addText("所有的远方都不重要了，\n重要的是谁在你身边——\n或者，你心里有谁", {
      x: 6.45, y: 2.6, w: 2.8, h: 0.8,
      fontSize: 12, fontFace: "Calibri", color: C.textDark, margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fill: { color: C.routeD, transparency: 12 }
    });
    slide.addText("结局意象：李可推开熟悉的家门\n门里等待着什么，留给玩家想象", {
      x: 6.2, y: 3.9, w: 3.3, h: 0.55,
      fontSize: 10, fontFace: "Calibri", color: C.textDark,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 14: 哲学架构 ============
  {
    let slide = addContentSlide("主题与哲学架构", "brain");

    // The four-direction diagram - use smaller radius and better positioning
    const cx = 5.0, cy = 2.5, radius = 1.4;

    // Pre-load white icons for node circles
    const iconMapWhite = {
      book: [FaBook, "#FFFFFF"],
      hands: [FaHandsHelping, "#FFFFFF"],
      search: [FaSearch, "#FFFFFF"],
      heart: [FaHeart, "#FFFFFF"],
    };
    // Use the already-loaded colored icons, create white versions only if needed
    // Actually, icons are loaded already. For node circles, we need white icons.
    // Let me generate them inline.

    // Lines from center to each node (draw BEFORE center circle)
    const dirConfig = [
      { label: "记忆", sub: "人类是记忆的总和", x: cx, y: cy - radius, color: C.routeA },
      { label: "责任", sub: "人类是彼此的责任", x: cx + radius, y: cy, color: C.routeB },
      { label: "真相", sub: "人类是追问的勇气", x: cx, y: cy + radius, color: C.routeC },
      { label: "归途", sub: "人类是爱与被爱的渴望", x: cx - radius, y: cy, color: C.routeD },
    ];

    // Draw lines from center outward (before center circle so they're behind)
    dirConfig.forEach(dir => {
      // Line from center edge to node edge (not through center circle)
      const dx = dir.x - cx;
      const dy = dir.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Start from edge of center circle (radius 0.5)
      const startX = cx + (dx / dist) * 0.5;
      const startY = cy + (dy / dist) * 0.5;
      // End at edge of node circle (radius 0.35)
      const endX = dir.x - (dx / dist) * 0.35;
      const endY = dir.y - (dy / dist) * 0.35;

      slide.addShape(pres.shapes.LINE, {
        x: startX, y: startY, w: endX - startX, h: endY - startY,
        line: { color: dir.color, width: 1.5, dashType: "dash" }
      });
    });

    // Center circle (on top of lines)
    slide.addShape(pres.shapes.OVAL, {
      x: cx - 0.5, y: cy - 0.5, w: 1.0, h: 1.0,
      fill: { color: C.darkBg },
      line: { color: C.warmAccent, width: 2 }
    });
    slide.addText("人类\n是什么？", {
      x: cx - 0.5, y: cy - 0.5, w: 1.0, h: 1.0,
      fontSize: 11, fontFace: "Arial Black", color: C.textLight, bold: true,
      align: "center", valign: "middle", margin: 0
    });

    // Node circles with labels (positioned carefully to avoid overflow)
    dirConfig.forEach(dir => {
      // Circle node
      const circleX = dir.x - 0.35, circleY = dir.y - 0.35;
      slide.addShape(pres.shapes.OVAL, {
        x: circleX, y: circleY, w: 0.7, h: 0.7,
        fill: { color: dir.color },
      });

      // Label positioning - calculate based on direction
      let labelX, labelY, subY;
      if (dir.y < cy) {
        // Top: label below and to the right (avoids header bar y=0-0.85)
        labelX = dir.x + 0.45;
        labelY = dir.y + 0.05;
        subY = dir.y + 0.35;
      } else if (dir.y > cy) {
        // Bottom: label below circle
        labelX = dir.x - 1.25;
        labelY = dir.y + 0.55;
        subY = dir.y + 0.85;
      } else if (dir.x > cx) {
        // Right: label to the right
        labelX = dir.x + 0.45;
        labelY = dir.y - 0.35;
        subY = dir.y;
      } else {
        // Left: label to the left
        labelX = dir.x - 3.75;
        labelY = dir.y - 0.35;
        subY = dir.y;
      }

      // Ensure labels stay within bounds
      labelX = Math.max(0.3, Math.min(7.2, labelX));
      const labelW = 2.5;
      const adjustedLabelX = Math.min(labelX, 10 - labelW - 0.3);

      slide.addText(dir.label, {
        x: adjustedLabelX, y: labelY, w: labelW, h: 0.35,
        fontSize: 15, fontFace: "Arial Black", color: dir.color, bold: true,
        align: "center", margin: 0
      });
      slide.addText(dir.sub, {
        x: adjustedLabelX, y: subY, w: labelW, h: 0.3,
        fontSize: 10, fontFace: "Calibri", color: C.textDark,
        align: "center", margin: 0
      });
    });

    // Bottom quote (moved down to avoid overlap)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.5, w: 9.0, h: 0.55,
      fill: { color: C.warmAccent, transparency: 10 }
    });
    slide.addText("而贯穿所有路线的，是开头的那句话：「人类，是一种，会为了一捧土背后的记忆，所悲伤的动物。」", {
      x: 0.5, y: 4.5, w: 9.0, h: 0.55,
      fontSize: 11, fontFace: "Calibri", color: C.textDark, italic: true,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 15: 技术实现要点 ============
  {
    let slide = addContentSlide("技术实现要点", "image");

    // Left: Resources table
    const resHeader = [
      { text: "类型", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 11, align: "center" } },
      { text: "内容", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 11, align: "center" } },
      { text: "备注", options: { bold: true, color: C.white, fill: { color: C.darkBg }, fontSize: 11, align: "center" } },
    ];

    const resData = [
      ["背景-荒野", "空旷原野，黄昏", "开幕场景"],
      ["背景-基地", "搜救队基地内部", "日常场景"],
      ["背景-废墟", "城市废墟，火光", "灾后场景"],
      ["背景-档案馆", "图书馆/档案馆", "Route A"],
      ["背景-救援点", "坍塌建筑群", "Route B"],
      ["背景-天文台", "天文观测站", "Route C"],
      ["背景-家乡", "郊外小镇/老屋", "Route D"],
    ];

    const resRows = resData.map((row, idx) =>
      row.map(cell => ({
        text: cell,
        options: {
          fontSize: 10, color: C.textDark,
          fill: { color: idx % 2 === 0 ? C.cream : C.white }
        }
      }))
    );

    slide.addTable([resHeader, ...resRows], {
      x: 0.5, y: 1.15, w: 5.2,
      colW: [1.2, 2.2, 1.8],
      border: { pt: 0.5, color: C.creamDark },
      rowH: [0.35, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
    });

    // Right: Music & Visual style
    slide.addText("音乐风格", {
      x: 6.2, y: 1.15, w: 3.3, h: 0.35,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, bold: true, margin: 0
    });

    const musicStyles = [
      ["主旋律", "钢琴 + 弦乐，忧伤而庄重"],
      ["Route A", "长笛 + 竖琴，温暖而哀伤"],
      ["Route B", "打击乐 + 铜管，紧张坚定"],
      ["Route C", "电子 + 氛围音，神秘宏大"],
      ["Route D", "木吉他 + 人声，温柔怀念"],
    ];

    slide.addText(musicStyles.map((m, i) => ({
      text: `${m[0]}: ${m[1]}`,
      options: { bullet: true, breakLine: i < musicStyles.length - 1, fontSize: 10, color: C.textDark }
    })), {
      x: 6.2, y: 1.55, w: 3.3, h: 1.5,
      valign: "top", margin: 0, paraSpaceAfter: 3
    });

    // Visual style
    slide.addText("视觉风格", {
      x: 6.2, y: 3.2, w: 3.3, h: 0.35,
      fontSize: 14, fontFace: "Arial Black", color: C.textDark, bold: true, margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.6, w: 3.3, h: 1.3,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 3.6, w: 0.06, h: 1.3,
      fill: { color: C.warmAccent }
    });

    slide.addText([
      { text: "主色调：灰蓝 + 暖橙", options: { breakLine: true, fontSize: 11, color: C.textDark, bold: true } },
      { text: "末日冰冷 vs 记忆的温暖", options: { breakLine: true, fontSize: 10, color: C.textMuted } },
      { text: "", options: { breakLine: true, fontSize: 4 } },
      { text: "UI：简洁透明化", options: { bullet: true, breakLine: true, fontSize: 10, color: C.textDark } },
      { text: "关键独白放慢速度", options: { bullet: true, fontSize: 10, color: C.textDark } },
    ], {
      x: 6.45, y: 3.7, w: 2.8, h: 1.1,
      valign: "top", margin: 0, paraSpaceAfter: 2
    });
  }

  // ============ SLIDE 16: 后续章节展望 ============
  {
    let slide = addContentSlide("后续章节展望", "star");

    // Four future routes
    const futureRoutes = [
      { route: "Route A", title: "记忆航海图", desc: "寻找保存记忆的方舟计划", color: C.routeA },
      { route: "Route B", title: "灰烬中的微光", desc: "在废墟中重建文明", color: C.routeB },
      { route: "Route C", title: "星海谜题", desc: "探索小行星背后的真相", color: C.routeC },
      { route: "Route D", title: "归途未归", desc: "关于「家」与「告别」的故事", color: C.routeD },
    ];

    const fCardW = 1.95, fGap = 0.30;
    const fTotalW = 4 * fCardW + 3 * fGap;
    const fStartX = (10 - fTotalW) / 2;

    futureRoutes.forEach((fr, i) => {
      const x = fStartX + i * (fCardW + fGap);
      const y = 1.5;

      // Card
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: fCardW, h: 2.6,
        fill: { color: C.white },
        shadow: makeShadow()
      });

      // Top color bar
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: fCardW, h: 0.08,
        fill: { color: fr.color }
      });

      // Route label
      slide.addText(fr.route, {
        x, y: y + 0.2, w: fCardW, h: 0.3,
        fontSize: 11, fontFace: "Calibri", color: fr.color, bold: true,
        align: "center", margin: 0
      });

      // Arrow
      slide.addImage({
        data: icons.chevron,
        x: x + fCardW / 2 - 0.15, y: y + 0.5,
        w: 0.3, h: 0.3
      });

      // Chapter title
      slide.addText(fr.title, {
        x, y: y + 0.9, w: fCardW, h: 0.6,
        fontSize: 16, fontFace: "Arial Black", color: C.textDark, bold: true,
        align: "center", valign: "middle", margin: 0
      });

      // Description
      slide.addText(fr.desc, {
        x: x + 0.1, y: y + 1.6, w: fCardW - 0.2, h: 0.8,
        fontSize: 11, fontFace: "Calibri", color: C.textMuted,
        align: "center", valign: "top", margin: 0
      });
    });

    // Bottom note
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.3, w: 9.0, h: 0.6,
      fill: { color: C.darkBg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.28, w: 9.0, h: 0.04,
      fill: { color: C.warmAccent }
    });

    slide.addText("全局共通：无论哪条路线，最终都将汇聚到一个更大的谜题——小行星的来源与目的", {
      x: 0.5, y: 4.3, w: 9.0, h: 0.6,
      fontSize: 12, fontFace: "Calibri", color: C.textLight,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============ SLIDE 17: END ============
  {
    let slide = pres.addSlide();
    slide.background = { color: C.darkBg };

    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.warmAccent } });

    slide.addShape(pres.shapes.OVAL, { x: 3, y: -3, w: 7, h: 7, fill: { color: C.darkBg2, transparency: 30 } });
    slide.addShape(pres.shapes.OVAL, { x: 7, y: 1, w: 4, h: 4, fill: { color: C.warmAccent, transparency: 90 } });

    slide.addText("《Lyco》", {
      x: 0.8, y: 1.6, w: 8, h: 0.6,
      fontSize: 18, fontFace: "Calibri", color: C.warmAccent, charSpacing: 6, margin: 0
    });

    slide.addText("序章路线规划 · v1.0", {
      x: 0.8, y: 2.2, w: 8, h: 0.8,
      fontSize: 32, fontFace: "Arial Black", color: C.textLight, bold: true, margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.2, w: 1.5, h: 0.04, fill: { color: C.warmAccent } });

    slide.addText("规划日期：2026年5月", {
      x: 0.8, y: 3.5, w: 5, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: C.textMuted, margin: 0
    });

    // Quote
    slide.addText("「人类，是一种，会为了一捧土背后的记忆，所悲伤的动物。」", {
      x: 0.8, y: 4.2, w: 8, h: 0.5,
      fontSize: 12, fontFace: "Calibri", color: C.coolBlueLight, italic: true, margin: 0
    });
  }

  // ============ WRITE FILE ============
  await pres.writeFile({ fileName: "Lyco_序章路线规划.pptx" });
  console.log("✅ Presentation created: Lyco_序章路线规划.pptx");
}

createPresentation().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});