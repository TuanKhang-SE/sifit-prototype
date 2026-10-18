"""Import single-item retailer photos for the noncommercial SiFit demo.
Keep original backgrounds; no foreground extraction, artificial ageing or outfits.
The reviewed manifest makes subsequent downloads reproducible.
"""
import json, hashlib, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
from PIL import Image, ImageOps, ImageDraw

manifest = Path('src/data/everydayCatalog.json')
cache = Path('artifacts/stylist/everyday-source'); cache.mkdir(parents=True, exist_ok=True)
out = Path('public/images/catalog'); out.mkdir(parents=True, exist_ok=True)

refresh = '--refresh' in sys.argv
if manifest.exists() and not refresh:
    candidates = json.loads(manifest.read_text(encoding='utf-8'))
else:
    candidates=[]
    existing = {p['source']['url'] for p in json.loads(Path('src/data/mensCatalog.json').read_text(encoding='utf-8'))}
    counts={}
    targets={('Men','Tshirts'):18,('Men','Shorts'):35,('Men','Trousers'):35,('Women','Tshirts'):12,('Women','Shorts'):15,('Women','Trousers'):15}
    import pyarrow.parquet as pq
    table=cache/'metadata.parquet'
    if not table.exists():
        r=requests.get('https://huggingface.co/datasets/mecha2019/fashion-product-images-small/resolve/main/data/train-00000-of-00001.parquet',timeout=90);r.raise_for_status();table.write_bytes(r.content)
    metadata=pq.read_table(table).to_pylist()
    for p in metadata:
        if p['id'] in {54924,54925,41695,10053,27883,57138}:continue  # reviewed: underwear, multipack, incorrect garment labels
        key=(p['gender'],p['articleType'])
        if key not in targets or counts.get(key,0)>=targets[key]+10:continue
        link=p['image'].strip('"').replace('http:','https:')
        if link in existing:continue
        title=p['productDisplayName'] or ''
        if any(word in title.lower() for word in ['pack','set of','combo','bundle','suit','leggings','capri','track']):continue
        candidates.append(dict(_id=f"everyday_{p['id']}",title={'Tshirts':'Áo thun','Shorts':'Quần short','Trousers':'Quần tây'}[p['articleType']]+(' nam' if p['gender']=='Men' else ' nữ')+' · '+title,category='Tops' if p['articleType']=='Tshirts' else 'Bottoms',gender='men' if p['gender']=='Men' else 'women',color=p['baseColour'],garmentPhotoType='auto',images=[f"/images/catalog/everyday-{p['id']}.webp"],source=dict(platform='Myntra / Fashion Product Images',url=link,originalTitle=title,articleType=p['articleType'],processing='Original background retained; resize and WebP encoding only',dataset='https://huggingface.co/datasets/mecha2019/fashion-product-images-small')))
        counts[key]=counts.get(key,0)+1
    print('Candidates',len(candidates),counts,flush=True)

def download(p):
    try:
        raw=cache/(p['_id']+'.jpg')
        if not raw.exists():
            r=requests.get(p['source']['url'],timeout=35);r.raise_for_status();raw.write_bytes(r.content)
        image=ImageOps.exif_transpose(Image.open(raw)).convert('RGB')
        if min(image.size)<400:return None
        p['imageHash']=hashlib.sha256(raw.read_bytes()).hexdigest()
        image.thumbnail((1200,1600),Image.Resampling.LANCZOS)
        image.save(out/(p['images'][0].split('/')[-1]),'WEBP',quality=95)
        return p
    except Exception as e:
        print('Skipped',p['_id'],type(e).__name__,flush=True);return None

items=[p for p in ThreadPoolExecutor(10).map(download,candidates) if p]
if not manifest.exists() or refresh:
    counts={};selected=[];seen=set()
    for p in items:
        key=('Men' if p['gender']=='men' else 'Women',p['source']['articleType'])
        if counts.get(key,0)>=targets[key] or p['imageHash'] in seen:continue
        selected.append(p);seen.add(p['imageHash']);counts[key]=counts.get(key,0)+1
    items=selected
manifest.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for batch in range((len(items)+39)//40):
    page=Image.new('RGB',(1200,8*240),'#f1f1ed');draw=ImageDraw.Draw(page)
    for i,p in enumerate(items[batch*40:(batch+1)*40]):
        photo=Image.open(out/p['images'][0].split('/')[-1]);thumb=ImageOps.contain(photo,(230,205))
        x=(i%5)*240;y=(i//5)*240;page.paste(thumb,(x,y));draw.text((x,y+208),p['_id']+' '+p['source']['articleType'],fill='black')
    page.save(cache/f'review-{batch}.jpg')
print('Imported',len(items),flush=True)
