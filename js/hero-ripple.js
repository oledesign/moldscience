// Liquid hero — a restrained WebGL warp over the attic hero image.
//
// Canvas UI's Ripple/Liquid components render HTML onto a canvas via an
// experimental Chrome-only API. That would leave most contractors on other
// browsers seeing nothing, so this reproduces the same feel with plain WebGL on
// the hero photo: a slow ambient swell plus a soft lens that trails the pointer.
//
// Progressive enhancement throughout: the section keeps its CSS background
// image, and the canvas only fades in once the texture and GL context are both
// ready. No WebGL, no image, or prefers-reduced-motion means nothing happens.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // every photo hero gets the treatment; each runs its own independent context
  document.querySelectorAll('.hero-attic, .hero-photo').forEach(setup);

  function setup(host) {

  // pull the image out of the section's own background so the CSS stays the source of truth
  const bg = getComputedStyle(host).backgroundImage;
  const match = bg && bg.match(/url\(["']?(.+?)["']?\)/);
  if (!match) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-ripple__canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const gl =
    canvas.getContext('webgl', { alpha: false, antialias: false, depth: false }) ||
    canvas.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) return;

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2  u_res;
    uniform vec2  u_tex;      // natural texture size, for cover-fitting
    uniform vec2  u_mouse;    // eased pointer, in pixels
    uniform float u_time;
    uniform float u_hover;    // 0..1 pointer presence
    uniform sampler2D u_image;

    void main() {
      vec2 frag = gl_FragCoord.xy;
      vec2 uv = frag / u_res;
      uv.y = 1.0 - uv.y;

      // replicate background-size: cover
      float rCanvas = u_res.x / u_res.y;
      float rTex    = u_tex.x / u_tex.y;
      vec2 scale = rCanvas > rTex ? vec2(1.0, rTex / rCanvas) : vec2(rCanvas / rTex, 1.0);
      vec2 cover = (uv - 0.5) * scale + 0.5;

      // ambient swell — two slow crossing waves, deliberately tiny
      float swell = sin(cover.x * 5.5 + u_time * 0.22) * cos(cover.y * 4.2 - u_time * 0.17);
      vec2 offset = vec2(swell) * 0.0035;

      // soft lens trailing the pointer
      vec2 m = u_mouse / u_res;
      m.y = 1.0 - m.y;
      vec2 toMouse = (cover - m) * vec2(rCanvas, 1.0);
      float d = length(toMouse);
      float lens = exp(-d * 5.0) * u_hover;
      offset += normalize(toMouse + 1e-5) * lens * -0.018;
      offset += vec2(sin(u_time * 0.9 + d * 12.0)) * lens * 0.002;

      vec3 color = texture2D(u_image, cover + offset).rgb;
      // a whisper of lift where the lens sits, so it reads as glass not smear
      color += lens * 0.05;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(prog, 'u_res'),
    tex: gl.getUniformLocation(prog, 'u_tex'),
    mouse: gl.getUniformLocation(prog, 'u_mouse'),
    time: gl.getUniformLocation(prog, 'u_time'),
    hover: gl.getUniformLocation(prog, 'u_hover'),
    image: gl.getUniformLocation(prog, 'u_image'),
  };

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = match[1];

  img.onload = function () {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(u.image, 0);
    gl.uniform2f(u.tex, img.naturalWidth, img.naturalHeight);

    host.classList.add('hero-ripple');
    host.insertBefore(canvas, host.firstChild);
    // one frame later so the fade-in actually transitions
    requestAnimationFrame(() => canvas.classList.add('is-ready'));

    let w = 0;
    let h = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
    }
    resize();

    let target = [w * 0.5, h * 0.45];
    const eased = target.slice();
    let hover = 0;
    let hoverTarget = 0;

    host.addEventListener(
      'pointermove',
      (e) => {
        const rect = host.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        target = [(e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr];
        hoverTarget = e.pointerType === 'touch' ? 0 : 1;
      },
      { passive: true }
    );
    host.addEventListener('pointerleave', () => { hoverTarget = 0; }, { passive: true });

    let running = true;
    const io = new IntersectionObserver(
      (entries) => {
        running = entries[0].isIntersecting;
        if (running) requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    io.observe(host);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    const start = performance.now();
    function frame(now) {
      if (!running) return;
      // ease the pointer so the lens has weight instead of snapping
      eased[0] += (target[0] - eased[0]) * 0.075;
      eased[1] += (target[1] - eased[1]) * 0.075;
      hover += (hoverTarget - hover) * 0.06;

      gl.uniform2f(u.mouse, eased[0], eased[1]);
      gl.uniform1f(u.hover, hover);
      gl.uniform1f(u.time, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    };
  }
})();
