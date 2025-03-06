const config = {
  minSize: 50,
  maxSize: 200,
  count: 15,
  speed: 0.5,
  responsive: true,
};

const background = document.getElementById("background");
let circles = [];

for (let i = 0; i < config.count; i++) {
  createCircle();
}

function createCircle() {
  const circle = document.createElement("div");
  circle.className = "circle";

  //Random size
  const size =
    config.minSize + Math.random() * (config.maxSize - config.minSize);
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;

  //Random position
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;

  //Random direction
  const direction = {
    x: (Math.random() - 0.5) * config.speed,
    y: (Math.random() - 0.5) * config.speed,
  };

  circles.push({
    element: circle,
    size: size,
    x: x,
    y: y,
    direction: direction,
  });

  background.appendChild(circle);
}

function animate() {
  circles.forEach((circle) => {
    circle.x += circle.direction.x;
    circle.y += circle.direction.y;

    if (circle.x < -circle.size / 2) {
      circle.x = -circle.size / 2;
      circle.direction.x *= -1;
    }
    if (circle.x > window.innerWidth + circle.size / 2) {
      circle.x = window.innerWidth + circle.size / 2;
      circle.direction.x *= -1;
    }
    if (circle.y < -circle.size / 2) {
      circle.y = -circle.size / 2;
      circle.direction.y *= -1;
    }
    if (circle.y > window.innerHeight + circle.size / 2) {
      circle.y = window.innerHeight + circle.size / 2;
      circle.direction.y *= -1;
    }

    circle.element.style.left = `${circle.x}px`;
    circle.element.style.top = `${circle.y}px`;
  });
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  if (config.responsive) {
    circles.forEach((circle) => {
      circle.x = Math.random() * window.innerWidth;
      circle.y = Math.random() * window.innerHeight;
      circle.element.style.left = `${circle.x}px`;
      circle.element.style.top = `${circle.y}px`;
    });
  }
});
