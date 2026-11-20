// Bounded camera input keeps MindAR's tensors and detector small on Android.
// Constraints are preferences except the upper bounds; no microphone is opened.
export const cameraConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 640, max: 960 }, height: { ideal: 480, max: 960 }, frameRate: { ideal: 30, max: 30 } }
};

export async function startCamera(system, { active, onError }) {
  const video = document.createElement('video'); system.video = video;
  video.autoplay = true; video.muted = true; video.playsInline = true;
  video.setAttribute('playsinline', ''); video.style.cssText = 'position:absolute;top:0;left:0;z-index:-2';
  system.container.append(video);
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
    if (!active()) { stream.getTracks().forEach(t => t.stop()); video.remove(); return; }
    const ready = new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
    });
    video.srcObject = stream;
    await ready;
    if (!active()) { stream.getTracks().forEach(t => t.stop()); video.remove(); return; }
    const track = stream.getVideoTracks()[0];
    if (track?.getCapabilities?.().focusMode?.includes('continuous')) {
      try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* Keep the device's default focus. */ }
    }
    video.setAttribute('width', video.videoWidth); video.setAttribute('height', video.videoHeight);
    await video.play();
    await system._startAR();
  } catch (error) {
    stream?.getTracks().forEach(t => t.stop()); video.remove();
    if (active()) onError(error);
  }
}
