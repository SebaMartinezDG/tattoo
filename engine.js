/* Motor de la interfaz AR (lo usan index.html y editor.html). No hace falta editarlo. */
(function () {
  const THREE = AFRAME.THREE;
  const PW = 1.8, PH = 1.0, CW = 1440, CH = 800, U = PW / CW;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function hexRgb(h) {
    h = (h || '#00e5ff').replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function ajustar(c, txt, maxW, size, peso) {
    let s = size;
    do { c.font = peso + ' ' + s + "px 'Segoe UI', system-ui, sans-serif"; s -= 2; }
    while (c.measureText(txt).width > maxW && s > 12);
  }
  function espaciado(c, px) { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; }

  const cache = {};
  function cargarImg(url, sinCache, cb) {
    const key = url + '|' + (sinCache ? 1 : 0);
    let im = cache[key];
    if (im) {
      if (im.complete && im.naturalWidth) cb(im); else im.addEventListener('load', () => cb(im), { once: true });
      return;
    }
    im = new Image(); cache[key] = im;
    im.addEventListener('load', () => cb(im), { once: true });
    im.src = (sinCache && !/^(blob:|data:)/.test(url)) ? url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now() : url;
  }

  window.crearInterfaz = function (target, cfg, opts) {
    opts = opts || {};
    const final = !!opts.final;
    const A = Object.assign({ tipo: 'salir', dur: 1200, easing: 'easeOutCubic', revelar: 1.6, vaiven: true, anillos: true }, cfg.animacion || {});
    const HEX = cfg.acento || '#00e5ff', CYAN = hexRgb(HEX);
    const lado = cfg.lado < 0 ? -1 : 1, dist = +cfg.distancia, alt = +cfg.altura, esc = +cfg.escala || 1;
    const dy = +cfg.desplazY || 0, giro = +cfg.giro || 0, incl = +cfg.inclinacion || 0;
    const X = lado * dist;
    let vivo = true, tFound = final ? -100 : 0, intervalo = null;
    const texturas = [];

    function planoCanvas(parent, o) {
      const canvas = document.createElement('canvas'); canvas.width = o.cw; canvas.height = o.ch;
      const el = document.createElement('a-plane');
      el.setAttribute('width', o.w); el.setAttribute('height', o.h); el.setAttribute('position', o.pos);
      el.setAttribute('material', 'shader: flat; transparent: true; side: double; depthWrite: false');
      if (o.clase) el.classList.add(o.clase);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; texturas.push(tex);
      el.addEventListener('loaded', () => {
        const m = el.getObject3D('mesh'); if (!m) return; m.material.map = tex; m.material.needsUpdate = true;
      });
      parent.appendChild(el);
      return { el, canvas, ctx: canvas.getContext('2d'), tex };
    }

    const grupo = document.createElement('a-entity');
    grupo.setAttribute('scale', esc + ' ' + esc + ' ' + esc);
    grupo.setAttribute('rotation', '0 0 ' + giro);
    target.appendChild(grupo);

    /* Anillos sobre el tatuaje */
    let anillos = null;
    if (A.anillos) {
      anillos = document.createElement('a-entity');
      if (final) anillos.setAttribute('scale', '1 1 1');
      else {
        anillos.setAttribute('scale', '0.01 0.01 0.01');
        anillos.setAttribute('animation__in', 'property: scale; from: 0.01 0.01 0.01; to: 1 1 1; dur: ' + Math.round(A.dur * 0.6) + '; easing: easeOutBack; startEvents: aparecer');
      }
      grupo.appendChild(anillos);
      const anillo = (r, dash, ancho, alfa, g, dur) => {
        const p = planoCanvas(anillos, { w: 1.5, h: 1.5, cw: 512, ch: 512, pos: '0 0 0.02' });
        const c = p.ctx; c.strokeStyle = 'rgba(' + CYAN + ',' + alfa + ')'; c.lineWidth = ancho;
        c.shadowColor = HEX; c.shadowBlur = 12; c.setLineDash(dash);
        c.beginPath(); c.arc(256, 256, r, 0, Math.PI * 2); c.stroke();
        p.el.setAttribute('animation__rot', 'property: rotation; to: 0 0 ' + g + '; dur: ' + dur + '; loop: true; easing: linear');
      };
      anillo(238, [22, 14], 5, 0.95, 360, 14000);
      anillo(212, [80, 50], 3, 0.6, -360, 9000);
    }

    /* Panel: sale del tatuaje y levita */
    let from, fromEsc;
    switch (A.tipo) {
      case 'levantar': from = [X, dy, 0]; fromEsc = 0.3; break;
      case 'caer':     from = [X, dy, 0.9]; fromEsc = 1; break;
      case 'crecer':   from = [X, dy, alt]; fromEsc = 0.01; break;
      default:         from = [0, 0, 0]; fromEsc = 0.05;
    }
    const panelOut = document.createElement('a-entity');
    if (final) {
      panelOut.setAttribute('position', X + ' ' + dy + ' ' + alt);
      panelOut.setAttribute('scale', '1 1 1');
    } else {
      panelOut.setAttribute('position', from.join(' '));
      panelOut.setAttribute('scale', fromEsc + ' ' + fromEsc + ' ' + fromEsc);
      panelOut.setAttribute('animation__pos', 'property: position; from: ' + from.join(' ') + '; to: ' + X + ' ' + dy + ' ' + alt +
        '; dur: ' + A.dur + '; easing: ' + A.easing + '; startEvents: aparecer');
      panelOut.setAttribute('animation__esc', 'property: scale; from: ' + fromEsc + ' ' + fromEsc + ' ' + fromEsc +
        '; to: 1 1 1; dur: ' + Math.round(A.dur * 0.85) + '; easing: ' + A.easing + '; startEvents: aparecer');
    }
    grupo.appendChild(panelOut);
    const panelIn = document.createElement('a-entity');
    panelIn.setAttribute('rotation', incl + ' 0 0');
    if (A.vaiven) panelIn.setAttribute('animation__bob', 'property: position; from: 0 0 0; to: 0 0 0.035; dir: alternate; loop: true; dur: 1800; easing: easeInOutSine');
    panelOut.appendChild(panelIn);

    const card = planoCanvas(panelIn, { w: PW, h: PH, cw: CW, ch: CH, pos: '0 0 0' });

    /* Capa estática */
    const estatico = document.createElement('canvas'); estatico.width = CW; estatico.height = CH;
    const esquina = (c, x, y, dx, dy2) => { c.beginPath(); c.moveTo(x, y + dy2 * 50); c.lineTo(x, y); c.lineTo(x + dx * 50, y); c.stroke(); };
    function dibujarEstatico() {
      const c = estatico.getContext('2d'); c.clearRect(0, 0, CW, CH);
      c.save(); rr(c, 8, 8, CW - 16, CH - 16, 28);
      const g = c.createLinearGradient(0, 0, CW * 0.5, CH);
      g.addColorStop(0, 'rgba(0,44,62,0.60)'); g.addColorStop(1, 'rgba(0,14,24,0.74)');
      c.fillStyle = g; c.fill();
      c.shadowColor = HEX; c.shadowBlur = 22; c.lineWidth = 3; c.strokeStyle = 'rgba(' + CYAN + ',0.85)'; c.stroke();
      c.restore();
      c.save(); rr(c, 8, 8, CW - 16, CH - 16, 28); c.clip();
      c.strokeStyle = 'rgba(' + CYAN + ',0.05)'; c.lineWidth = 1;
      for (let y = 20; y < CH; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(CW, y); c.stroke(); }
      c.restore();
      c.strokeStyle = HEX; c.lineWidth = 5;
      esquina(c, 24, 24, 1, 1); esquina(c, CW - 24, 24, -1, 1); esquina(c, 24, CH - 24, 1, -1); esquina(c, CW - 24, CH - 24, -1, -1);
      const dv = c.createLinearGradient(0, 40, 0, CH - 40);
      dv.addColorStop(0, 'rgba(' + CYAN + ',0)'); dv.addColorStop(0.5, 'rgba(' + CYAN + ',0.8)'); dv.addColorStop(1, 'rgba(' + CYAN + ',0)');
      c.fillStyle = dv; c.fillRect(596, 40, 2, CH - 80);
      const x0 = 620, xr = CW - 50;
      c.textAlign = 'left'; c.fillStyle = 'rgba(' + CYAN + ',0.9)'; c.font = "600 21px 'Segoe UI', system-ui, sans-serif"; espaciado(c, 3);
      c.fillText('ESCANEO COMPLETO · PERFIL ENCONTRADO', x0 + 32, 66); espaciado(c, 0);
      c.save(); c.fillStyle = '#e8fdff'; c.shadowColor = HEX; c.shadowBlur = 16;
      const nombre = cfg.nombre || ''; ajustar(c, nombre, xr - x0, 64, 700); c.fillText(nombre, x0, 168); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.85)'; espaciado(c, 3);
      const rol = (cfg.rol || '').toUpperCase(); ajustar(c, rol, xr - x0, 27, 500); c.fillText(rol, x0 + 2, 218); espaciado(c, 0);
      (cfg.datos || []).slice(0, 4).forEach(([k, v], i) => {
        const y = 310 + i * 56;
        c.strokeStyle = 'rgba(' + CYAN + ',0.22)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x0, y - 34); c.lineTo(xr, y - 34); c.stroke();
        c.textAlign = 'left'; c.fillStyle = 'rgba(' + CYAN + ',0.9)'; c.font = "600 20px 'Segoe UI', system-ui, sans-serif"; espaciado(c, 3);
        c.fillText(k || '', x0, y); espaciado(c, 0);
        c.textAlign = 'right'; c.fillStyle = '#e8fdff'; ajustar(c, v || '', 520, 29, 400); c.fillText(v || '', xr, y);
      });
    }

    /* Cuerpo completo con efecto holograma */
    const BH = 735, BY = 32, BX = 44, PAD = 30;
    let cuerpo = null, BW = 0;
    if (cfg.cuerpo) cargarImg(cfg.cuerpo, opts.sinCache, img => {
      if (!vivo) return;
      BW = Math.round(BH * img.width / img.height);
      const o = document.createElement('canvas'); o.width = BW + PAD * 2; o.height = BH + PAD * 2;
      const c = o.getContext('2d');
      c.shadowColor = HEX; c.shadowBlur = 24; c.drawImage(img, PAD, PAD, BW, BH);
      c.shadowBlur = 0; c.drawImage(img, PAD, PAD, BW, BH);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(' + CYAN + ',0.14)'; c.fillRect(0, 0, o.width, o.height);
      c.fillStyle = 'rgba(0,20,30,0.22)';
      for (let y = 0; y < o.height; y += 4) c.fillRect(0, y, o.width, 1);
      cuerpo = o;
    });

    function dibujar(t) {
      const c = card.ctx; c.clearRect(0, 0, CW, CH);
      c.drawImage(estatico, 0, 0);
      const tr = t - tFound;
      c.save(); rr(c, 8, 8, CW - 16, CH - 16, 28); c.clip();
      const sy = ((t * 0.22) % 1) * CH;
      const sg = c.createLinearGradient(0, 0, CW, 0);
      sg.addColorStop(0, 'rgba(' + CYAN + ',0)'); sg.addColorStop(0.5, 'rgba(' + CYAN + ',0.85)'); sg.addColorStop(1, 'rgba(' + CYAN + ',0)');
      c.fillStyle = sg; c.fillRect(0, sy, CW, 3);
      const sg2 = c.createLinearGradient(0, sy - 70, 0, sy);
      sg2.addColorStop(0, 'rgba(' + CYAN + ',0)'); sg2.addColorStop(1, 'rgba(' + CYAN + ',0.09)');
      c.fillStyle = sg2; c.fillRect(0, sy - 70, CW, 70);
      c.restore();
      c.fillStyle = 'rgba(61,255,154,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')';
      c.beginPath(); c.arc(634, 59, 8, 0, Math.PI * 2); c.fill();
      if (cuerpo) {
        const p = clamp((tr - 0.5) / Math.max(A.revelar, 0.1), 0, 1), e = 1 - Math.pow(1 - p, 3);
        const gx = BX + BW / 2;
        c.save(); c.globalAlpha = 0.5 + 0.35 * Math.pow(Math.sin(t * 2.5), 2) + 0.15 * e;
        c.fillStyle = 'rgba(' + CYAN + ',0.55)'; c.beginPath(); c.ellipse(gx, BY + BH + 6, BW * 0.55, 15, 0, 0, Math.PI * 2); c.fill(); c.restore();
        const vis = BH * e, top = BY + BH - vis;
        c.save(); c.beginPath(); c.rect(BX - PAD, top - PAD, BW + PAD * 2, vis + PAD * 2); c.clip();
        c.globalAlpha = (0.88 + 0.12 * Math.sin(t * 23)) * (0.4 + 0.6 * e);
        c.drawImage(cuerpo, BX - PAD, BY - PAD);
        c.restore();
        if (p < 1) {
          c.fillStyle = 'rgba(200,250,255,0.95)'; c.shadowColor = HEX; c.shadowBlur = 18;
          c.fillRect(BX - 10, top, BW + 20, 3); c.shadowBlur = 0;
        }
      }
      card.tex.needsUpdate = true;
    }

    /* Botones tocables */
    function dibujarBoton(b, label, presionado) {
      const c = b.ctx, w = b.canvas.width, h = b.canvas.height;
      c.clearRect(0, 0, w, h); rr(c, 4, 4, w - 8, h - 8, h * 0.2);
      c.fillStyle = presionado ? 'rgba(' + CYAN + ',0.55)' : 'rgba(' + CYAN + ',0.16)'; c.fill();
      c.shadowColor = HEX; c.shadowBlur = presionado ? 20 : 8; c.lineWidth = 3; c.strokeStyle = 'rgba(' + CYAN + ',0.9)'; c.stroke();
      c.shadowBlur = 0; c.fillStyle = '#e8fdff'; c.textAlign = 'center'; c.textBaseline = 'middle'; espaciado(c, 2);
      ajustar(c, label.toUpperCase(), w - 24, h * 0.36, 600); c.fillText(label.toUpperCase(), w / 2, h / 2 + 2);
      espaciado(c, 0); c.textBaseline = 'alphabetic'; b.tex.needsUpdate = true;
    }
    const redes = (cfg.redes || []).slice(0, 4), n = redes.length;
    if (n) {
      const bw = (770 - (n - 1) * 16) / n, bh = 84, byc = 690;
      redes.forEach((r, i) => {
        const cx = 620 + bw / 2 + i * (bw + 16);
        const b = planoCanvas(panelIn, {
          w: bw * U, h: bh * U, cw: Math.round(bw * 1.5), ch: Math.round(bh * 1.5), clase: 'clickable',
          pos: ((cx - CW / 2) * U) + ' ' + ((CH / 2 - byc) * U) + ' 0.03'
        });
        dibujarBoton(b, r.n, false);
        b.el.addEventListener('click', () => {
          dibujarBoton(b, r.n, true); setTimeout(() => { if (vivo) dibujarBoton(b, r.n, false); }, 250);
          if (opts.onBoton) opts.onBoton(r); else window.open(r.u, '_blank');
        });
      });
    }

    dibujarEstatico(); dibujar(performance.now() / 1000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (vivo) dibujarEstatico(); });
    intervalo = setInterval(() => { if (vivo && target.object3D.visible) dibujar(performance.now() / 1000); }, 60);

    function emitir() {
      tFound = performance.now() / 1000;
      const go = e => { if (!e) return; if (e.hasLoaded) e.emit('aparecer'); else e.addEventListener('loaded', () => e.emit('aparecer'), { once: true }); };
      go(panelOut); go(anillos);
    }
    function destruir() {
      vivo = false; clearInterval(intervalo);
      texturas.forEach(t => t.dispose());
      if (grupo.parentNode) grupo.parentNode.removeChild(grupo);
    }
    return { emitir, destruir };
  };
})();
