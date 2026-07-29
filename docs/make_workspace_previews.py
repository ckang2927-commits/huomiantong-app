from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

OUT = Path(r"C:\Users\kangg\Desktop\huomiantong-app\docs")
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1600, 1000

COLORS = {
    'bg': (244, 240, 232),
    'paper': (255, 253, 248),
    'paper2': (249, 250, 246),
    'ink': (29, 43, 39),
    'muted': (100, 113, 109),
    'line': (222, 226, 217),
    'green': (18, 53, 47),
    'green2': (37, 125, 113),
    'green3': (226, 244, 236),
    'gold': (210, 179, 106),
    'orange': (210, 111, 69),
    'white': (255, 255, 255),
}

def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf" if bold else r"C:\Windows\Fonts\simsun.ttc",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

F = {
    'xs': font(18), 'sm': font(22), 'body': font(26), 'body_b': font(26, True),
    'h3': font(32, True), 'h2': font(42, True), 'hero': font(54, True),
    'tab': font(23, True), 'label': font(20, True), 'tiny': font(16),
}

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def shadow_card(base, box, radius=30, fill=(255,253,248), outline=(226,226,218), shadow=(28,43,39,36), offset=(0,18), blur=28):
    layer = Image.new('RGBA', base.size, (0,0,0,0))
    sd = ImageDraw.Draw(layer)
    sx0, sy0, sx1, sy1 = box[0]+offset[0], box[1]+offset[1], box[2]+offset[0], box[3]+offset[1]
    sd.rounded_rectangle((sx0, sy0, sx1, sy1), radius=radius, fill=shadow)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)
    d = ImageDraw.Draw(base)
    rounded(d, box, radius, fill, outline, 1)
    return d

def text(draw, xy, s, fill=None, f=None, anchor=None):
    draw.text(xy, s, fill=fill or COLORS['ink'], font=f or F['body'], anchor=anchor)

def pill(draw, box, label, fill, fg=None, outline=None, icon=None):
    rounded(draw, box, (box[3]-box[1])//2, fill, outline or fill, 1)
    x = box[0] + 18
    if icon:
        draw.ellipse((x, box[1]+13, x+12, box[1]+25), fill=icon)
        x += 22
    text(draw, (x, box[1]+11), label, fg or COLORS['ink'], F['label'])

def draw_logo(draw, cx, cy, r=28):
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=COLORS['white'], outline=(222,232,222), width=2)
    draw.rounded_rectangle((cx-14, cy-8, cx+14, cy+12), radius=8, fill=COLORS['green'])
    draw.polygon([(cx-5, cy+12), (cx+5, cy+12), (cx, cy+22)], fill=COLORS['green'])
    draw.arc((cx-19, cy-22, cx+19, cy+16), 204, 336, fill=COLORS['gold'], width=4)
    draw.ellipse((cx-5, cy-3, cx+5, cy+7), fill=COLORS['gold'])

def draw_card_header(draw, x, y, title, sub=None, status=None):
    text(draw, (x, y), title, COLORS['ink'], F['h3'])
    if sub:
        text(draw, (x, y+43), sub, COLORS['muted'], F['xs'])
    if status:
        pill(draw, (x+260, y+2, x+410, y+38), status, COLORS['green3'], COLORS['green2'], icon=COLORS['green2'])

def mini_line(draw, x, y, w, h=16, color=(224,232,226), r=8):
    rounded(draw, (x,y,x+w,y+h), r, color)

def answer_bars(draw, x, y, w, count=8):
    widths = [0.96, 0.88, 0.94, 0.74, 0.9, 0.82, 0.68, 0.44]
    for i in range(count):
        mini_line(draw, x, y+i*34, int(w*widths[i%len(widths)]), 15, (223, 231, 224), 8)


