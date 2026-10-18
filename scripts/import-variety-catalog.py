"""Curated retailer images: diversify the demo without generating clothing.
Existing source manifests and owner photos are kept; this imports new references.
Run without flags to reproduce the checked-in selection, --refresh to review anew.
"""
import json, hashlib, sys, random
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
from PIL import Image, ImageOps, ImageDraw

manifest=Path('src/data/varietyCatalog.json')
cache=Path('artifacts/stylist/variety-source');cache.mkdir(parents=True,exist_ok=True)
output=Path('public/images/catalog');output.mkdir(parents=True,exist_ok=True)
targets={('Men','Shirts'):18,('Men','Sweaters'):10,('Men','Sweatshirts'):8,('Men','Jackets'):10,('Men','Jeans'):14,('Women','Dresses'):16,('Women','Skirts'):12,('Women','Shirts'):12,('Women','Jackets'):8,('Women','Sweaters'):6,('Women','Handbags'):6}
labels={'Shirts':'Áo sơ mi','Sweaters':'Áo len','Sweatshirts':'Áo sweatshirt','Jackets':'Áo khoác','Jeans':'Quần jeans','Dresses':'Váy liền','Skirts':'Chân váy','Handbags':'Túi xách'}
refresh='--refresh' in sys.argv
if manifest.exists() and not refresh:
    candidates=json.loads(manifest.read_text(encoding='utf-8'))
else:
    import pyarrow.parquet as pq
    metadata=pq.read_table('artifacts/stylist/everyday-source/metadata.parquet').to_pylist()
    random.Random(20261013).shuffle(metadata)
    existing=set()
    for filename in ['importedCatalog','mensCatalog','everydayCatalog']:
        for p in json.loads(Path(f'src/data/{filename}.json').read_text(encoding='utf-8')):
            if p.get('source',{}).get('url'):existing.add(p['source']['url'])
    excluded={26794,28455,6783,23150,39385,23488,31317}  # reviewed: folded shirt, mislabelled garment types
    if (cache/'excluded.json').exists():excluded.update(json.loads((cache/'excluded.json').read_text()))
    candidates=[];counts={};titles=set()
    for p in metadata:
        key=(p['gender'],p['articleType']);title=p['productDisplayName'] or ''
        if key not in targets or counts.get(key,0)>=targets[key]+5 or p['id'] in excluded:continue
        source=p['image'].strip('"').replace('http:','https:')
        if source in existing or title in titles or any(word in title.lower() for word in ['pack of','set of','combo','bundle','pyjama','nightdress','kids','boys','girls','folded']):continue
        category='Bottoms' if key[1] in ['Jeans','Skirts','Dresses'] else 'Outerwear' if key[1] in ['Jackets','Sweatshirts'] else 'Accessories' if key[1]=='Handbags' else 'Tops'
        candidates.append(dict(_id=f"variety_{p['id']}",title=labels[key[1]]+(' nam' if key[0]=='Men' else ' nữ')+' · '+title,category=category,gender='men' if key[0]=='Men' else 'women',color=p['baseColour'],garmentPhotoType='auto',images=[f"/images/catalog/variety-{p['id']}.webp"],source=dict(platform='Myntra / Fashion Product Images',url=source,originalTitle=title,articleType=key[1],processing='Original background retained; resize and WebP encoding only',dataset='https://huggingface.co/datasets/mecha2019/fashion-product-images-small')))
        counts[key]=counts.get(key,0)+1;titles.add(title)

def download(p):
    try:
        original=cache/(p['_id']+'.jpg')
        if not original.exists():
            r=requests.get(p['source']['url'],timeout=35);r.raise_for_status();original.write_bytes(r.content)
        image=ImageOps.exif_transpose(Image.open(original)).convert('RGB')
        if min(image.size)<400:return None
        p['imageHash']=hashlib.sha256(original.read_bytes()).hexdigest()
        image.thumbnail((1200,1600),Image.Resampling.LANCZOS)
        image.save(output/p['images'][0].split('/')[-1],'WEBP',quality=95)
        return p
    except Exception as e:print('Skipped',p['_id'],type(e).__name__,flush=True);return None

items=[p for p in ThreadPoolExecutor(10).map(download,candidates) if p]
if not manifest.exists() or refresh:
    buckets={key:[] for key in targets};seen=set()
    for p in items:
        key=('Men' if p['gender']=='men' else 'Women',p['source']['articleType'])
        if len(buckets[key])>=targets[key] or p['imageHash'] in seen:continue
        buckets[key].append(p);seen.add(p['imageHash'])
    items=[]
    while any(buckets.values()):
        for bucket in buckets.values():
            if bucket:items.append(bucket.pop(0))
manifest.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for batch in range((len(items)+39)//40):
    page=Image.new('RGB',(1200,8*240),'#f2f2ef');draw=ImageDraw.Draw(page)
    for i,p in enumerate(items[batch*40:(batch+1)*40]):
        image=ImageOps.contain(Image.open(output/p['images'][0].split('/')[-1]),(230,200));x=i%5*240;y=i//5*240;page.paste(image,(x,y));draw.text((x,y+205),p['_id']+' '+p['source']['articleType'],fill='black')
    page.save(cache/f'review-{batch}.jpg')
print('Imported',len(items),flush=True)
