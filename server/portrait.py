"""Keep original pixels, center the foreground and place it on a white plinth."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

WIDTH, HEIGHT = 864, 1296


def compose_portrait(cutout, face_box=None, background=None, decor=None, foot_ratio=None, apply_mask=True):
    cutout = cutout.convert('RGBA')
    alpha = np.asarray(cutout.getchannel('A')).copy()
    labels, count = ndimage.label(alpha > 24)
    if not count:
        raise ValueError('No foreground found. Choose a clearer full-body photo.')
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    main = labels == sizes.argmax()
    # Remove isolated background remnants; retain soft edges around the subject.
    keep = ndimage.binary_dilation(main, iterations=4)
    alpha[~keep] = 0
    cutout.putalpha(Image.fromarray(alpha))
    bounds = Image.fromarray(np.where(alpha > 24, 255, 0).astype('uint8')).getbbox()
    left, top, right, bottom = bounds
    if right - left < 20 or bottom - top < 40:
        raise ValueError('Foreground too small.')
    crop = cutout.crop(bounds)
    baseline = round(foot_ratio * 1672 * max(WIDTH / 941, HEIGHT / 1672)) if background and foot_ratio else 1134
    scale = min((470 if background or decor else 650) / crop.width, (baseline - 110) / crop.height)
    size = (round(crop.width * scale), round(crop.height * scale))
    x, y = (WIDTH - size[0]) // 2, baseline - size[1]
    subject = crop.resize(size, Image.Resampling.LANCZOS)

    canvas = ImageOps.fit(Image.open(background).convert('RGBA'), (WIDTH, HEIGHT), centering=(0.5, 0)) if background else Image.new('RGBA', (WIDTH, HEIGHT), 'white')
    shadow = Image.new('RGBA', canvas.size)
    ImageDraw.Draw(shadow).ellipse((120, 1202, 744, 1252), fill=(80, 85, 80, 32))
    if not background:
        canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(20)))
    # Supersampled cylinder: softly shaded white side and white circular top.
    stage = Image.new('RGBA', (WIDTH * 3, HEIGHT * 3))
    draw = ImageDraw.Draw(stage)
    box = lambda coords: tuple(round(v * 3) for v in coords)
    draw.ellipse(box((142, 1134, 722, 1242)), fill='#e8e9e6')
    draw.rectangle(box((142, 1140, 722, 1188)), fill='#ededeb')
    draw.ellipse(box((142, 1086, 722, 1194)), fill='white', outline='#dedfdb', width=3)
    if not background:
        canvas.alpha_composite(stage.resize(canvas.size, Image.Resampling.LANCZOS))
    if decor:
        canvas.alpha_composite(ImageOps.fit(Image.open(decor).convert('RGBA'), canvas.size, centering=(0.5, 0)))
    contact = Image.new('RGBA', canvas.size)
    ImageDraw.Draw(contact).ellipse((WIDTH / 2 - min(size[0] / 3, 120), baseline - 14, WIDTH / 2 + min(size[0] / 3, 120), baseline + 13), fill=(65, 70, 65, 28))
    canvas.alpha_composite(contact.filter(ImageFilter.GaussianBlur(9)))
    canvas.alpha_composite(subject, (x, y))
    transformed = None
    if face_box:
        transformed = {
            'x': (x + (face_box['x'] * cutout.width - left) * scale) / WIDTH,
            'y': (y + (face_box['y'] * cutout.height - top) * scale) / HEIGHT,
            'width': face_box['width'] * cutout.width * scale / WIDTH,
            'height': face_box['height'] * cutout.height * scale / HEIGHT,
        }
        if apply_mask:
            mask_face(canvas, transformed)
    return canvas.convert('RGB'), transformed


def mask_face(image, box):
    x, y = box['x'] * image.width, box['y'] * image.height
    w, h = box['width'] * image.width, box['height'] * image.height
    mask = Image.new('L', image.size)
    ImageDraw.Draw(mask).ellipse((x, y, x + w, y + h), fill=255)
    blurred = image.filter(ImageFilter.GaussianBlur(max(8, w / 5)))
    image.paste(blurred, (0, 0), mask)
