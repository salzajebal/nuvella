from PIL import Image, ImageDraw, ImageFont
import os

base_image_path = "attached_assets/generated_images/clean_crypto_trading_promo_poster.png"
output_path = "attached_assets/generated_images/gimpay_final_korean_ad.png"

img = Image.open(base_image_path)
draw = ImageDraw.Draw(img)

width, height = img.size

font_path = "/nix/store/kp07qs4i2g8bcxdzhfrcz8pd84f2s04y-noto-fonts-cjk-sans-2.004/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc"

font_title = ImageFont.truetype(font_path, 52)
font_subtitle = ImageFont.truetype(font_path, 20)
font_highlight = ImageFont.truetype(font_path, 28)
font_small = ImageFont.truetype(font_path, 16)
font_footer = ImageFont.truetype(font_path, 14)

gold_color = (255, 200, 50)
white_color = (255, 255, 255)
light_blue = (180, 220, 255)

title_text = "김프페이"
draw.text((30, 25), title_text, font=font_title, fill=gold_color)

subtitle_lines = [
    "전세계 코인 프리미엄 시세에",
    "정확하고 신속한 거래체결로",
    "안전한 수익을 만들어드립니다"
]
y_pos = 90
for line in subtitle_lines:
    draw.text((30, y_pos), line, font=font_subtitle, fill=white_color)
    y_pos += 28

highlight_y = y_pos + 10
box_width = 260
box_height = 70
draw.rounded_rectangle([(25, highlight_y), (25 + box_width, highlight_y + box_height)], radius=10, fill=(0, 80, 160))
draw.text((40, highlight_y + 10), "매번 거래시 1.5% 수익", font=font_highlight, fill=gold_color)
draw.text((40, highlight_y + 42), "리스크 0%", font=font_highlight, fill=gold_color)

bottom_section_y = height - 220

info_box_y = bottom_section_y
draw.rounded_rectangle([(25, info_box_y), (width - 25, info_box_y + 55)], radius=8, fill=(30, 40, 70, 220))
info_lines = [
    "코인거래에 대해 모르는분일지라도 고객센터에 문의주시면",
    "거래할수있게 안내도와드립니다"
]
info_y = info_box_y + 10
for line in info_lines:
    draw.text((35, info_y), line, font=font_small, fill=light_blue)
    info_y += 22

notice_y = info_box_y + 65
draw.rounded_rectangle([(25, notice_y), (width - 25, notice_y + 35)], radius=8, fill=(80, 60, 20))
draw.text((35, notice_y + 8), "김프페이는 고객분들께 투자를 권유하지 않습니다", font=font_small, fill=gold_color)

benefit_y = notice_y + 45
draw.rounded_rectangle([(25, benefit_y), (width - 25, benefit_y + 55)], radius=8, fill=(30, 40, 70, 220))
benefit_lines = [
    "✓ 기존 거래소 가입자: 빠르게 많은 수익 가능",
    "✓ 미가입자: 가입안내와 거래정보 모두 공유"
]
by = benefit_y + 10
for line in benefit_lines:
    draw.text((35, by), line, font=font_small, fill=white_color)
    by += 22

footer_y = height - 35
draw.text((30, footer_y), "리스크 0% 시스템으로 여러분의 자산을 지켜드립니다", font=font_footer, fill=gold_color)

img.save(output_path, quality=95)
print(f"Image saved to: {output_path}")
