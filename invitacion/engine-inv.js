/* Motor de la invitación holográfica retrofuturista. No hace falta editarlo.
   Secuencia: caja neón -> se abre -> sale la invitación -> se guarda en el ícono -> CONFIRMA SÍ/NO */
(function () {
  const THREE = AFRAME.THREE;
  function rgb(h) {
    h = (h || '#00e5ff').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const FUENTE = "'Segoe UI', system-ui, sans-serif";
  function fit(c, txt, maxW, size, peso) {
    let s = size;
    do { c.font = peso + ' ' + s + 'px ' + FUENTE; s -= 2; } while (c.measureText(txt).width > maxW && s > 12);
  }
  function esp(c, px) { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; }

  window.crearInvitacion = function (target, cfg, opts) {
    opts = opts || {};
    const COL = Object.assign({ cian: '#00e5ff', magenta: '#ff2bd6', verde: '#3dff9a', rojo: '#ff4d6d' }, cfg.colores || {});
    const CI = rgb(COL.cian), MA = rgb(COL.magenta);
    const AS = +cfg.aspecto || 0.571, hh = AS / 2, esc = +cfg.escala || 1;
    const RG = cfg.regalo && cfg.regalo.activa !== false && cfg.regalo.archivo !== "" ? cfg.regalo : null;
    const SEG_AUTO = RG ? (+RG.autoAbrirSeg || 0) : 0, SEG_INV = (RG && +RG.invitacionSeg) || 8;
    let vivo = true; const texs = [], animados = [], paneles = {}, timers = [];
    const later = (f, ms) => { const t = setTimeout(() => { if (vivo) f(); }, ms); timers.push(t); return t; };
    const go = (e, ev) => { if (e.hasLoaded) e.emit(ev); else e.addEventListener('loaded', () => e.emit(ev), { once: true }); };
    const vis = (e, v) => e.setAttribute('visible', v ? 'true' : 'false');

    const grupo = document.createElement('a-entity');
    grupo.setAttribute('scale', esc + ' ' + esc + ' ' + esc);
    target.appendChild(grupo);

    function planoCanvas(parent, o) {
      const canvas = document.createElement('canvas'); canvas.width = o.cw; canvas.height = o.ch;
      const el = document.createElement('a-plane');
      el.setAttribute('width', o.w); el.setAttribute('height', o.h); el.setAttribute('position', o.pos || '0 0 0');
      el.setAttribute('material', 'shader: flat; transparent: true; side: double; depthWrite: false');
      if (o.clase) el.classList.add(o.clase);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; texs.push(tex);
      el.addEventListener('loaded', () => { const m = el.getObject3D('mesh'); if (!m) return; m.material.map = tex; m.material.needsUpdate = true; });
      parent.appendChild(el);
      return { el, canvas, ctx: canvas.getContext('2d'), tex };
    }

    /* Panel flotante que "sale" de un punto y levita. */
    function panel(id, o) {
      const ev = o.evento || 'aparecer', dl = o.delay || 0, d = (o.desde || [0, 0, 0]).join(' ');
      const ent = document.createElement('a-entity');
      ent.setAttribute('position', d); ent.setAttribute('scale', '0.01 0.01 0.01');
      ent.setAttribute('animation__pos', 'property: position; from: ' + d + '; to: ' + o.pos.join(' ') + '; dur: 1000; delay: ' + dl + '; easing: easeOutCubic; startEvents: ' + ev);
      ent.setAttribute('animation__esc', 'property: scale; from: 0.01 0.01 0.01; to: 1 1 1; dur: 800; delay: ' + dl + '; easing: easeOutBack; startEvents: ' + ev);
      if (o.oculto !== false) ent.setAttribute('visible', 'false');
      grupo.appendChild(ent);
      const inner = document.createElement('a-entity');
      inner.setAttribute('animation__bob', 'property: position; from: 0 0 0; to: 0 0 0.02; dir: alternate; loop: true; dur: ' + (1500 + Math.floor(Math.random() * 900)) + '; easing: easeInOutSine');
      ent.appendChild(inner);
      const p = planoCanvas(inner, { w: o.w, h: o.h, cw: o.cw, ch: o.ch, clase: o.clase });
      const obj = { id, ent, inner, p, estado: {}, pos: o.pos };
      obj.dibujar = () => { o.dibujar(p.ctx, performance.now() / 1000, obj.estado); p.tex.needsUpdate = true; };
      obj.dibujar(); if (o.anim) animados.push(obj);
      paneles[id] = obj; return obj;
    }

    /* ---------- estilo retrofuturista ---------- */
    function marco(c, w, h) {
      c.clearRect(0, 0, w, h);
      c.save(); rr(c, 6, 6, w - 12, h - 12, 22);
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(18,6,48,0.62)'); g.addColorStop(1, 'rgba(4,12,34,0.68)');
      c.fillStyle = g; c.fill();
      c.shadowColor = COL.cian; c.shadowBlur = 20; c.lineWidth = 3; c.strokeStyle = 'rgba(' + CI + ',0.9)'; c.stroke();
      c.restore();
      c.save(); rr(c, 6, 6, w - 12, h - 12, 22); c.clip();
      c.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1.5);
      c.restore();
      c.lineWidth = 5; c.strokeStyle = COL.magenta;
      const L = 40, m = 18;
      [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, dx, dy]) => {
        c.beginPath(); c.moveTo(x, y + dy * L); c.lineTo(x, y); c.lineTo(x + dx * L, y); c.stroke();
      });
    }
    function cromatico(c, txt, x, y, align) {
      c.textAlign = align || 'center';
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = COL.magenta; c.fillText(txt, x - 3, y); c.fillStyle = COL.cian; c.fillText(txt, x + 3, y); c.restore();
      c.fillStyle = '#ffffff'; c.fillText(txt, x, y);
    }
    function etiqueta(c, txt, x, y, color, tam, align) {
      c.textAlign = align || 'left'; c.fillStyle = color; c.font = '600 ' + tam + 'px ' + FUENTE; esp(c, 3); c.fillText(txt, x, y); esp(c, 0);
    }

    /* ---------- Panel de la invitación (sale de la caja) ---------- */
    const DOC_POS = [0.74, 0.1, 0.3], INV_POS = [0, 0.04, 0.5], CAJA_POS = [0, 0.08, 0.3];
    const filas = [['FECHA', cfg.fecha], ['HORA', cfg.hora], ['LUGAR', cfg.lugar], ['NOTA', cfg.nota]].filter(f => f[1]).slice(0, 4);
    const inv = panel('inv', {
      w: 1.1, h: 0.7, cw: 1100, ch: 700, pos: INV_POS, desde: RG ? CAJA_POS : [0, 0, 0], evento: 'sale', clase: 'clickable', anim: true,
      dibujar(c, t) {
        marco(c, 1100, 700);
        c.fillStyle = 'rgba(61,255,154,' + (0.5 + 0.5 * Math.sin(t * 4)) + ')'; c.beginPath(); c.arc(52, 58, 8, 0, 7); c.fill();
        etiqueta(c, 'TRANSMISIÓN ENTRANTE', 72, 65, 'rgba(' + CI + ',0.95)', 21);
        etiqueta(c, 'SEÑAL 100%', 1048, 65, 'rgba(' + MA + ',0.95)', 21, 'right');
        const tit = (cfg.titulo || 'ESTÁS INVITADO').toUpperCase();
        fit(c, tit, 960, 108, 800); cromatico(c, tit, 550, 200);
        const sub = (cfg.subtitulo || 'A MI CUMPLE').toUpperCase();
        fit(c, sub, 900, 68, 700); esp(c, 4); c.fillStyle = COL.cian; c.textAlign = 'center'; c.fillText(sub, 550, 284); esp(c, 0);
        if (cfg.festejado) {
          const f = '— ' + cfg.festejado.toUpperCase() + ' —';
          fit(c, f, 800, 40, 700); c.fillStyle = COL.magenta; c.shadowColor = COL.magenta; c.shadowBlur = 14; c.fillText(f, 550, 338); c.shadowBlur = 0;
        }
        const y0 = 410, paso = filas.length > 3 ? 62 : 74;
        filas.forEach(([k, v], i) => {
          const y = y0 + i * paso;
          c.strokeStyle = 'rgba(' + CI + ',0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(70, y - 46); c.lineTo(1030, y - 46); c.stroke();
          etiqueta(c, k, 70, y, 'rgba(' + MA + ',1)', 28);
          c.textAlign = 'right'; c.fillStyle = '#ffffff'; c.shadowColor = COL.cian; c.shadowBlur = 10; const vv = String(v).toUpperCase(); fit(c, vv, 700, 46, 700); c.fillText(vv, 1030, y + 2); c.shadowBlur = 0;
        });
        c.save(); rr(c, 6, 6, 1088, 688, 22); c.clip();
        const sy = ((t * 0.25) % 1) * 700; c.fillStyle = 'rgba(' + CI + ',0.5)'; c.fillRect(0, sy, 1100, 3);
        c.restore();
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3); etiqueta(c, 'TOCÁ PARA GUARDAR', 550, 678, 'rgba(' + CI + ',0.9)', 16, 'center'); c.globalAlpha = 1;
      }
    });
    inv.ent.setAttribute('animation__guarda', 'property: position; from: ' + INV_POS.join(' ') + '; to: ' + DOC_POS.join(' ') + '; dur: 750; easing: easeInCubic; startEvents: guarda');
    inv.ent.setAttribute('animation__guardaesc', 'property: scale; from: 1 1 1; to: 0.08 0.08 0.08; dur: 750; easing: easeInCubic; startEvents: guarda');
    inv.ent.setAttribute('animation__reabre', 'property: position; from: ' + DOC_POS.join(' ') + '; to: ' + INV_POS.join(' ') + '; dur: 800; easing: easeOutCubic; startEvents: reabre');
    inv.ent.setAttribute('animation__reabresc', 'property: scale; from: 0.08 0.08 0.08; to: 1 1 1; dur: 800; easing: easeOutBack; startEvents: reabre');

    /* ---------- Ícono de documento (acá se "guarda" la invitación) ---------- */
    const doc = panel('doc', {
      w: 0.26, h: 0.3, cw: 260, ch: 300, pos: DOC_POS, desde: DOC_POS, clase: 'clickable', anim: true,
      dibujar(c, t, e) {
        marco(c, 260, 300);
        const pul = 0.5 + 0.5 * Math.sin(t * 3);
        c.save(); c.shadowColor = COL.verde; c.shadowBlur = 10 + 10 * pul;
        c.strokeStyle = COL.cian; c.lineWidth = 6; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(78, 46); c.lineTo(150, 46); c.lineTo(184, 80); c.lineTo(184, 176); c.lineTo(78, 176); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(150, 46); c.lineTo(150, 80); c.lineTo(184, 80); c.stroke();
        c.lineWidth = 5; [104, 124, 144].forEach(y => { c.beginPath(); c.moveTo(96, y); c.lineTo(166, y); c.stroke(); });
        c.strokeStyle = COL.verde; c.lineWidth = 9; c.beginPath(); c.moveTo(138, 150); c.lineTo(156, 170); c.lineTo(196, 126); c.stroke();
        c.restore();
        etiqueta(c, 'INVITACIÓN', 130, 224, '#ffffff', 21, 'center');
        etiqueta(c, 'GUARDADA', 130, 250, COL.verde, 16, 'center');
        c.globalAlpha = 0.5 + 0.5 * pul; etiqueta(c, e.abierta ? 'TOCÁ PARA GUARDAR' : 'TOCÁ PARA VER', 130, 278, 'rgba(' + CI + ',0.9)', 12, 'center'); c.globalAlpha = 1;
      }
    });

    /* ---------- Confirmación: SÍ / NO ---------- */
    const yEt = -(hh + 0.14), yBt = -(hh + 0.38);
    const conf = panel('confirma', {
      w: 1.1, h: 0.15, cw: 1100, ch: 150, pos: [0, yEt, 0.2], delay: 100, anim: true,
      dibujar(c, t) {
        marco(c, 1100, 150);
        c.font = '800 52px ' + FUENTE; esp(c, 6); cromatico(c, 'CONFIRMA INVITACIÓN', 550, 94); esp(c, 0);
        if (Math.sin(t * 5) > 0) { c.fillStyle = COL.cian; c.fillRect(1010, 96, 36, 6); }
      }
    });
    function dibujarBoton(color, titulo, sub) {
      return (c, t, e) => {
        const w = 520, h = 200, K = rgb(color), pul = 0.5 + 0.5 * Math.sin(t * 3 + (titulo === 'NO' ? 1.5 : 0));
        c.clearRect(0, 0, w, h); rr(c, 8, 8, w - 16, h - 16, 26);
        c.fillStyle = 'rgba(' + K + ',' + (e.pres ? 0.6 : 0.16 + 0.1 * pul) + ')'; c.fill();
        c.shadowColor = color; c.shadowBlur = e.pres ? 34 : 12 + 14 * pul; c.lineWidth = 5; c.strokeStyle = color; c.stroke(); c.shadowBlur = 0;
        c.save(); c.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = 10; y < h - 10; y += 4) c.fillRect(10, y, w - 20, 1.5); c.restore();
        c.font = '900 92px ' + FUENTE; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.shadowColor = color; c.shadowBlur = 18; c.fillText(titulo, w / 2, 112); c.shadowBlur = 0;
        esp(c, 5); c.font = '700 26px ' + FUENTE; c.fillStyle = color; c.fillText(sub, w / 2, 160); esp(c, 0);
      };
    }
    const bSi = panel('si', { w: 0.52, h: 0.2, cw: 520, ch: 200, pos: [-0.29, yBt, 0.22], delay: 350, clase: 'clickable', anim: true, dibujar: dibujarBoton(COL.verde, 'SÍ', 'VOY A IR') });
    const bNo = panel('no', { w: 0.52, h: 0.2, cw: 520, ch: 200, pos: [0.29, yBt, 0.22], delay: 500, clase: 'clickable', anim: true, dibujar: dibujarBoton(COL.rojo, 'NO', 'NO PUEDO') });
    function pulsar(b, valor) {
      b.estado.pres = true; b.dibujar(); later(() => { b.estado.pres = false; b.dibujar(); }, 250);
      if (opts.onRespuesta) opts.onRespuesta(valor);
    }
    bSi.p.el.addEventListener('click', () => pulsar(bSi, 'SI'));
    bNo.p.el.addEventListener('click', () => pulsar(bNo, 'NO'));

    /* ---------- Resultado ---------- */
    const res = panel('resultado', {
      w: 1.1, h: 0.5, cw: 1100, ch: 500, pos: [0, -(hh + 0.3), 0.2], evento: 'abrir',
      dibujar(c, t, e) {
        marco(c, 1100, 500);
        const si = e.respuesta !== 'NO', color = si ? COL.verde : COL.rojo;
        c.font = '800 54px ' + FUENTE; esp(c, 4); cromatico(c, 'RESPUESTA REGISTRADA', 550, 112); esp(c, 0);
        c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 16;
        const l1 = si ? '✔  ¡GRACIAS' + (e.nombre ? ', ' + e.nombre.toUpperCase() : '') + '!' : '✖  GRACIAS POR AVISAR' + (e.nombre ? ', ' + e.nombre.toUpperCase() : '');
        fit(c, l1, 980, 52, 800); c.textAlign = 'center'; c.fillText(l1, 550, 240); c.shadowBlur = 0;
        const l2 = si ? 'TE ESPERO EN EL CUMPLE' : 'TE VOY A EXTRAÑAR';
        fit(c, l2, 900, 40, 600); esp(c, 4); c.fillStyle = '#eafcff'; c.fillText(l2, 550, 320); esp(c, 0);
        c.fillStyle = 'rgba(' + CI + ',' + (0.5 + 0.5 * Math.sin(t * 3)) + ')'; c.font = '600 22px ' + FUENTE; esp(c, 3);
        c.fillText('ENVIADO AL ANFITRIÓN', 550, 420); esp(c, 0);
      }
    });

    /* ---------- Secuencia ---------- */
    let invVisible = false, confEmitida = false, respondida = false, iniciada = false, abierta = false, timerAuto = null, timerInv = null;

    let cajaV = 1;                                       // la caja se atenúa mientras la invitación está a la vista
    function cajaOp(v) {
      if (!RG) return; const a = cajaV; cajaV = v;
      tween(600, k => cajaMats.forEach(m => { m.opacity = m.userData.base * (a + (v - a) * k); }));
    }
    function sacarInvitacion() {
      cajaOp(0.2); vis(inv.ent, true); go(inv.ent, 'sale'); invVisible = true; doc.estado.abierta = true;
      clearTimeout(timerInv); timerInv = later(guardar, SEG_INV * 1000);
    }
    function guardar() {
      if (!invVisible) return; invVisible = false; clearTimeout(timerInv); doc.estado.abierta = false; doc.dibujar();
      go(inv.ent, 'guarda'); cajaOp(1);
      later(() => {
        vis(inv.ent, false);
        vis(doc.ent, true); doc.dibujar(); go(doc.ent, 'aparecer');
        if (!confEmitida && !respondida) {
          confEmitida = true;
          later(() => { [conf, bSi, bNo].forEach(p => { vis(p.ent, true); go(p.ent, 'aparecer'); }); }, 500);
        }
      }, 780);
    }
    function reabrir() {
      cajaOp(0.2); invVisible = true; doc.estado.abierta = true; doc.dibujar(); vis(inv.ent, true); go(inv.ent, 'reabre');
      clearTimeout(timerInv); timerInv = later(guardar, SEG_INV * 1000);
    }
    inv.p.el.addEventListener('click', () => guardar());
    doc.p.el.addEventListener('click', () => { if (invVisible) guardar(); else reabrir(); });

    /* ---------- Caja neón 3D (aristas de neón + solapas articuladas) ---------- */
    let caja = null, beam = null, hint = null, cajaClick = null;
    const flaps = [], cajaMats = [];
    const CJ = { s: 0.5, h: 0.34, r: 0.0065 };
    const PAL = [new THREE.Color(COL.cian), new THREE.Color(COL.magenta), new THREE.Color('#ffb02e')];
    const matCache = {};
    function matNeon(col, glow) {
      const k = col.getHexString() + (glow ? 'g' : 'c');
      if (!matCache[k]) {
        const c = col.clone(); if (!glow) c.lerp(new THREE.Color('#ffffff'), 0.2);
        const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: glow ? 0.3 : 1 });
        m.userData.base = m.opacity; matCache[k] = m; cajaMats.push(m);
      }
      return matCache[k];
    }
    const geoTubo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    const UP = new THREE.Vector3(0, 1, 0);
    function tramo(parent, A, B, col) {
      const d = B.clone().sub(A), len = d.length(), mid = A.clone().add(B).multiplyScalar(0.5);
      [[CJ.r, false], [CJ.r * 3.6, true]].forEach(([rad, glow]) => {
        const m = new THREE.Mesh(geoTubo, matNeon(col, glow));
        m.position.copy(mid); m.quaternion.setFromUnitVectors(UP, d.clone().normalize()); m.scale.set(rad, len, rad); parent.add(m);
      });
    }
    let idxArista = 0;
    function arista(parent, A, B) {          // cada arista cambia de color a la mitad, como el neón de la imagen
      const c1 = PAL[idxArista % 3], c2 = PAL[(idxArista + 1) % 3]; idxArista++;
      const M = A.clone().add(B).multiplyScalar(0.5);
      tramo(parent, A, M, c1); tramo(parent, M, B, c2);
    }
    function relleno(parent, w, h, pos, rotX, rotY, op) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x3a2a9a, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.userData.base = op; cajaMats.push(m.material); m.position.copy(pos); m.rotation.x = rotX || 0; m.rotation.y = rotY || 0; parent.add(m);
    }
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    if (RG) {
      caja = document.createElement('a-entity');
      caja.setAttribute('position', '0 0 0'); caja.setAttribute('scale', '0.01 0.01 0.01'); vis(caja, false);
      caja.setAttribute('animation__pos', 'property: position; from: 0 0 0; to: ' + CAJA_POS.join(' ') + '; dur: 1100; easing: easeOutCubic; startEvents: caja');
      caja.setAttribute('animation__esc', 'property: scale; from: 0.01 0.01 0.01; to: 1 1 1; dur: 900; easing: easeOutBack; startEvents: caja');
      grupo.appendChild(caja);
      const tilt = document.createElement('a-entity'); tilt.setAttribute('rotation', '58 0 0'); caja.appendChild(tilt);
      const sway = document.createElement('a-entity');
      sway.setAttribute('animation__sway', 'property: rotation; from: 0 -22 0; to: 0 22 0; dir: alternate; loop: true; dur: 3600; easing: easeInOutSine');
      sway.setAttribute('animation__bob', 'property: position; from: 0 0 0; to: 0 0.03 0; dir: alternate; loop: true; dur: 1600; easing: easeInOutSine');
      tilt.appendChild(sway);

      const root = new THREE.Group(); sway.setObject3D('cajaneon', root);
      const hs = CJ.s / 2, hy = CJ.h / 2;
      /* cuerpo: base, aristas verticales y paredes translúcidas */
      const b = [V(-hs, -hy, hs), V(hs, -hy, hs), V(hs, -hy, -hs), V(-hs, -hy, -hs)];
      const t = b.map(p => V(p.x, hy, p.z));
      for (let i = 0; i < 4; i++) { arista(root, b[i], b[(i + 1) % 4]); arista(root, b[i], t[i]); }
      [0, 1, 2, 3].forEach(k => {
        const a = k * Math.PI / 2;
        relleno(root, CJ.s, CJ.h, V(Math.sin(a) * hs, 0, Math.cos(a) * hs), 0, a, 0.10);
      });
      /* 4 solapas articuladas en el borde superior (θ=0 cerrada, θ=π abierta hacia afuera) */
      const cfg4 = [{ a: 0, w: CJ.s, open: 0.99, d: 0.0 }, { a: Math.PI / 2, w: CJ.s - 0.02, open: 0.9, d: 0.1 }, { a: Math.PI, w: CJ.s, open: 0.72, d: 0.2 }, { a: -Math.PI / 2, w: CJ.s - 0.02, open: 0.9, d: 0.1 }];
      cfg4.forEach((c, i) => {
        const pivot = new THREE.Group(); pivot.rotation.y = c.a;
        pivot.position.set(Math.sin(c.a) * hs, hy + (i % 2 === 0 ? 0.006 : 0), Math.cos(c.a) * hs);
        const fl = new THREE.Group(); pivot.add(fl);
        const w2 = c.w / 2, dd = hs;
        const p = [V(-w2, 0, 0), V(w2, 0, 0), V(w2, 0, -dd), V(-w2, 0, -dd)];
        for (let e = 0; e < 4; e++) arista(fl, p[e], p[(e + 1) % 4]);
        relleno(fl, c.w, dd, V(0, 0, -dd / 2), -Math.PI / 2, 0, 0.16);
        root.add(pivot); if (i % 2 === 1) pivot.visible = false;   // cerrada: solo se ven 2 solapas grandes
        flaps.push({ fl, pivot, open: c.open * Math.PI, retraso: c.d });
      });

      cajaClick = document.createElement('a-box'); cajaClick.classList.add('clickable');
      cajaClick.setAttribute('width', CJ.s * 1.3); cajaClick.setAttribute('height', CJ.h * 1.6); cajaClick.setAttribute('depth', CJ.s * 1.3);
      cajaClick.setAttribute('material', 'transparent: true; opacity: 0; depthWrite: false'); sway.appendChild(cajaClick);

      /* haz de luz que sale de la caja (dos planos cruzados) */
      beam = document.createElement('a-entity'); beam.setAttribute('scale', '1 0.01 1'); vis(beam, false);
      beam.setAttribute('position', '0 ' + hy + ' 0');
      beam.setAttribute('animation__sube', 'property: scale; from: 1 0.01 1; to: 1.1 1 1.1; dur: 800; easing: easeOutQuad; startEvents: abre');
      sway.appendChild(beam);
      const bc = document.createElement('canvas'); bc.width = 256; bc.height = 512; const bx = bc.getContext('2d');
      const hg = bx.createLinearGradient(0, 0, 256, 0);
      hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(255,255,255,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      bx.fillStyle = hg; bx.fillRect(0, 0, 256, 512);
      bx.globalCompositeOperation = 'destination-in'; const vg = bx.createLinearGradient(0, 512, 0, 0);
      vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); bx.fillStyle = vg; bx.fillRect(0, 0, 256, 512);
      bx.globalCompositeOperation = 'source-in'; const cg = bx.createLinearGradient(0, 512, 0, 0);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.4, COL.cian); cg.addColorStop(1, COL.magenta); bx.fillStyle = cg; bx.fillRect(0, 0, 256, 512);
      const btex = new THREE.CanvasTexture(bc); btex.colorSpace = THREE.SRGBColorSpace; texs.push(btex);
      [0, 90].forEach(ry => {
        const bp = document.createElement('a-plane'); bp.setAttribute('width', 0.5); bp.setAttribute('height', 0.9); bp.setAttribute('position', '0 0.45 0'); bp.setAttribute('rotation', '0 ' + ry + ' 0');
        bp.setAttribute('material', 'shader: flat; transparent: true; blending: additive; depthWrite: false; side: double; opacity: 0.8');
        bp.addEventListener('loaded', () => { const m = bp.getObject3D('mesh'); if (m) { m.material.map = btex; m.material.needsUpdate = true; } });
        beam.appendChild(bp);
      });

      hint = panel('hint', {
        w: 0.9, h: 0.12, cw: 900, ch: 120, pos: [0, -(hh + 0.1), 0.3], delay: 700, evento: 'caja', clase: 'clickable', anim: true,
        dibujar(c, t) {
          c.clearRect(0, 0, 900, 120); c.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4);
          c.font = '800 54px ' + FUENTE; esp(c, 8); cromatico(c, 'TOCÁ LA CAJA', 450, 78); esp(c, 0); c.globalAlpha = 1;
        }
      });
      const abrir = () => abrirCaja();
      cajaClick.addEventListener('click', abrir); hint.p.el.addEventListener('click', abrir);
    }
    function tween(dur, fn, fin) {
      const t0 = performance.now();
      (function paso(now) {
        if (!vivo) return;
        const k = Math.min(1, Math.max(0, (now - t0) / dur)); fn(k);
        if (k < 1) requestAnimationFrame(paso); else if (fin) fin();
      })(t0);
    }
    const easeBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
    function abrirCaja() {
      if (abierta || !vivo) return; abierta = true; clearTimeout(timerAuto);
      if (!RG) { sacarInvitacion(); return; }
      vis(hint.ent, false);
      flaps.forEach(f => later(() => { f.pivot.visible = true; tween(950, k => { f.fl.rotation.x = f.open * easeBack(k); }); }, f.retraso * 1000));
      later(() => { vis(beam, true); go(beam, 'abre'); }, 350);
      later(() => {
        const ring = document.createElement('a-ring');
        ring.setAttribute('radius-inner', 0.27); ring.setAttribute('radius-outer', 0.278); ring.setAttribute('position', CAJA_POS.join(' '));
        ring.setAttribute('material', 'shader: flat; color: ' + COL.magenta + '; transparent: true; opacity: 0.9; blending: additive; depthWrite: false');
        ring.setAttribute('animation__s', 'property: scale; from: 0.2 0.2 0.2; to: 2.8 2.8 2.8; dur: 800; easing: easeOutQuad');
        ring.setAttribute('animation__o', 'property: material.opacity; from: 0.9; to: 0; dur: 800');
        grupo.appendChild(ring); later(() => { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 1000);
      }, 550);
      later(sacarInvitacion, 800);                      // la invitación sale de la caja
      later(() => {                                     // el haz se apaga; la caja queda siempre en el centro
        beam.setAttribute('animation__fade', 'property: scale; to: 0.01 0.01 0.01; dur: 900; easing: easeInQuad');
      }, 1800);
      later(() => vis(beam, false), 2800);
    }

    /* ---------- animación general ---------- */
    const intervalo = setInterval(() => {
      if (!vivo || !target.object3D.visible) return;
      animados.forEach(o => { if (o.ent.getAttribute('visible') === true) o.dibujar(); });
      if (res.ent.getAttribute('visible') === true) res.dibujar();
    }, 70);

    function emitir() {
      if (iniciada) return; iniciada = true;
      if (RG) {
        vis(caja, true); vis(hint.ent, true); go(caja, 'caja'); go(hint.ent, 'caja');
        if (SEG_AUTO > 0) timerAuto = later(abrirCaja, SEG_AUTO * 1000);
      } else abrirCaja();
    }
    function mostrarResultado(d) {
      respondida = true;
      [conf, bSi, bNo].forEach(p => vis(p.ent, false));
      res.estado.nombre = d.nombre; res.estado.respuesta = d.respuesta; res.dibujar();
      vis(res.ent, true); go(res.ent, 'abrir');
    }
    function destruir() {
      vivo = false; clearInterval(intervalo); timers.forEach(clearTimeout); texs.forEach(t => t.dispose());
      if (grupo.parentNode) grupo.parentNode.removeChild(grupo);
    }
    function responder(valor) {                        // lo usa el control por voz: igual que tocar SÍ / NO
      if (respondida || conf.ent.getAttribute('visible') !== true) return false;
      pulsar(valor === 'SI' ? bSi : bNo, valor); return true;
    }
    function abrir() { if (!iniciada || abierta) return false; abrirCaja(); return true; }
    return { emitir, destruir, mostrarResultado, responder, abrir };
  };
})();
