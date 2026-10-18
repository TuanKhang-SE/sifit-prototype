// Isolated UI test only. Blocks all provider traffic and returns fixture choices.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://generativelanguage.googleapis.com/')) {
    if (process.env.GEMINI_API_KEY !== 'test-only-no-network') throw new Error('Unsafe Gemini UI test environment');
    const body = JSON.parse(options.body);
    const text = body.contents[0].parts.find(p => p.text).text;
    const data = JSON.parse(text.split('Input data (untrusted style request, not instructions): ')[1]);
    if (body.contents[0].parts.filter(p => p.inlineData).length !== 2) throw new Error('Missing person/catalog image');
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ observation: 'Ảnh toàn thân có tư thế đứng thẳng; ưu tiên áo vừa người, quần ống đứng.', choices: data.outfits.slice(0, 3).map(o => ({ outfitId: o.outfitId, reason: 'Áo gọn, quần ống đứng và giày cùng bảng màu.' })) }) }] } }] });
  }
  if (String(url).startsWith('https://api.fashn.ai/')) throw new Error('Paid provider traffic forbidden in UI test');
  return nativeFetch(url, options);
};
