
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

// Preload mouth shapes
mouthShapes.forEach(shape => {
  const img = new Image();
  img.src = `/static/mouth_shapes/${shape}.png`;
  img.onload = () => {
    loadedImages++;
    checkAllImagesLoaded();
  };
  mouthImages[shape] = img;
});

function checkAllImagesLoaded() {
  if (loadedImages === mouthShapes.length + 1) {
    const canvas = document.getElementById('canvas-featured');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(baseImage, 0, 0, 400, 400);
  }
}

function drawFrame(phoneme, ctx, canvas) {
  if (!isBaseLoaded || !mouthImages[phoneme]) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0, 400, 400);
  ctx.drawImage(mouthImages[phoneme], -60, 20, 420, 240); // Position adjustment
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
    .then(response => response.json())
    .then(data => {
      mouthCues = data.mouthCues;
      currentIndex = 0;

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
    .catch(error => {
      console.error('Failed to load JSON or audio:', error);
    });
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

  if (isBaseLoaded) {
    ctx.drawImage(baseImage, 0, 0, 400, 400);
  } else {
    baseImage.onload = () => {
      ctx.drawImage(baseImage, 0, 0, 400, 400);
    };
  }
});