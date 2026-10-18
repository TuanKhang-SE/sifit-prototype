let detectorPromise;
export function clampFaceBox(box) {
  const width = Math.max(0.035, Math.min(0.4, box.width));
  const height = Math.max(0.035, Math.min(0.35, box.height));
  return { x: Math.max(0, Math.min(1 - width, box.x)), y: Math.max(0, Math.min(1 - height, box.y)), width, height };
}
export async function detectFace(file, photoMode = 'remove') {
  if (!detectorPromise) detectorPromise = (async () => {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks('/vision/wasm');
    return FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: '/vision/face-detector.tflite', delegate: 'CPU' }, runningMode: 'IMAGE', minDetectionConfidence: 0.35 });
  })().catch(error => { detectorPromise = null; throw error; });
  const detector = await detectorPromise;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    let detections = detector.detect(bitmap).detections;
    let offsetX = 0, offsetY = 0;
    // Full-body photos have very small faces. A crop of the upper body gives
    // the short-range detector a useful face size without asking for alignment.
    if (!detections.length) {
      offsetX = Math.round(bitmap.width * .12);
      const crop = await createImageBitmap(bitmap, offsetX, 0, Math.round(bitmap.width * .76), Math.round(bitmap.height * .45));
      try { detections = detector.detect(crop).detections; } finally { crop.close(); }
    }
    if (!detections.length) return null;
    const faces = detections.filter(d => d.boundingBox).sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height);
    const best = faces[0];
    const face = best?.boundingBox;
    if (!face) return null;
    const scale = Math.min(864 / bitmap.width, 1296 / bitmap.height);
    const left = (864 - bitmap.width * scale) / 2, top = (1296 - bitmap.height * scale) / 2;
    // Keep the detector's full face box: a nose-centered oval can expose an eye
    // on tilted faces. A small margin covers features on both sides.
    const x = offsetX + face.originX - face.width * 0.05, y = offsetY + face.originY - face.height * 0.04;
    const width = face.width * 1.1, height = face.height * 1.08;
    if (photoMode === 'original') return clampFaceBox({ x: x / bitmap.width, y: y / bitmap.height, width: width / bitmap.width, height: height / bitmap.height });
    return clampFaceBox({ x: (left + x * scale) / 864, y: (top + y * scale) / 1296, width: width * scale / 864, height: height * scale / 1296 });
  } finally { bitmap.close(); }
}

export async function detectSavedFace(id) {
  const response = await fetch(`/api/stylist/images/${id}?unmasked=true`, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Không tải được ảnh để nhận diện mặt.');
  try { const box = await detectFace(await response.blob(), 'original'); if (box) return box; } catch { /* Local backend detector is the fallback. */ }
  const fallback = await fetch(`/api/stylist/images/${id}/detect-face`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', credentials: 'same-origin' });
  if (!fallback.ok) return null;
  return (await fallback.json()).faceBox;
}
