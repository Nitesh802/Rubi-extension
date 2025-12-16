#!/usr/bin/env python3
"""
Generate placeholder icons for Rubi Browser Extension
Requires: Pillow (pip install Pillow)
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    exit(1)

import os

# Icon sizes
SIZES = [16, 48, 128]
OUTPUT_DIR = "assets/icons"

# Colors
BG_COLOR = (102, 126, 234)  # Purple gradient start (#667eea)
TEXT_COLOR = (255, 255, 255)

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

for size in SIZES:
    # Create image with purple background
    img = Image.new('RGB', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Draw a simple "R" in the center
    try:
        # Try to use a default font
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()

    # Draw "R" in center
    text = "R"

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    position = ((size - text_width) // 2, (size - text_height) // 2 - bbox[1])
    draw.text(position, text, fill=TEXT_COLOR, font=font)

    # Save icon
    output_path = f"{OUTPUT_DIR}/icon{size}.png"
    img.save(output_path, "PNG")
    print(f"Created {output_path}")

print("\nIcons created successfully!")
print("You can now load the extension in Chrome.")