def draw_plan_b():
    im = Image.new('RGBA', (W,H), COLORS['bg']+(255,))
    d = ImageDraw.Draw(im)
    # background accents
    d.ellipse((-150,-180,480,300), fill=(219,234,224,150))
    d.ellipse((1180,-130,1740,300), fill=(236,220,173,130))
    rounded(d, (38,34,1562,946), 42, (255,253,248,245), (229,224,214), 1)

    # Top navigation
    rounded(d, (70,60,1530,150), 28, COLORS['green'], None)
    draw_logo(d, 118, 105, 29)
    text(d, (165,82), '获面通', COLORS['white'], F['h3'])
    text(d, (165,118), '顶部导航 / 工作台最大化', (202,216,210), F['xs'])
    tabs = ['面试台', '训练', '作战室', '简历库', '设置', '会话']
    x = 440
    for i, t in enumerate(tabs):
        bw = 98 if t not in ['作战室','简历库'] else 112
        active = i == 0
        rounded(d, (x,77,x+bw,132), 18, (255,253,248) if active else (255,255,255,22), None)
        text(d, (x+23,94), t, COLORS['green'] if active else (221,233,229), F['sm'])
        x += bw + 10
    pill(d, (1190,78,1348,132), 'DeepSeek', (241,232,208), (82,61,28), icon=COLORS['gold'])
    pill(d, (1362,78,1502,132), '麦克风', (226,244,236), COLORS['green2'], icon=COLORS['green2'])

    # title row
    text(d, (80,186), '方案 B：顶部导航，全宽工作台', COLORS['ink'], F['h2'])
    text(d, (80,237), '把左侧导航移到顶部，底下全部让给面试工作区；适合你说的“不想拥挤”。', COLORS['muted'], F['body'])
    pill(d, (1226,190,1510,244), '预计工作区宽度 +18%~25%', (232,244,236), COLORS['green2'], icon=COLORS['green2'])

    # profile/control strip
    shadow_card(im, (80,275,1520,365), 24, (250,252,247), (218,230,220), shadow=(33,53,48,24), blur=18)
    d = ImageDraw.Draw(im)
    draw_logo(d, 124, 320, 23)
    text(d, (162,297), '康帅超 · 数据分析师', COLORS['ink'], F['body_b'])
    text(d, (162,328), '当前候选人 / JD：数据分析师 / 回答风格：自然短答', COLORS['muted'], F['xs'])
    pill(d, (760,296,900,342), '麦克风转写', (226,244,236), COLORS['green2'], icon=COLORS['green2'])
    pill(d, (915,296,1080,342), '电脑音频待选', (247,238,216), (112,78,30), icon=COLORS['gold'])
    pill(d, (1095,296,1220,342), '暂停收音', COLORS['white'], COLORS['muted'], outline=(218,224,214))
    pill(d, (1235,296,1358,342), '保存会话', COLORS['green'], COLORS['white'])
    pill(d, (1372,296,1492,342), '悬浮窗', (255,255,255), COLORS['green'], outline=(213,223,215))

    # workspace columns
    y0, y1 = 392, 908
    x1, x2, x3 = 80, 440, 1165
    w1, w2, w3 = 335, 700, 355
    shadow_card(im, (x1,y0,x1+w1,y1), 28, COLORS['paper'], COLORS['line'])
    shadow_card(im, (x2,y0,x2+w2,y1), 32, COLORS['white'], COLORS['line'], shadow=(33,53,48,44), blur=30)
    shadow_card(im, (x3,y0,x3+w3,y1), 28, COLORS['paper'], COLORS['line'])
    d = ImageDraw.Draw(im)
    draw_card_header(d, x1+24, y0+24, '实时转写', '问题识别 / 暂存 / 手动补充', '监听中')
    # transcript items
    for i, (label, body, color) in enumerate([
        ('10:21 面试官', '请讲一下你印象最深的项目？', COLORS['gold']),
        ('10:22 系统修正', '识别为“项目经历类问题”', COLORS['green2']),
        ('10:23 暂存问题', '第二个问题先排队，不打断当前答案', (189,123,56)),
    ]):
        yy = y0+112+i*96
        rounded(d, (x1+24, yy, x1+w1-24, yy+78), 14, (249,250,246), (226,232,224), 1)
        d.rectangle((x1+24, yy+14, x1+28, yy+64), fill=color)
        text(d, (x1+42, yy+12), label, COLORS['muted'], F['tiny'])
        text(d, (x1+42, yy+39), body, COLORS['ink'], F['xs'])
    rounded(d, (x1+24, y1-92, x1+w1-24, y1-24), 16, (244,248,244), (224,231,224), 1)
    text(d, (x1+42, y1-75), '手动输入问题…', (121,132,128), F['xs'])
    pill(d, (x1+190, y1-78, x1+w1-40, y1-36), '生成短答', COLORS['green'], COLORS['white'])

    # answer card
    draw_card_header(d, x2+32, y0+30, 'AI 答案工作区', '重点放大：像真人回答，而不是粘贴简历', '流式输出')
    rounded(d, (x2+32, y0+105, x2+w2-32, y0+165), 18, (244,248,243), (225,232,224), 1)
    text(d, (x2+55, y0+121), '面试官问题：讲一个你印象最深的数据分析项目', COLORS['ink'], F['body_b'])
    rounded(d, (x2+32, y0+188, x2+w2-32, y1-108), 26, (250,251,247), (226,232,224), 1)
    text(d, (x2+58, y0+218), '推荐回答（100~300字，可继续展开）', COLORS['green2'], F['body_b'])
    text(d, (x2+58, y0+264), '我印象最深的是跨境电商广告 ROI 分析项目。', COLORS['ink'], F['body'])
    answer_bars(d, x2+58, y0+310, w2-116, 9)
    pill(d, (x2+32, y1-82, x2+190, y1-32), '更自然一点', (232,244,236), COLORS['green2'])
    pill(d, (x2+204, y1-82, x2+360, y1-32), '压缩到 150 字', COLORS['green'], COLORS['white'])
    pill(d, (x2+374, y1-82, x2+540, y1-32), '按 STAR 改写', (255,255,255), COLORS['green'], outline=(213,223,215))

    # evidence
    draw_card_header(d, x3+24, y0+24, '依据与风险', '简历命中 / JD 匹配 / 编造提醒')
    rounded(d, (x3+24, y0+104, x3+w3-24, y0+180), 18, COLORS['green3'], None)
    text(d, (x3+44, y0+119), '简历依据 4 条', COLORS['green2'], F['body_b'])
    text(d, (x3+44, y0+150), '随机森林 / ROI / RFM / A/B 实验', COLORS['muted'], F['xs'])
    for i, title in enumerate(['命中：广告 ROI 提升 15%', '命中：A/B 转化率提升 41%', '风险：不要硬说老板信息', '建议：回答控制在 2 段']):
        yy = y0+205+i*78
        rounded(d, (x3+24, yy, x3+w3-24, yy+58), 14, (249,250,246), (226,232,224), 1)
        text(d, (x3+44, yy+17), title, COLORS['ink'] if i<2 else (135,87,39), F['xs'])

    im.convert('RGB').save(OUT / 'ui-preview-workspace-plan-b.png', quality=96)


