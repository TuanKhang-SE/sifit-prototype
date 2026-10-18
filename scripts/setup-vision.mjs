import { cp, mkdir, access, writeFile } from 'node:fs/promises';
await mkdir('public/vision', { recursive: true });
await cp('node_modules/@mediapipe/tasks-vision/wasm', 'public/vision/wasm', { recursive: true });
try { await access('public/vision/face-detector.tflite'); }
catch {
  const response = await fetch('https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite');
  if (!response.ok) throw new Error('Could not download the local face detector');
  await writeFile('public/vision/face-detector.tflite', Buffer.from(await response.arrayBuffer()));
}
console.log('Local face detection assets ready.');
