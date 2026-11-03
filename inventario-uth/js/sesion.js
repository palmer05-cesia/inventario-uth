// ---------- Utilidades ----------

function escaparHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function mostrarAviso(texto, tipo = 'ok') {
  const aviso = document.getElementById('aviso');
  if (!aviso) return alert(texto);
  aviso.textContent = texto;
  aviso.className = 'aviso ' + tipo;
  aviso.hidden = false;
  clearTimeout(mostrarAviso.t);
  mostrarAviso.t = setTimeout(() => (aviso.hidden = true), 4000);
}

function formatoFecha(iso) {
  return new Date(iso).toLocaleString('es-HN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

const NOMBRES_ROL = { admin: 'Administrador', bodega: 'Bodega', consulta: 'Consulta' };

// ---------- Iconos (SVG sencillos) ----------

const ICONOS = {
  marca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M6 14l6-4.7 6 4.7"/><path d="M9 20v-4h6v4"/></svg>',
  panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/></svg>',
  productos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
  movimientos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16"/><path d="m3 8 4-4 4 4"/><path d="M17 20V4"/><path d="m13 16 4 4 4-4"/></svg>',
  reportes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21c0-3-1.5-5-4-5.7"/></svg>',
  salir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
  entrada: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
  salida: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
  candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
};

// ---------- Protección de páginas ----------
// Revisa sesión, código de 6 dígitos y rol. Devuelve el perfil del usuario.

async function exigirSesion(rolesPermitidos = ['admin', 'bodega', 'consulta']) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = 'index.html';
    return null;
  }

  const { data: nivel } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel.currentLevel !== 'aal2') {
    location.href = 'verificar.html';
    return null;
  }

  const { data: perfil, error } = await sb
    .from('perfiles')
    .select('id, nombre, correo, rol')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil) {
    await sb.auth.signOut();
    location.href = 'index.html';
    return null;
  }

  if (!rolesPermitidos.includes(perfil.rol)) {
    location.href = 'panel.html';
    return null;
  }

  pintarMenu(perfil);
  pintarBarra(perfil);
  return perfil;
}

// ---------- Menú lateral ----------

function pintarMenu(perfil) {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const enlace = (archivo, texto, icono) => {
    const actual = location.pathname.split('/').pop() || 'panel.html';
    return `<a href="${archivo}" class="${archivo === actual ? 'activo' : ''}">${ICONOS[icono]}${texto}</a>`;
  };

  menu.innerHTML = `
    <div class="marca">${ICONOS.marca}<span>Inventario UTH</span></div>
    <nav>
      ${enlace('panel.html', 'Panel', 'panel')}
      <p class="menu-titulo">Inventario</p>
      ${enlace('inventario.html', 'Productos', 'productos')}
      ${enlace('movimientos.html', 'Movimientos', 'movimientos')}
      ${enlace('reportes.html', 'Reportes', 'reportes')}
      ${perfil.rol === 'admin' ? `<p class="menu-titulo">Administración</p>${enlace('usuarios.html', 'Usuarios', 'usuarios')}` : ''}
    </nav>
    <div class="menu-pie">
      <button type="button" id="salir">${ICONOS.salir}Cerrar sesión</button>
    </div>
  `;

  document.getElementById('salir').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  });
}

// ---------- Barra superior ----------

function pintarBarra(perfil) {
  const main = document.querySelector('.app > main');
  if (!main || document.querySelector('.barra-superior')) return;

  const contenido = document.createElement('div');
  contenido.className = 'contenido';
  main.replaceWith(contenido);

  const barra = document.createElement('header');
  barra.className = 'barra-superior';
  barra.innerHTML = `
    <p class="miga">${escaparHTML(document.title.split('·')[0].trim())}</p>
    <div class="usuario-barra">
      <div style="text-align:right">
        <p class="nombre">${escaparHTML(perfil.nombre)}</p>
        <p class="rol-barra">${NOMBRES_ROL[perfil.rol]}</p>
      </div>
      <div class="avatar" aria-hidden="true">${escaparHTML(perfil.nombre.charAt(0).toUpperCase())}</div>
    </div>
  `;

  contenido.append(barra, main);
}
