import json,re
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image,ImageOps
# The checked-in manifest is the fixed, visually reviewed selection.
manifest=json.loads(Path('src/data/mensCatalog.json').read_text(encoding='utf-8'))
rows=[dict(id=int(p['_id'].split('_')[1]),articleType=p['source']['articleType'],productDisplayName=p['source']['originalTitle'],link=p['source']['url'],baseColour=p['color']) for p in manifest]
cache=Path('artifacts/stylist/men-source');cache.mkdir(parents=True,exist_ok=True)
Path('public/images/catalog').mkdir(parents=True,exist_ok=True)
def download(p):
 target=cache/f"{p['id']}.jpg"
 if not target.exists():
  with urlopen(p['link'],timeout=60) as response: target.write_bytes(response.read())
list(ThreadPoolExecutor(8).map(download,rows))
items=[];excluded={12369,4943,54924}
names={'Shirts':'Áo sơ mi nam','Tshirts':'Áo thun nam','Jeans':'Quần jeans nam','Trousers':'Quần dài nam','Track Pants':'Quần thể thao nam','Shorts':'Quần short nam','Jackets':'Áo khoác nam','Sweatshirts':'Áo sweatshirt nam','Sweaters':'Áo len nam','Sports Shoes':'Giày thể thao nam','Casual Shoes':'Giày casual nam','Formal Shoes':'Giày tây nam','Sandals':'Sandal nam','Flip Flops':'Dép nam'}
for p in rows:
 if p['id'] in excluded:continue
 kind=p['articleType'];category='Footwear' if 'Shoes' in kind or kind in ['Sandals','Flip Flops'] else 'Bottoms' if kind in ['Jeans','Trousers','Track Pants','Shorts'] else 'Outerwear' if kind in ['Jackets','Sweatshirts'] else 'Tops'
 raw=ImageOps.exif_transpose(Image.open(f"artifacts/stylist/men-source/{p['id']}.jpg")).convert('RGB');raw.thumbnail((1200,1600),Image.Resampling.LANCZOS)
 filename=f"men-{p['id']}.webp";raw.save(Path('public/images/catalog')/filename,'WEBP',quality=95)
 title=re.sub(r'\b(Men|Mens|Man)\b','',p['productDisplayName'],flags=re.I);title=' '.join(title.split())
 items.append(dict(_id=f"men_{p['id']}",title=names[kind]+' · '+title,category=category,gender='men',color=p['baseColour'],garmentPhotoType='model' if category!='Footwear' and p['id']!=30650 and p['id']!=13284 else 'flat-lay',images=[f'/images/catalog/{filename}'],source=dict(platform='Myntra / Fashion Product Images',url=p['link'],dataset='https://huggingface.co/datasets/ashraq/fashion-product-images-small',originalTitle=p['productDisplayName'],articleType=kind,processing='Original background retained; resize and WebP encoding only')))
Path('src/data/mensCatalog.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Added men',len(items))
