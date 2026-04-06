#!/usr/bin/env python3
"""Generate combat effect sprites."""
from PIL import Image, ImageDraw
import os

BASE = "/home/user/mmorpg-farcaster-mini2/assets/effects"

# --- slash.png: 16x16 white diagonal slash ---
img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Draw a few parallel diagonal lines for a slash effect
d.line([(2, 14), (14, 2)], fill=(255, 255, 255, 255), width=2)
d.line([(4, 14), (14, 4)], fill=(200, 220, 255, 220), width=1)
d.line([(1, 12), (12, 1)], fill=(180, 200, 255, 180), width=1)
img.save(os.path.join(BASE, "slash.png"))
print("Created slash.png")

# --- heal.png: 16x16 green cross ---
img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Cross shape - vertical bar
d.rectangle([6, 2, 9, 13], fill=(0, 220, 60, 255))
# Cross shape - horizontal bar
d.rectangle([2, 6, 13, 9], fill=(0, 220, 60, 255))
# Highlight
d.rectangle([7, 3, 8, 4], fill=(150, 255, 150, 200))
img.save(os.path.join(BASE, "heal.png"))
print("Created heal.png")

# --- hit.png: 16x16 orange/red impact star ---
img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# 4-pointed star / impact burst
points = [
    (8, 0), (9, 5), (16, 8), (9, 11),
    (8, 16), (7, 11), (0, 8), (7, 5)
]
d.polygon(points, fill=(255, 120, 30, 255))
# Inner bright center
d.ellipse([5, 5, 10, 10], fill=(255, 240, 150, 255))
img.save(os.path.join(BASE, "hit.png"))
print("Created hit.png")

# --- gold.png: 12x12 gold coin ---
img = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Coin circle
d.ellipse([1, 1, 10, 10], fill=(230, 180, 30, 255))
d.ellipse([1, 1, 10, 10], outline=(180, 130, 10, 255), width=1)
# Dollar sign hint
d.arc([3, 3, 8, 8], 0, 360, fill=(200, 160, 20, 255))
# Shine
d.point((3, 3), fill=(255, 240, 100, 255))
img.save(os.path.join(BASE, "gold.png"))
print("Created gold.png")

# --- item.png: 12x12 purple potion ---
img = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Bottle body
d.rectangle([4, 4, 7, 10], fill=(160, 50, 220, 255))
# Bottle neck
d.rectangle([5, 1, 6, 3], fill=(160, 50, 220, 255))
# Rim
d.rectangle([4, 0, 7, 1], fill=(190, 80, 255, 255))
# Liquid highlight
d.rectangle([5, 5, 5, 8], fill=(200, 100, 255, 255))
# Cap
d.rectangle([4, 3, 7, 4], fill=(200, 80, 80, 255))
img.save(os.path.join(BASE, "item.png"))
print("Created item.png")

print("\nAll sprites generated successfully!")
