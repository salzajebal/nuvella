from PIL import Image, ImageDraw, ImageFont
import os

base_image_path = "attached_assets/generated_images/clean_crypto_ad_woman_on_right.png"
output_path = "attached_assets/generated_images/gimpay_final_korean_ad.png"

img = Image.open(base_image_path)
if img.mode != 'RGBA':
    img = img.convert('RGBA')

overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

width, height = img.size

font_path = "/nix/store/kp07qs4i2g8bcxdzhfrcz8pd84f2s04y-noto-fonts-cjk-sans-2.004/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc"

font_title = ImageFont.truetype(font_path, 48)
font_subtitle = ImageFont.truetype(font_path, 18)
font_highlight = ImageFont.truetype(font_path, 24)
font_small = ImageFont.truetype(font_path, 14)
font_tiny = ImageFont.truetype(font_path, 12)

gold_color = (255, 200, 50, 255)
white_color = (255, 255, 255, 255)
light_blue = (180, 220, 255, 255)

draw.rounded_rectangle([(20, 35), (230, 100)], radius=10, fill=(10, 20, 50, 200))
draw.text((30, 42), "김프페이", font=font_title, fill=gold_color)

draw.rounded_rectangle([(20, 115), (280, 200)], radius=10, fill=(10, 20, 50, 180))
subtitle_lines = [
    "전세계 코인 프리미엄 시세에",
    "정확하고 신속한 거래체결로",
    "안전한 수익을 만들어드립니다"
]
y_pos = 122
for line in subtitle_lines:
    draw.text((30, y_pos), line, font=font_subtitle, fill=white_color)
    y_pos += 26

highlight_y = 220
draw.rounded_rectangle([(20, highlight_y), (230, highlight_y + 70)], radius=12, fill=(0, 100, 180, 240))
draw.text((32, highlight_y + 10), "매번 거래시 1.5% 수익", font=font_highlight, fill=gold_color)
draw.text((32, highlight_y + 40), "리스크 0%", font=font_highlight, fill=gold_color)

info_y = 310
draw.rounded_rectangle([(20, info_y), (260, info_y + 75)], radius=10, fill=(20, 30, 60, 180))
info_lines = [
    "코인거래에 대해 모르는분일지라도",
    "고객센터에 문의주시면",
    "거래할수있게 안내도와드립니다"
]
iy = info_y + 12
for line in info_lines:
    draw.text((30, iy), line, font=font_small, fill=light_blue)
    iy += 20

notice_y = 400
draw.rounded_rectangle([(20, notice_y), (width - 20, notice_y + 32)], radius=8, fill=(100, 70, 20, 220))
draw.text((30, notice_y + 7), "김프페이는 고객분들께 투자를 권유하지 않습니다", font=font_small, fill=gold_color)

benefit_y = height - 140
draw.rounded_rectangle([(20, benefit_y), (width - 20, benefit_y + 55)], radius=10, fill=(20, 30, 60, 200))
benefit_lines = [
    "✓ 기존 거래소 가입자: 빠르게 많은 수익 가능",
    "✓ 미가입자: 가입안내와 거래정보 모두 공유"
]
by = benefit_y + 10
for line in benefit_lines:
    draw.text((30, by), line, font=font_small, fill=white_color)
    by += 20

footer_y = height - 70
draw.rounded_rectangle([(20, footer_y), (width - 20, footer_y + 32)], radius=8, fill=(10, 20, 50, 200))
draw.text((30, footer_y + 7), "리스크 0% 시스템으로 여러분의 자산을 지켜드립니다", font=font_tiny, fill=gold_color)

result = Image.alpha_composite(img, overlay)
result = result.convert('RGB')

result.save(output_path, quality=95)
print(f"Image saved to: {output_path}")
