import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded rectangle (YouTube red / gradient feel)
    radius = int(size * 0.22)
    # Background badge
    bg_color = (255, 0, 51, 255) # YouTube Red
    
    # Draw rounded rect
    margin = int(size * 0.05)
    draw.rounded_rectangle(
        [(margin, margin), (size - margin, size - margin)],
        radius=radius,
        fill=bg_color
    )
    
    # Draw subtle gradient overlay / highlight
    highlight_color = (255, 60, 90, 255)
    draw.rounded_rectangle(
        [(margin + 1, margin + 1), (size - margin - 1, int(size * 0.45))],
        radius=int(radius * 0.8),
        fill=highlight_color
    )
    
    # Play triangle with AI sparkles or chat bubble shape
    # Center white play triangle
    cx = size * 0.5
    cy = size * 0.5
    pw = size * 0.35
    ph = size * 0.4
    
    p1 = (cx - pw * 0.35, cy - ph * 0.5)
    p2 = (cx - pw * 0.35, cy + ph * 0.5)
    p3 = (cx + pw * 0.5, cy)
    
    draw.polygon([p1, p2, p3], fill=(255, 255, 255, 255))
    
    # Small sparkle / chat dot on top right
    dot_r = max(2, int(size * 0.09))
    dot_cx = int(size * 0.78)
    dot_cy = int(size * 0.25)
    draw.ellipse(
        [(dot_cx - dot_r, dot_cy - dot_r), (dot_cx + dot_r, dot_cy + dot_r)],
        fill=(255, 230, 0, 255), # Gold accent
        outline=(255, 255, 255, 255),
        width=max(1, int(size * 0.02))
    )
    
    return img

os.makedirs('extension/icons', exist_ok=True)
for s in [16, 48, 128]:
    icon = create_icon(s)
    icon.save(f'extension/icons/icon{s}.png')
    print(f"Generated icon{s}.png")
