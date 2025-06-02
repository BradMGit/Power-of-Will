let audio = null;
let interval = null;
let currentIndex = 0;
let mouthCues = [];

let baseImage = new Image();
let isBaseLoaded = false;

const mouthShapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const mouthImages = {};
let loadedImages = 0;

// Preload base image
baseImage.src = '/static/assets/img/will_cat.png';
baseImage.onload = () => {
  isBaseLoaded = true;
  loadedImages++;
  checkAllImagesLoaded();
};

// Preload mouth shape images
mouthShapes.forEach(shape => {
  const img = new Image();
  img.src = `/static/mouth_shapes/${shape}.png`;
  img.onload = () => {
    loadedImages++;
    checkAllImagesLoaded();
  };
  mouthImages[shape] = img;
});

// Draws cat + mouth (default A) once all images are loaded
function checkAllImagesLoaded() {
  if (loadedImages === mouthShapes.length + 1) {
    const canvas = document.getElementById('canvas-featured');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, 400, 400);
    ctx.drawImage(mouthImages['A'], -60, 20, 420, 240); // Draw neutral mouth
    console.log("✅ All images loaded and base + A drawn");
  }
}

function drawFrame(phoneme, ctx, canvas) {
  const mouth = mouthImages[phoneme.toUpperCase()];
  if (!isBaseLoaded || !mouth) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0, 400, 400);
  ctx.drawImage(mouth, -60, 20, 420, 240);
}

function updateFrame(ctx, canvas) {
  const now = audio.currentTime;

  while (
    currentIndex < mouthCues.length - 1 &&
    now >= mouthCues[currentIndex + 1].start
  ) {
    currentIndex++;
  }

  const phoneme = mouthCues[currentIndex].value;
  drawFrame(phoneme, ctx, canvas);
}

function playLipSync(jsonPath, audioPath, canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      mouthCues = data.mouthCues;
      currentIndex = 0;

      console.log("🟢 Loaded mouthCues:", mouthCues);

      if (!audio) {
        audio = new Audio(audioPath);
      }

      audio.addEventListener('ended', () => clearInterval(interval));
      audio.play();

      interval = setInterval(() => {
        if (!audio.paused && !audio.ended) {
          updateFrame(ctx, canvas);
        }
      }, 60);
    })
    .catch(err => console.error("❌ JSON or audio error:", err));
}

function pauseLipSync() {
  if (audio && !audio.paused) {
    audio.pause();
    clearInterval(interval);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas-featured');
  const ctx = canvas.getContext('2d');

  if (isBaseLoaded && mouthImages['A']) {
    ctx.drawImage(baseImage, 0, 0, 400, 400);
    ctx.drawImage(mouthImages['A'], -60, 20, 420, 240);
  }
});
