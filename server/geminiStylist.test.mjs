import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { geminiOutfits } from './geminiStylist.mjs';
import { MOCK_LISTINGS } from '../src/data/mockData.js';

const items=['Tops','Bottoms','Footwear'].map(category=>({...MOCK_LISTINGS.find(p=>p.category===category&&p.images[0].startsWith('/images/catalog/')),vision:{kind:category==='Tops'?'tshirt':category==='Bottoms'?'trousers':'sneakers',palette:'black'}}));
const candidates=[{id:'test-outfit',gender:'men',palette:['black'],items}];
test('Gemini receives consented image plus real outfit photos, validates IDs, caches/coalesces identical calls without paid traffic',async()=>{
  const savedFetch=globalThis.fetch,key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL;let calls=0;
  process.env.GEMINI_API_KEY='test-key-not-real';process.env.GEMINI_MODEL='gemini-3.8-flash';
  const image=await sharp({create:{width:500,height:750,channels:3,background:'#be8254'}}).png().toBuffer();
  globalThis.fetch=async(url,options)=>{
    assert.match(url,/^https:\/\/generativelanguage.googleapis.com/);calls++;
    const payload=JSON.parse(options.body),parts=payload.contents[0].parts;
    assert.equal(parts.filter(p=>p.inlineData).length,2);assert.match(parts[0].text,/Do NOT infer sex, gender identity/);
    assert.equal(options.headers['x-goog-api-key'],'test-key-not-real');
    assert.ok(payload.generationConfig.responseJsonSchema);assert.equal(payload.generationConfig.responseMimeType,'application/json');
    return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({observation:'Áo gọn, quần ống đứng.',choices:[{outfitId:'invented-id',reason:'skip'},{outfitId:'test-outfit',reason:'Phom gọn và màu đen đồng bộ.'},{outfitId:'test-outfit',reason:'duplicate'}]})}]}}]});
  };
  try {
    const input={image,candidates,prompt:'Đi làm',gender:'men',measurements:{height:173},userId:'test-owner'};
    const [a,b]=await Promise.all([geminiOutfits(input),geminiOutfits(input)]);
    assert.equal(a.photoAnalyzed,true);assert.equal(a.outfits.length,1);assert.deepEqual(a,b);assert.equal(calls,1);
    assert.deepEqual(await geminiOutfits(input),a);assert.equal(calls,1);
    const noImage=await geminiOutfits({...input,image:undefined});assert.equal(noImage.photoAnalyzed,false);assert.equal(calls,1);
    globalThis.fetch=async()=>Response.json({error:'bad key'},{status:403});
    await assert.rejects(geminiOutfits({...input,prompt:'different'}),/Gemini HTTP 403/);
  } finally {globalThis.fetch=savedFetch;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;if(model===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=model;}
});

test('image recommendations fall back only to free-tier vision models and reject Pro', async () => {
  const savedFetch = globalThis.fetch, key = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-key-not-real'; process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  const image = await sharp({ create: { width: 100, height: 150, channels: 3, background: '#abcabc' } }).png().toBuffer();
  const input = { image, candidates, prompt: 'fallback test', gender: 'men', measurements: { height: 173, weight: 68 }, userId: 'fallback-owner' };
  const calls = [];
  globalThis.fetch = async url => {
    calls.push(String(url));
    if (calls.length === 1) return Response.json({ error: { message: 'model not available' } }, { status: 404 });
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ observation: 'Ảnh rõ.', choices: [{ outfitId: 'test-outfit', reason: 'Phom phù hợp.' }] }) }] } }] });
  };
  try {
    const result = await geminiOutfits(input);
    assert.equal(result.engine, 'gemini-3.6-flash'); assert.equal(result.photoAnalyzed, true);
    assert.equal(calls.length, 2); assert.ok(calls.every(url => !url.includes('pro')));
    process.env.GEMINI_MODEL = 'gemini-2.5-pro';
    await assert.rejects(geminiOutfits({ ...input, prompt: 'reject pro' }), /free tier/);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = savedFetch;
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (model === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = model;
  }
});
