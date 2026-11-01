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
    location.href = 'inventario.html';
    return null;
  }

  pintarMenu(perfil);
  return perfil;
}

// ---------- Menú lateral ----------

function pintarMenu(perfil) {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const paginas = [
    { archivo: 'inventario.html', texto: 'Productos' },
    { archivo: 'movimientos.html', texto: 'Movimientos' },
    { archivo: 'reportes.html', texto: 'Reportes' }
  ];
  if (perfil.rol === 'admin') {
    paginas.push({ archivo: 'usuarios.html', texto: 'Usuarios' });
  }

  const actual = location.pathname.split('/').pop() || 'inventario.html';

  menu.innerHTML = `
    <p class="marca">Inventario</p>
    <nav>
      ${paginas.map((p) => `
        <a href="${p.archivo}" class="${p.archivo === actual ? 'activo' : ''}">${p.texto}</a>
      `).join('')}
    </nav>
    <div class="menu-pie">
      <p class="menu-usuario">${escaparHTML(perfil.nombre)}</p>
      <button type="button" class="boton-texto" id="salir">Cerrar sesión</button>
    </div>
  `;

  document.getElementById('salir').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  });
}
