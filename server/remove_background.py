"""Offline CPU background removal. Warm model cache; no external image service."""
import os
import sys
import json
from PIL import Image
from rembg import new_session, remove
from portrait import compose_portrait

os.environ.setdefault('OMP_NUM_THREADS', '2')
options = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
options = options or {}
session = None if options.get('reuseCutout') else new_session(os.environ.get('REMBG_MODEL', 'birefnet-general-lite'))
image = Image.open(sys.argv[1]).convert('RGBA')
cutout = image if options.get('reuseCutout') else remove(image, session=session, post_process_mask=True)
if options.get('cutoutPath'):
    cutout.save(options['cutoutPath'], 'PNG')
box = options.get('faceBox')
white, transformed = compose_portrait(cutout, box, options.get('backgroundPath'), options.get('decorPath'), options.get('footRatio'), options.get('applyMask', True))
white.save(sys.argv[2], 'PNG')
if len(sys.argv) > 3:
    with open(sys.argv[3], 'w', encoding='utf-8') as output:
        json.dump({'faceBox': transformed, 'composition': 'portrait-v2', 'backgroundId': options.get('backgroundId', 'white')}, output)
