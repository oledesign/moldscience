(() => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reduceMotion || window.innerWidth < 768) return;

  const band = document.querySelector('[data-spore-drift]');
  const canvas = band?.querySelector('.spore-drift');
  if (!band || !canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const particleCount = 36;
  let width = 0;
  let height = 0;
  let running = false;
  let frameId = 0;
  let lastTime = 0;
  let particles = [];

  const makeParticle = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 1 + Math.random() * 1.5,
    alpha: .03 + Math.random() * .05,
    speed: 10 + Math.random() * 10,
    angle: Math.random() * Math.PI * 2,
    phase: Math.random() * Math.PI * 2,
    wobble: .4 + Math.random() * .8
  });

  const resize = () => {
    const rect = band.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: particleCount }, makeParticle);
  };

  const draw = (time) => {
    if (!running) return;
    const delta = Math.min((time - lastTime) / 1000 || 0, .05);
    lastTime = time;
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.phase += delta * particle.wobble;
      particle.x += (Math.cos(particle.angle) * particle.speed + Math.sin(particle.phase) * 3) * delta;
      particle.y += (Math.sin(particle.angle) * particle.speed + Math.cos(particle.phase) * 2) * delta;

      if (particle.x < -4) particle.x = width + 4;
      if (particle.x > width + 4) particle.x = -4;
      if (particle.y < -4) particle.y = height + 4;
      if (particle.y > height + 4) particle.y = -4;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(142,180,46,${particle.alpha})`;
      context.fill();
    });

    frameId = requestAnimationFrame(draw);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = performance.now();
    frameId = requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  resize();
  new ResizeObserver(resize).observe(band);
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
    else stop();
  }, { threshold: .05 }).observe(band);
})();
