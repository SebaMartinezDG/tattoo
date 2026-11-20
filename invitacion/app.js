/* Flujo de respuesta: pide el nombre, envía a Google Apps Script y muestra el resultado en el AR. */
(function () {
  const css = `
  #inv-modal{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:16px;
    background:rgba(4,2,16,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-family:'Segoe UI',system-ui,sans-serif;color:#eafcff}
  #inv-modal.on{display:flex}
  #inv-box{width:min(92vw,400px);padding:20px 18px 16px;border:2px solid var(--ac,#00e5ff);border-radius:14px;
    background:linear-gradient(160deg,rgba(24,8,56,.95),rgba(4,12,34,.97));box-shadow:0 0 28px var(--ac,#00e5ff),inset 0 0 30px rgba(255,43,214,.12)}
  #inv-box h2{margin:0 0 4px;font-size:20px;letter-spacing:.12em;text-shadow:-2px 0 #ff2bd6,2px 0 #00e5ff}
  #inv-box p{margin:0 0 14px;font-size:13px;opacity:.8}
  #inv-box label{display:block;margin:10px 0 4px;font-size:11px;letter-spacing:.18em;color:#ff7be8}
  #inv-box input,#inv-box select,#inv-box textarea{width:100%;padding:10px;border:1px solid #00e5ff88;border-radius:8px;background:#050a1c;color:#eafcff;font:inherit;font-size:16px}
  #inv-box textarea{min-height:60px;resize:none}
  #inv-box .fila{display:flex;gap:10px;margin-top:16px}
  #inv-box button{flex:1;padding:12px;border-radius:8px;border:2px solid var(--ac,#00e5ff);background:transparent;color:#eafcff;font:700 14px 'Segoe UI',sans-serif;letter-spacing:.14em;cursor:pointer}
  #inv-box button.ok{background:var(--ac,#00e5ff);color:#02101a}
  #inv-box button[disabled]{opacity:.5}
  #inv-err{margin-top:10px;font-size:13px;color:#ff4d6d;min-height:16px}
  #inv-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:60;max-width:90vw;padding:9px 14px;border-radius:8px;
    border:1px solid #ff2bd6;background:#12062ae6;color:#fff;font:13px 'Segoe UI',sans-serif;opacity:0;transition:.3s;pointer-events:none}
  #inv-toast.on{opacity:1}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const modal = document.createElement('div'); modal.id = 'inv-modal';
  modal.innerHTML = `<div id="inv-box"><h2 id="inv-t"></h2><p id="inv-s"></p>
    <label>TU NOMBRE</label><input id="inv-n" maxlength="60" autocomplete="name" placeholder="Nombre y apellido">
    <div id="inv-cw"><label>¿CUÁNTOS MÁS VIENEN CON VOS?</label>
      <select id="inv-c"><option value="0">Voy solo/a</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
    <label>MENSAJE (OPCIONAL)</label><textarea id="inv-m" maxlength="200" placeholder="Alergias, saludos…"></textarea>
    <div id="inv-err"></div>
    <div class="fila"><button id="inv-x">CANCELAR</button><button id="inv-ok" class="ok">ENVIAR</button></div></div>`;
  const toast = document.createElement('div'); toast.id = 'inv-toast';
  document.addEventListener('DOMContentLoaded', () => { document.body.append(modal, toast); });
  if (document.body) document.body.append(modal, toast);
  const $ = id => document.getElementById(id);
  function aviso(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(aviso.t); aviso.t = setTimeout(() => toast.classList.remove('on'), 4200); }

  window.montarApp = function (target, o) {
    o = o || {}; const cfg = window.CONFIG; let enviado = false, ocupado = false, actual = null;
    if (cfg.colores && cfg.colores.cian) modal.style.setProperty('--ac', cfg.colores.cian);
    const ui = crearInvitacion(target, cfg, { sinCache: o.sinCache, onRespuesta: abrir });

    function abrir(resp) {
      if (enviado) { aviso('Ya registramos tu respuesta. ¡Gracias!'); return; }
      actual = resp;
      $('inv-t').textContent = resp === 'SI' ? 'CONFIRMAR ASISTENCIA' : 'AVISAR QUE NO VAS';
      $('inv-s').textContent = resp === 'SI' ? '¡Genial! Dejanos tus datos.' : 'Una lástima. Dejanos tu nombre para avisarle al anfitrión.';
      $('inv-cw').style.display = resp === 'SI' ? 'block' : 'none';
      $('inv-err').textContent = ''; modal.classList.add('on'); setTimeout(() => $('inv-n').focus(), 100);
    }
    $('inv-x').onclick = () => { if (!ocupado) modal.classList.remove('on'); };
    $('inv-ok').onclick = async () => {
      const nombre = $('inv-n').value.trim();
      if (nombre.length < 2) { $('inv-err').textContent = 'Escribí tu nombre.'; return; }
      const datos = { nombre, respuesta: actual, acompanantes: actual === 'SI' ? +$('inv-c').value : 0, mensaje: $('inv-m').value.trim() };
      ocupado = true; $('inv-ok').disabled = true; $('inv-x').disabled = true; $('inv-ok').textContent = 'ENVIANDO…';
      try {
        const url = cfg.scriptUrl || '', real = url && !/PEGAR|XXXX/.test(url);
        if (real) await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(datos) });
        else await new Promise(r => setTimeout(r, 700));
        enviado = true; modal.classList.remove('on'); ui.mostrarResultado(datos);
        if (!real) aviso('MODO PRUEBA: la respuesta NO se envió (falta pegar la URL del script en config.js)');
      } catch (e) {
        $('inv-err').textContent = 'No se pudo enviar. Revisá tu conexión y probá de nuevo.';
      } finally { ocupado = false; $('inv-ok').disabled = false; $('inv-x').disabled = false; $('inv-ok').textContent = 'ENVIAR'; }
    };
    return ui;
  };
})();
