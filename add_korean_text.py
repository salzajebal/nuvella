from PIL import Image, ImageDraw, ImageFont
import os

base_image_path = "attached_assets/generated_images/clean_crypto_trading_promo_poster.png"
output_path = "attached_assets/generated_images/gimpay_final_korean_ad.png"

img = Image.open(base_image_path)
draw = ImageDraw.Draw(img)

width, height = img.size

font_path = "/nix/store/kp07qs4i2g8bcxdzhfrcz8pd84f2s04y-noto-fonts-cjk-sans-2.004/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc"

font_title = ImageFont.truetype(font_path, 60)
font_large = ImageFont.truetype(font_path, 36)
font_medium = ImageFont.truetype(font_path, 24)
font_small = ImageFont.truetype(font_path, 18)
font_highlight = ImageFont.truetype(font_path, 32)

gold_color = (255, 200, 50)
white_color = (255, 255, 255)
light_blue = (180, 220, 255)
dark_overlay = (20, 30, 60, 200)

title_text = "김프페이"
draw.text((35, 40), title_text, font=font_title, fill=gold_color)

headline_lines = [
    "전세계 코인 프리미엄 시세에",
    "정확하고 신속한 거래체결로",
    "안전한 수익을 만들어드립니다"
]
y_pos = 120
for line in headline_lines:
    draw.text((35, y_pos), line, font=font_medium, fill=white_color)
    y_pos += 32

highlight_y = y_pos + 15
box_width = 320
box_height = 90
draw.rounded_rectangle([(30, highlight_y), (30 + box_width, highlight_y + box_height)], radius=12, fill=(0, 80, 160))
draw.text((50, highlight_y + 12), "매번 거래시 1.5% 수익", font=font_highlight, fill=gold_color)
draw.text((50, highlight_y + 52), "리스크 0%", font=font_highlight, fill=gold_color)

info_y = highlight_y + box_height + 20
info_lines = [
    "코인거래에 대해 모르는분일지라도",
    "고객센터에 문의주시면 거래할수있게",
    "안내도와드립니다"
]
for line in info_lines:
    draw.text((35, info_y), line, font=font_small, fill=light_blue)
    info_y += 26

notice_y = info_y + 15
notice_box_height = 35
draw.rounded_rectangle([(30, notice_y), (width - 35, notice_y + notice_box_height)], radius=8, fill=(40, 40, 70))
draw.text((45, notice_y + 7), "김프페이는 투자를 권유하지 않습니다", font=font_small, fill=white_color)

benefit_y = notice_y + notice_box_height + 15
benefit_lines = [
    "✓ 기존 거래소 가입자: 빠른 수익 가능",
    "✓ 미가입자: 가입안내 + 정보 공유"
]
for line in benefit_lines:
    draw.text((35, benefit_y), line, font=font_small, fill=white_color)
    benefit_y += 26

footer_y = height - 50
draw.text((35, footer_y), "리스크 0% 시스템으로 자산을 지켜드립니다", font=font_small, fill=gold_color)

img.save(output_path, quality=95)
print(f"Image saved to: {output_path}")
