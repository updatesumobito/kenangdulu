export type CameraFacing = 'user' | 'environment';

// Ask the device/browser, never infer sensor resolution from a phone model.
export async function openCamera(facing: CameraFacing, audio = false) {
 if (!navigator.mediaDevices?.getUserMedia) throw Error('Kamera memerlukan HTTPS atau localhost.');
 let stream: MediaStream;
 const edge = audio ? 3840 : 4096;
 const size = {width: {ideal: edge, max: edge}, height: {ideal: edge, max: edge}};
 try {
  stream = await navigator.mediaDevices.getUserMedia({video: {...size, facingMode: {exact: facing}}, audio});
 } catch (error) {
  if (!(error instanceof DOMException) || !['OverconstrainedError','NotFoundError'].includes(error.name)) throw error;
  stream = await navigator.mediaDevices.getUserMedia({video: {...size, facingMode: {ideal: facing}}, audio});
 }
 return stream;
}
