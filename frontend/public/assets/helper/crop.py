from PIL import Image
import os

img_path = r'C:\Users\USER\.gemini\antigravity\brain\6fd5ed7b-20b4-4a1a-9dc1-f9243efe31cc\media__1780574447492.png'
out_dir = r'c:\haemileum\frontend\public\assets\helper'

img = Image.open(img_path)
w, h = img.size
print(f"Original image size: {w}x{h}")

# Define crop boxes: (left, upper, right, lower)
crops = {
    "boy_full": (115, 5, 265, 355),
    "girl_full": (280, 20, 440, 355),
    "boy_happy_icon": (10, 70, 110, 170),
    "boy_think_icon": (10, 185, 110, 285),
    "girl_happy_icon": (440, 70, 540, 170),
    "girl_think_icon": (440, 185, 540, 285)
}

for name, box in crops.items():
    cropped = img.crop(box)
    out_path = os.path.join(out_dir, f"{name}.png")
    cropped.save(out_path)
    print(f"Saved {name} to {out_path} with size {cropped.size}")
