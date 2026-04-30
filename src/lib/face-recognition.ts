// Polyfill — TEM de estar antes de qualquer import
import { TextEncoder, TextDecoder } from 'util';
globalThis.TextEncoder = TextEncoder as any;
globalThis.TextDecoder = TextDecoder as any;

import * as faceapi from '@vladmandic/face-api';
import * as canvasModule from 'canvas';
import path from 'path';

const { Canvas, Image, ImageData } = canvasModule as any;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelosCarregados = false;

export async function iniciarModelos() {
  if (modelosCarregados) return;
  const modelPath = path.join(process.cwd(), 'public/models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  modelosCarregados = true;
}

export async function compararRostos(fotoCapturadaPath: string, descriptorOriginal: number[]) {
  await iniciarModelos();
  const img = await (canvasModule as any).loadImage(fotoCapturadaPath);
  const deteccao = await faceapi.detectSingleFace(img as any)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!deteccao) return { matches: false, distance: 1 };

  const faceMatcher = new faceapi.FaceMatcher(
    new faceapi.LabeledFaceDescriptors("user", [new Float32Array(descriptorOriginal)]),
    0.5
  );

  const bestMatch = faceMatcher.findBestMatch(deteccao.descriptor);
  return {
    matches: bestMatch.label !== 'unknown',
    distance: bestMatch.distance,
  };
}
