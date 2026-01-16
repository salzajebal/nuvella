from PIL import Image, ImageDraw, ImageFont
import os

base_image_path = "attached_assets/telegram-cloud-photo-size-4-6001348027815234534-y_1768551307934.jpg"
output_path = "attached_assets/generated_images/gimpay_complete_ad.png"

img = Image.open(base_image_path)
if img.mode != 'RGBA':
    img = img.convert('RGBA')

draw = ImageDraw.Draw(img)

width, height = img.size

font_path = "/nix/store/kp07qs4i2g8bcxdzhfrcz8pd84f2s04y-noto-fonts-cjk-sans-2.004/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc"

font_title = ImageFont.truetype(font_path, 28)
font_medium = ImageFont.truetype(font_path, 22)
font_small = ImageFont.truetype(font_path, 16)
font_tiny = ImageFont.truetype(font_path, 13)

gold_color = (255, 215, 100)
white_color = (255, 255, 255)

box1_text = [
    "전세계 코인 프리미엄 시세에",
    "정확하고 신속한 거래체결로",
    "안전한 수익을 만들어드립니다"
]
y = 55
for line in box1_text:
    draw.text((35, y), line, font=font_title, fill=white_color)
    y += 35

box2_text = [
    "매번 거래시 1.5% 수익",
    "리스크 0%"
]
y = 190
for line in box2_text:
    draw.text((35, y), line, font=font_medium, fill=gold_color)
    y += 30

box3_text = [
    "코인거래에 대해 모르는분일지라도",
    "고객센터에 문의주시면 거래할수있게",
    "안내도와드립니다"
]
y = 290
for line in box3_text:
    draw.text((35, y), line, font=font_small, fill=white_color)
    y += 24

box4_text = [
    "우리 김프페이는 고객분들께",
    "투자를 권유하지 않습니다"
]
y = 400
for line in box4_text:
    draw.text((35, y), line, font=font_small, fill=white_color)
    y += 24

bottom_text = [
    "기존 국내 코인거래소에 가입된분들은",
    "남들보다 빠르게 많은 수익을 볼수있으며",
    "가입하지 않은 분들일지라도 가입안내와",
    "동시에 거래할수있는 모든 정보를 공유해드립니다"
]
y = 490
for line in bottom_text:
    draw.text((35, y), line, font=font_tiny, fill=white_color)
    y += 20

footer_text = [
    "모든 투자는 리스크가 존재하지만",
    "우리 김프페이의 운영시스템은 리스크 0%의",
    "획기적인 방법으로 여러분들의 자산을",
    "지켜드리고 수익을 볼수있는 시스템입니다"
]
y = height - 100
for line in footer_text:
    draw.text((35, y), line, font=font_tiny, fill=gold_color)
    y += 18

result = img.convert('RGB')
result.save(output_path, quality=95)
print(f"Image saved to: {output_path}")