def draw_plan_c():
    im = Image.new('RGBA', (W,H), COLORS['bg']+(255,))
    d = ImageDraw.Draw(im)
    d.ellipse((-180,120,430,640), fill=(219,234,224,150))
    d.ellipse((1200,-100,1750,330), fill=(236,220,173,120))
    rounded(d, (38,34,1562,946), 42, (255,253,248,245), (229,224,214), 1)

    # icon rail
    rounded(d, (64,62,142,916), 34, COLORS['green'], None)
    draw_logo(d, 103, 106, 25)
    icons = ['M', 'T', 'C', 'R', 'S', 'H']
    yy = 192
    for i, ic in enumerate(icons):
        active = i == 0
        rounded(d, (82, yy, 124, yy+42), 14, COLORS['white'] if active else (234,242,236), None)
        text(d, (103, yy+8), ic, COLORS['green'], font(20, True), anchor='ma')
        yy += 66
    rounded(d, (82, 838, 124, 882), 16, (255,255,255,26), None)
    text(d, (103, 846), '≡', COLORS['white'], F['h3'], anchor='ma')

    # top content header
    rounded(d, (172,62,1532,150), 30, COLORS['white'], (226,226,218), 1)
    text(d, (204,82), '方案 C：窄图标侧栏 + 超宽工作台', COLORS['ink'], F['h2'])
    text(d, (204,126), '保留左侧导航肌肉记忆，宽度从 248px 压到 78px，主工作区明显放大。', COLORS['muted'], F['xs'])
    pill(d, (1118,80,1306,132), '当前：面试台', (232,244,236), COLORS['green2'], icon=COLORS['green2'])
    pill(d, (1320,80,1500,132), '工作区 +12%~18%', (247,238,216), (112,78,30), icon=COLORS['gold'])

    # left candidate dock, small and readable
    shadow_card(im, (172,180,430,914), 30, (250,252,247), (218,230,220), shadow=(33,53,48,24), blur=20)
    d = ImageDraw.Draw(im)
    text(d, (202,214), '候选人状态', COLORS['ink'], F['h3'])
    draw_logo(d, 232, 282, 30)
    text(d, (274,258), '康帅超', COLORS['ink'], F['body_b'])
    text(d, (274,292), '数据分析师', COLORS['muted'], F['xs'])
    for i, (name, val) in enumerate([('简历', '正式 + 万字 + 其他'), ('JD', '数据分析师'), ('风格', '自然短答'), ('模型', 'DeepSeek')]):
        yy = 352+i*76
        text(d, (202, yy), name, COLORS['muted'], F['xs'])
        text(d, (202, yy+28), val, COLORS['ink'], F['body_b'])
        mini_line(d, 202, yy+61, 186, 2, (225,231,224), 1)
    pill(d, (202,700,392,752), '切换候选人', COLORS['green'], COLORS['white'])
    pill(d, (202,768,392,820), '保存会话', (255,255,255), COLORS['green'], outline=(213,223,215))
    text(d, (202,862), '适合：左侧导航不占主空间。', COLORS['muted'], F['xs'])

    # main mega answer zone
    y0, y1 = 180, 914
    x1, x2 = 454, 1160
    shadow_card(im, (x1,y0,x2-18,y1), 34, COLORS['white'], COLORS['line'], shadow=(33,53,48,48), blur=32)
    shadow_card(im, (x2,y0,1532,y1), 30, COLORS['paper'], COLORS['line'])
    d = ImageDraw.Draw(im)

    draw_card_header(d, x1+34, y0+30, '面试实时工作区', '左上转写，主体答案，下面保留整场上下文', '更大')
    # compact transcript inside top
    rounded(d, (x1+34,y0+104,x2-52,y0+232), 24, (244,248,243), (225,232,224), 1)
    text(d, (x1+60, y0+126), '实时转写：请讲一下你印象最深的一个项目？', COLORS['ink'], F['body_b'])
    text(d, (x1+60, y0+166), '系统修正：项目经历类 · 暂存后续问题 · 3 秒无声确认结束', COLORS['muted'], F['xs'])
    pill(d, (x2-240, y0+124, x2-75, y0+176), '监听中', (232,244,236), COLORS['green2'], icon=COLORS['green2'])

    rounded(d, (x1+34,y0+258,x2-52,y1-150), 30, (250,251,247), (226,232,224), 1)
    text(d, (x1+64,y0+292), 'AI 答案（默认短答，必要时展开）', COLORS['green2'], F['body_b'])
    text(d, (x1+64,y0+344), '这个我会重点讲随机森林爆品预测项目。', COLORS['ink'], F['body'])
    answer_bars(d, x1+64, y0+392, (x2-x1)-150, 11)
    rounded(d, (x1+64,y1-232,x2-82,y1-174), 18, COLORS['green3'], None)
    text(d, (x1+86,y1-216), '下一句提示：追问模型验证时，讲 AUC、特征重要性和业务落地。', COLORS['green2'], F['xs'])
    pill(d, (x1+34, y1-112, x1+190, y1-60), '更像人话', (232,244,236), COLORS['green2'])
    pill(d, (x1+204, y1-112, x1+356, y1-60), '缩短答案', COLORS['green'], COLORS['white'])
    pill(d, (x1+370, y1-112, x1+542, y1-60), '生成追问', COLORS['white'], COLORS['green'], outline=(213,223,215))

    draw_card_header(d, x2+28, y0+30, '依据侧栏', '只放关键依据，不抢主空间')
    rounded(d, (x2+28, y0+104, 1504, y0+176), 18, COLORS['green3'], None)
    text(d, (x2+48,y0+120), '可信度 82 / 100', COLORS['green2'], F['body_b'])
    for i, (label, desc) in enumerate([
        ('简历命中', '随机森林选品模型'),
        ('JD 匹配', '建模 + 业务分析'),
        ('风险提醒', '不要编真实公司细节'),
        ('用量', '预计 0.004 元'),
        ('上下文', '本轮第 4 问'),
        ('导出', '复盘 / Word / MD'),
    ]):
        yy = y0+205+i*82
        rounded(d, (x2+28, yy, 1504, yy+62), 16, (249,250,246), (226,232,224), 1)
        text(d, (x2+48, yy+11), label, COLORS['ink'], F['xs'])
        text(d, (x2+48, yy+36), desc, COLORS['muted'], F['tiny'])

    im.convert('RGB').save(OUT / 'ui-preview-workspace-plan-c.png', quality=96)

if __name__ == '__main__':
    draw_plan_b()
    draw_plan_c()
    print('created', OUT / 'ui-preview-workspace-plan-b.png')
    print('created', OUT / 'ui-preview-workspace-plan-c.png')


