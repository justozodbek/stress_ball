let isCurrentlyDragging = false;

const friction = -0.5;
const ball = document.querySelector(".ball");
const ballProps = gsap.getProperty(ball);
const radius = ball.getBoundingClientRect().width / 2;
const tracker = InertiaPlugin.track(ball, "x,y")[0];

let vw = window.innerWidth;
let vh = window.innerHeight;

let lastHitEdge = null;

gsap.defaults({
  overwrite: true
});

gsap.set(ball, {
  xPercent: -50,
  yPercent: -50,
  x: vw / 2,
  y: vh / 2,
  rotation: 0
});

const draggable = new Draggable(ball, {
  bounds: window,
  onPress() {
    gsap.killTweensOf(ball);
    this.update();
    isCurrentlyDragging = true;
  },
  onRelease() {
    isCurrentlyDragging = false;
  },
  onDragEnd: animateBounce,
  onDragEndParams: []
});

window.addEventListener("resize", () => {
  vw = window.innerWidth;
  vh = window.innerHeight;
});

function animateBounce(x = "+=0", y = "+=0", vx = "auto", vy = "auto") {
  const velocityX = tracker.get("x");
  const velocityY = tracker.get("y");

  const velocityMagnitude = Math.sqrt(velocityX ** 2 + velocityY ** 2);
  const direction = velocityX >= 0 ? 1 : -1;
  const angularVelocity = direction * velocityMagnitude * 0.25;

  const currentRotation = ballProps("rotation");

  gsap.to(ball, {
    rotation: currentRotation + angularVelocity,
    duration: 2,
    ease: "power2.out",
    overwrite: false
  });

  gsap.fromTo(
    ball,
    { x, y },
    {
      inertia: {
        x: vx,
        y: vy
      },
      onUpdate: checkBounds,
      overwrite: false
    }
  );
}

function checkBounds() {
  const r = radius;
  let x = ballProps("x");
  let y = ballProps("y");
  let vx = tracker.get("x");
  let vy = tracker.get("y");
  let xPos = x;
  let yPos = y;
  let hitEdge = false;
  let originalVx, originalVy; // To capture velocity before friction

  function squash(axis, velocity) {
    gsap.killTweensOf(ball, "scaleX,scaleY");

    const velocityDivisor = 200;
    const minImpact = 0.01;
    const maxImpact = 0.1;

    const absVelocity = Math.abs(velocity);
    const impact = gsap.utils.clamp(
      minImpact,
      maxImpact,
      absVelocity / velocityDivisor
    );

    const squashScale = 1 - impact * 0.9;
    const stretchScale = 1 + impact * 0.6;

    // Correct axis scaling
    const squashProps =
      axis === "x"
        ? { scaleX: squashScale, scaleY: stretchScale }
        : { scaleX: stretchScale, scaleY: squashScale };

    gsap
      .timeline()
      .to(ball, {
        ...squashProps,
        duration: 0.1,
        ease: "power2.out",
        transformOrigin: "center center",
        overwrite: true
      })
      .to(ball, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: false
      });
  }

  if (x + r > vw) {
    originalVx = vx; // Capture before applying friction
    xPos = vw - r;
    vx *= friction;
    hitEdge = true;
    squash("x", originalVx); // Pass original velocity
  } else if (x - r < 0) {
    originalVx = vx;
    xPos = r;
    vx *= friction;
    hitEdge = true;
    squash("x", originalVx);
  }

  if (y + r > vh) {
    originalVy = vy;
    yPos = vh - r;
    vy *= friction;
    hitEdge = true;
    squash("y", originalVy);
  } else if (y - r < 0) {
    originalVy = vy;
    yPos = r;
    vy *= friction;
    hitEdge = true;
    squash("y", originalVy);
  }

  if (hitEdge) {
    animateBounce(xPos, yPos, vx, vy);
  }
}

document.addEventListener("mouseout", (e) => {
  // Check if mouse left the document to the outside window
  if (e.relatedTarget === null && isCurrentlyDragging && draggable.isDragging) {
    // Get current position and velocity before ending drag
    const x = ballProps("x");
    const y = ballProps("y");
    const vx = tracker.get("x");
    const vy = tracker.get("y");

    // Apply a velocity boost in the direction the mouse was moving
    const boostFactor = 2.0; // Increase boost for more dramatic effect

    // Force end the drag operation
    draggable.endDrag(e);
    isCurrentlyDragging = false;

    // Animate the bounce with boosted velocity
    animateBounce(x, y, vx * boostFactor, vy * boostFactor);
  }
});

// Telegram WebApp integratsiyasi
let tg = window.Telegram.WebApp;

// Telegram ilovasi ishga tushganda
tg.ready();
tg.expand(); // To'liq ekranni egallash

// Foydalanuvchi ma'lumotlarini olish
const user = tg.initDataUnsafe.user;
if (user) {
    console.log("User:", user.first_name, user.last_name);
}

// Telegram tugmalari uchun funksiyalar
document.getElementById('share-btn').addEventListener('click', function() {
    const rotation = gsap.getProperty(ball, "rotation");
    const score = Math.abs(Math.round(rotation / 360));

    tg.showPopup({
        title: "Your Score",
        message: `You've spun the ball ${score} full rotations!`,
        buttons: [{ type: 'ok' }]
    });

    // Do'stlarga ulashish imkoniyati
    tg.sendData(JSON.stringify({
        action: "share_score",
        score: score
    }));
});

document.getElementById('close-btn').addEventListener('click', function() {
    tg.close();
});

// Tema moslamalari
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.style.setProperty('--color-1', '#854ade');
        document.documentElement.style.setProperty('--color-2', '#62596f');
    } else {
        document.documentElement.style.setProperty('--color-1', '#5ea132');
        document.documentElement.style.setProperty('--color-2', '#465040');
    }
}

// Telegram parametrlarini o'qish
const themeParams = tg.themeParams;
if (themeParams.bg_color) {
    applyTheme(themeParams.bg_color === '#212121' ? 'dark' : 'light');
}

// Telegram tugmasi ko'rinishini sozlash
tg.MainButton.setParams({
    text: 'SPIN RECORD: 0',
    color: '#854ade',
    text_color: '#ffffff'
});

// Aylanishlar sonini hisoblash va yangilash
let rotationCount = 0;
let lastRotation = 0;

function updateRotationCounter() {
    const currentRotation = gsap.getProperty(ball, "rotation");
    const fullRotations = Math.floor(Math.abs(currentRotation) / 360);

    if (fullRotations > rotationCount) {
        rotationCount = fullRotations;
        tg.MainButton.setText(`SPIN RECORD: ${rotationCount}`);

        if (rotationCount > 0 && rotationCount % 5 === 0) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
    }

    lastRotation = currentRotation;
    requestAnimationFrame(updateRotationCounter);
}

// Rotation counter ni ishga tushirish
updateRotationCounter();