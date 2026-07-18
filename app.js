const SUPABASE_URL = 'https://dqcowatretisfkfvulmk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY293YXRyZXRpc2ZrZnZ1bG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTIxMDMsImV4cCI6MjA5ODMyODEwM30.u-FPmVyAPDgHJlwvpYE8SjNv7AG5qKI1XGkfzgJ_fHk'

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

let usuarioActual = null
let negocioActual = null

// ── SISTEMA DE PLANES ──
function esPremium() {
  return negocioActual?.plan === 'premium'
}

function verificarLimiteFree(accion) {
  if (esPremium()) return true

  const limites = {
    'productos': { limite: 50, mensaje: 'El plan gratuito permite hasta 50 productos. ¡Pasate a Premium para tener productos ilimitados!' },
    'precios_multiples': { mensaje: 'Los 3 precios por producto son una función Premium. ¡Pasate a Premium para activarla!' },
    'reportes': { mensaje: 'Los reportes avanzados son una función Premium. ¡Pasate a Premium para acceder!' },
    'importar': { mensaje: 'El importador de CSV es una función Premium. ¡Pasate a Premium para usarlo!' },
    'cierre_caja': { mensaje: 'El cierre formal de caja es una función Premium. ¡Pasate a Premium para acceder!' },
  }

  const config = limites[accion]
  if (!config) return true

  mostrarModalPremium(config.mensaje)
  return false
}

function mostrarModalPremium(mensaje) {
  document.getElementById('premium-mensaje').textContent = mensaje
  document.getElementById('modal-premium').style.display = 'flex'
  lucide.createIcons()
}

// ── LOGIN ──
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const { data, error } = await db.auth.signInWithPassword({ email, password })


  if (error) {
    mostrarMensaje('Email o contraseña incorrectos', 'error')
    return
  }

  usuarioActual = data.user
  await verificarPerfil()
})

// ── REGISTRO ──
document.getElementById('btn-registro').addEventListener('click', () => {
  document.getElementById('pantalla-login').style.display = 'none'
  document.getElementById('pantalla-registro').style.display = 'flex'
  lucide.createIcons()
})

document.getElementById('btn-volver-login').addEventListener('click', () => {
  document.getElementById('pantalla-registro').style.display = 'none'
  document.getElementById('pantalla-login').style.display = 'flex'
})

document.getElementById('btn-confirmar-registro').addEventListener('click', async () => {
  const nombre = document.getElementById('registro-nombre').value.trim()
  const rubro = document.getElementById('registro-rubro').value
  const email = document.getElementById('registro-email').value.trim()
  const password = document.getElementById('registro-password').value
  const passwordConfirmar = document.getElementById('registro-password-confirmar').value
  const msg = document.getElementById('mensaje-error-registro')

  if (!nombre || !rubro || !email || !password || !passwordConfirmar) {
    msg.style.color = '#ff6b6b'
    msg.textContent = 'Completá todos los campos'
    return
  }

  if (password.length < 6) {
    msg.style.color = '#ff6b6b'
    msg.textContent = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (password !== passwordConfirmar) {
    msg.style.color = '#ff6b6b'
    msg.textContent = 'Las contraseñas no coinciden'
    return
  }

  const { data, error } = await db.auth.signUp({ email, password })

  if (error) {
    msg.style.color = '#ff6b6b'
    msg.textContent = error.message
    return
  }

  // CREAR NEGOCIO AUTOMÁTICAMENTE
  const { error: negocioError } = await db.from('negocios').upsert({
  nombre,
  rubro,
  email,
  password_hash: '-'
}, { onConflict: 'email' })

  if (negocioError) {
    msg.style.color = '#ff6b6b'
    msg.textContent = 'Error al crear el negocio. Intentá de nuevo.'
    return
  }

  msg.style.color = '#16a34a'
  msg.textContent = '¡Cuenta creada! Revisá tu email para confirmar tu cuenta.'
})

// ── VERIFICAR SI YA TIENE PERFIL ──
async function verificarPerfil() {
  const { data, error } = await db
    .from('negocios')
    .select('*')
    .eq('email', usuarioActual.email)
    .single()

  if (error || !data) {
  mostrarPantallaConfiguracion()
} else {
  negocioActual = data
  mostrarApp()
}
}

// ── PANTALLA CONFIGURACION ──
function mostrarPantallaConfiguracion() {
  document.getElementById('pantalla-login').style.display = 'none'
  document.getElementById('pantalla-configuracion').style.display = 'flex'
}

document.getElementById('btn-guardar-config').addEventListener('click', async () => {
  const nombre = document.getElementById('config-nombre').value.trim()
  const rubro = document.getElementById('config-rubro').value

  if (!nombre || !rubro) {
    document.getElementById('config-error').textContent = 'Completá todos los campos'
    return
  }

  const { data, error } = await db.from('negocios').insert({
    nombre: nombre,
    rubro: rubro,
    email: usuarioActual.email,
    password_hash: '-'
  }).select().single()

  if (error) {
    document.getElementById('config-error').textContent = 'Error al guardar. Intentá de nuevo.'
    return
  }

  negocioActual = data
  document.getElementById('pantalla-configuracion').style.display = 'none'
  mostrarApp()
})

// ── SALIR ──
document.getElementById('btn-salir').addEventListener('click', () => {
  document.getElementById('modal-cerrar-sesion').style.display = 'flex'
  lucide.createIcons()
})

// ── HAMBURGER ──
document.getElementById('btn-hamburger').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  const esMobile = window.innerWidth <= 768

  if (esMobile) {
    sidebar.classList.toggle('mobile-abierto')
    overlay.classList.toggle('visible')
  } else {
    sidebar.classList.toggle('colapsado')
  }
})

document.getElementById('sidebar-overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('mobile-abierto')
  document.getElementById('sidebar-overlay').classList.remove('visible')
})

// ── NAVEGACION ──
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const seccion = item.dataset.seccion

    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'))
    item.classList.add('active')

    document.querySelectorAll('[id^="seccion-"]').forEach(s => s.style.display = 'none')
    document.getElementById('seccion-' + seccion).style.display = 'block'

    if (seccion === 'dashboard') cargarDashboard()
    if (seccion === 'productos') cargarProductos()
    if (seccion === 'historial') cargarHistorial()
    if (seccion === 'caja') cargarCaja()
    if (seccion === 'reportes') {
  if (!verificarLimiteFree('reportes')) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'))
    document.querySelector('.menu-item[data-seccion="dashboard"]').classList.add('active')
    document.querySelectorAll('[id^="seccion-"]').forEach(s => s.style.display = 'none')
    document.getElementById('seccion-dashboard').style.display = 'block'
    return
  }
}

    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('mobile-abierto')
      document.getElementById('sidebar-overlay').classList.remove('visible')
    }
  })
})

// ── MOSTRAR APP ──
function mostrarApp() {
  document.getElementById('pantalla-login').style.display = 'none'
  document.getElementById('pantalla-app').style.display = 'block'
  document.getElementById('nav-email').textContent = negocioActual.nombre
  actualizarPerfilSidebar()
  cargarDashboard()
  if (negocioActual.pin_seguridad) toggleInfoSensible(false)
}

// ── MENSAJE LOGIN ──
function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje-error')
  el.textContent = texto
  el.style.color = tipo === 'error' ? '#ff6b6b' : '#16a34a'
}

// ── SESION ACTIVA ──
db.auth.getSession().then(async ({ data }) => {
  if (data.session) {
    usuarioActual = data.session.user
    await verificarPerfil()
  }
})

// DETECTAR CAMBIOS DE SESIÓN (cambio de email, etc)
db.auth.onAuthStateChange(async (event, session) => {
  console.log('AUTH EVENT:', event, session?.user?.email)

  if (event === 'USER_UPDATED' && session) {
    usuarioActual = session.user
    if (negocioActual) {
      await db.from('negocios')
        .update({ email: session.user.email })
        .eq('id', negocioActual.id)
      negocioActual.email = session.user.email
      const emailInput = document.getElementById('ajustes-email')
      if (emailInput) emailInput.value = session.user.email
      mostrarToast('Email actualizado correctamente!')
    }
  }

  if (event === 'SIGNED_IN' && session) {
    usuarioActual = session.user
    // Si el email del usuario es distinto al del negocio, actualizamos
    if (negocioActual && session.user.email !== negocioActual.email) {
      await db.from('negocios')
        .update({ email: session.user.email })
        .eq('id', negocioActual.id)
      negocioActual.email = session.user.email
      const emailInput = document.getElementById('ajustes-email')
      if (emailInput) emailInput.value = session.user.email
      mostrarToast('Email actualizado correctamente!')
    } else {
      await verificarPerfil()
    }
  }

  if (event === 'INITIAL_SESSION' && session) {
    usuarioActual = session.user
    await verificarPerfil()
  }
})

// ── PRODUCTOS ──
let categoriaActivaFiltro = null

async function cargarProductos() {
  const { data, error } = await db
    .from('productos')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .order('codigo', { ascending: true })

  const tbody = document.getElementById('tabla-productos')
  const alertaStock = document.getElementById('alerta-stock')
  const alertaTexto = document.getElementById('alerta-stock-texto')

  if (error || !data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="tabla-vacia">No hay productos todavía</td></tr>'
    alertaStock.style.display = 'none'
    document.getElementById('categorias-pills').innerHTML = ''
    return
  }

  // ALERTA STOCK BAJO
  const umbralStock = negocioActual.umbral_stock || 5
const productosBajoStock = data.filter(p => p.stock <= umbralStock)
  if (productosBajoStock.length > 0 && negocioActual.alertas_stock !== false) {
  alertaTexto.textContent = `${productosBajoStock.length} producto${productosBajoStock.length > 1 ? 's' : ''} con stock bajo (${umbralStock} unidades o menos)`
  alertaStock.style.display = 'flex'
} else {
  alertaStock.style.display = 'none'
}

  // PILLS DE CATEGORÍAS
  const categorias = [...new Set(data.map(p => p.categoria).filter(Boolean))]
  const pillsContainer = document.getElementById('categorias-pills')

  pillsContainer.innerHTML = [
    { label: 'Todos', valor: null },
    ...categorias.map(c => ({ label: c, valor: c }))
  ].map(cat => `
    <button 
      class="pill-categoria ${categoriaActivaFiltro === cat.valor ? 'activa' : ''}" 
      onclick="filtrarPorCategoria(${cat.valor ? `'${cat.valor}'` : null})">
      ${cat.label}
    </button>
  `).join('')

  // FILTRAR PRODUCTOS
  const productosFiltrados = categoriaActivaFiltro
    ? data.filter(p => p.categoria === categoriaActivaFiltro)
    : data

  if (productosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="tabla-vacia">No hay productos en esta categoría</td></tr>'
    return
  }

 tbody.innerHTML = productosFiltrados.map(p => `
  <tr class="${p.stock <= umbralStock && negocioActual.alertas_stock !== false ? 'stock-bajo' : ''}">
    <td>${p.codigo || '-'}</td>
    <td>${p.nombre}</td>
    <td class="info-sensible" style="filter:${infoDesbloqueada ? 'none' : 'blur(4px)'}; user-select:${infoDesbloqueada ? 'auto' : 'none'}">
  ${p.costo ? `
    <div style="font-size:13px">$${Number(p.costo).toLocaleString('es-AR')}</div>
    <div style="font-size:12px; color:${p.precio - p.costo > 0 ? 'var(--verde)' : '#dc2626'}; font-weight:600">
      +$${Number(p.precio - p.costo).toLocaleString('es-AR')}
    </div>
  ` : '-'}
</td>
    <td>$${Number(p.precio).toLocaleString('es-AR')}</td>
    <td>${p.precio_mayor ? '$' + Number(p.precio_mayor).toLocaleString('es-AR') : '-'}</td>
    <td>${p.precio_revendedor ? '$' + Number(p.precio_revendedor).toLocaleString('es-AR') : '-'}</td>
    <td>${p.stock <= umbralStock && negocioActual.alertas_stock !== false
  ? `<span class="badge-stock-bajo">${p.stock}</span>`
  : p.stock
}
</td>
    <td>${p.categoria || '-'}</td>
    <td class="acciones">
    ${p.codigo ? `<button class="btn-gris" style="padding:6px 10px" onclick="abrirCodigoOPremium('${p.id}', '${p.nombre}', ${p.precio}, ${p.precio_mayor || 0}, ${p.precio_revendedor || 0}, '${p.codigo}')"><i data-lucide="barcode" style="width:14px;height:14px"></i></button>` : ''}
      <button class="btn-gris" style="padding:6px 10px" onclick="abrirAjusteStock('${p.id}', '${p.nombre}', ${p.stock})"><i data-lucide="package" style="width:14px;height:14px"></i></button>
      <button class="btn-editar" onclick="abrirEditar('${p.id}', '${p.nombre}', ${p.precio}, ${p.stock}, '${p.categoria || ''}', '${p.codigo || ''}', ${p.costo || 0}, ${p.precio_mayor || 0}, ${p.precio_revendedor || 0})">Editar</button>
      <button class="btn-rojo" onclick="eliminarProducto('${p.id}')">Eliminar</button>
    </td>
  </tr>
`).join('')

if (negocioActual.pin_seguridad && !infoDesbloqueada) toggleInfoSensible(false)

  lucide.createIcons()
}

function filtrarPorCategoria(categoria) {
  categoriaActivaFiltro = categoria
  cargarProductos()
}

// ── ABRIR MODAL NUEVO ──
document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  document.getElementById('modal-titulo').textContent = 'Nuevo producto'
  document.getElementById('producto-id').value = ''
  document.getElementById('producto-nombre').value = ''
  document.getElementById('producto-precio').value = ''
  document.getElementById('producto-precio-mayor').value = ''
document.getElementById('producto-precio-revendedor').value = ''
  document.getElementById('producto-stock').value = ''
  document.getElementById('producto-categoria').value = ''
  document.getElementById('producto-codigo').value = ''
  document.getElementById('producto-costo').value = ''
  document.getElementById('modal-producto').style.display = 'flex'
  lucide.createIcons()
})

// ── CERRAR MODAL ──
document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
  document.getElementById('modal-producto').style.display = 'none'
})
document.getElementById('btn-cancelar-producto').addEventListener('click', () => {
  document.getElementById('modal-producto').style.display = 'none'
})

const btnGuardar = document.getElementById('btn-guardar-producto')
const btnGuardarNuevo = btnGuardar.cloneNode(true)
btnGuardar.parentNode.replaceChild(btnGuardarNuevo, btnGuardar)
btnGuardarNuevo.addEventListener('click', async () => {

// ── GUARDAR PRODUCTO ──
document.getElementById('btn-guardar-producto').addEventListener('click', async () => {
  const id = document.getElementById('producto-id').value
  const nombre = document.getElementById('producto-nombre').value.trim()
  const precio = parseFloat(document.getElementById('producto-precio').value)
  const stock = parseInt(document.getElementById('producto-stock').value)
  const categoria = document.getElementById('producto-categoria').value.trim()
  const codigo = document.getElementById('producto-codigo').value.trim()
  const costoInput = document.getElementById('producto-costo').value
  const costo = costoInput ? parseFloat(costoInput) : null
  const precioMayorInput = document.getElementById('producto-precio-mayor').value
  const precioMayor = precioMayorInput ? parseFloat(precioMayorInput) : null
  const precioRevendedorInput = document.getElementById('producto-precio-revendedor').value
  const precioRevendedor = precioRevendedorInput ? parseFloat(precioRevendedorInput) : null

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    mostrarToast('Completá nombre, precio y stock', 'error')
    return
  }

  const payload = { 
    nombre, precio, stock, categoria, codigo, costo,
    precio_mayor: precioMayor,
    precio_revendedor: precioRevendedor
  }

  let error

  if (id) {
    const res = await db.from('productos').update(payload).eq('id', id)
    error = res.error
  } else {
    const res = await db.from('productos').insert({ ...payload, negocio_id: negocioActual.id })
    error = res.error
  }

  if (error) {
    mostrarToast('Error al guardar el producto', 'error')
    return
  }

  document.getElementById('modal-producto').style.display = 'none'
  mostrarToast(id ? 'Producto actualizado!' : 'Producto agregado!')
  cargarProductos()
})

})

// ── EDITAR PRODUCTO ──
function abrirEditar(id, nombre, precio, stock, categoria, codigo, costo, precioMayor, precioRevendedor) {
  document.getElementById('modal-titulo').textContent = 'Editar producto'
  document.getElementById('producto-id').value = id
  document.getElementById('producto-nombre').value = nombre
  document.getElementById('producto-precio').value = precio
  document.getElementById('producto-stock').value = stock
  document.getElementById('producto-categoria').value = categoria
  document.getElementById('producto-codigo').value = codigo
  document.getElementById('producto-costo').value = costo || ''
  document.getElementById('producto-precio-mayor').value = precioMayor || ''
  document.getElementById('producto-precio-revendedor').value = precioRevendedor || ''
  document.getElementById('modal-producto').style.display = 'flex'
  lucide.createIcons()
}

document.getElementById('btn-guardar-producto').addEventListener('click', async () => {
  const id = document.getElementById('producto-id').value
  const nombre = document.getElementById('producto-nombre').value.trim()
  const precio = parseFloat(document.getElementById('producto-precio').value)
  const stock = parseInt(document.getElementById('producto-stock').value)
  const categoria = document.getElementById('producto-categoria').value.trim()
  const codigo = document.getElementById('producto-codigo').value.trim()
  const costoInput = document.getElementById('producto-costo').value
  const costo = costoInput ? parseFloat(costoInput) : null
  const precioMayorInput = document.getElementById('producto-precio-mayor').value
  const precioMayor = precioMayorInput ? parseFloat(precioMayorInput) : null
  const precioRevendedorInput = document.getElementById('producto-precio-revendedor').value
  const precioRevendedor = precioRevendedorInput ? parseFloat(precioRevendedorInput) : null

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    mostrarToast('Completá nombre, precio y stock', 'error')
    return
  }

  if (id) {
    await db.from('productos').update({ 
      nombre, precio, stock, categoria, codigo, costo,
      precio_mayor: precioMayor,
      precio_revendedor: precioRevendedor
    }).eq('id', id)
  } else {
    await db.from('productos').insert({ 
      nombre, precio, stock, categoria, codigo, costo,
      precio_mayor: precioMayor,
      precio_revendedor: precioRevendedor,
      negocio_id: negocioActual.id 
    })
  }

  document.getElementById('modal-producto').style.display = 'none'
  cargarProductos()
  mostrarToast('Producto guardado!')
})

// ── ELIMINAR PRODUCTO ──
async function eliminarProducto(id) {
  if (!confirm('¿Seguro que querés eliminar este producto?')) return
  await db.from('productos').delete().eq('id', id)
  cargarProductos()
}

// ── VENTAS ──
let itemsVenta = []

// BUSCAR PRODUCTO
document.getElementById('venta-buscar').addEventListener('input', async (e) => {
  const texto = e.target.value.trim()
  const resultados = document.getElementById('venta-resultados')

  if (texto.length < 1) {
    resultados.innerHTML = ''
    return
  }

  const { data } = await db
    .from('productos')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%`)
    .order('codigo', { ascending: true })
    .limit(8)

  if (!data || data.length === 0) {
    resultados.innerHTML = '<div class="resultado-item">No se encontraron productos</div>'
    return
  }

  resultados.innerHTML = data.map(p => `
    <div class="resultado-item" data-id="${p.id}" data-nombre="${p.nombre}" data-precio="${p.precio}" data-precio-mayor="${p.precio_mayor || 0}" data-precio-revendedor="${p.precio_revendedor || 0}" data-codigo="${p.codigo || ''}">
      <div>
        <div>${p.nombre}</div>
        <div class="resultado-codigo">${p.codigo || 'Sin código'}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end">
        <span class="resultado-precio">Min: $${Number(p.precio).toLocaleString('es-AR')}</span>
        ${p.precio_mayor ? `<span style="font-size:12px; color:var(--texto-suave)">May: $${Number(p.precio_mayor).toLocaleString('es-AR')}</span>` : ''}
        ${p.precio_revendedor ? `<span style="font-size:12px; color:var(--texto-suave)">Rev: $${Number(p.precio_revendedor).toLocaleString('es-AR')}</span>` : ''}
      </div>
    </div>
  `).join('')

  document.querySelectorAll('.resultado-item[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id
      const nombre = el.dataset.nombre
      const precio = parseFloat(el.dataset.precio)
      const precioMayor = parseFloat(el.dataset.precioMayor) || null
      const precioRevendedor = parseFloat(el.dataset.precioRevendedor) || null
      const codigo = el.dataset.codigo || null
      agregarItemVenta(id, nombre, precio, precioMayor, precioRevendedor, codigo)
    })
  })
})

// AGREGAR ITEM A LA VENTA
function agregarItemVenta(id, nombre, precio, precioMayor, precioRevendedor, codigo) {
  document.getElementById('venta-buscar').value = ''
  document.getElementById('venta-resultados').innerHTML = ''

  const existente = itemsVenta.find(i => i.id === id)
  if (existente) {
    existente.cantidad++
    cambiarCantidad(itemsVenta.indexOf(existente), 0)
    return
  }

  itemsVenta.push({ 
    id, 
    nombre, 
    precio,
    precio_base: precio,
    precio_mayor: precioMayor || null,
    precio_revendedor: precioRevendedor || null,
    tipo_precio: 'Minorista',
    cantidad: 1,
    codigo: codigo
  })

  renderizarItemsVenta()
}

// RENDERIZAR ITEMS
function renderizarItemsVenta() {
  const tbody = document.getElementById('venta-items')
  const wrapper = document.getElementById('venta-items-wrapper')

  if (itemsVenta.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">Agregá productos a la venta</td></tr>'
    wrapper.innerHTML = ''
    document.getElementById('venta-total').textContent = '$0'
    return
  }

  // TOTAL DE UNIDADES EN EL CARRITO
  const totalUnidades = itemsVenta.reduce((acc, i) => acc + i.cantidad, 0)
  const umbralMayor = negocioActual.umbral_mayor || 3
  const umbralRevendedor = negocioActual.umbral_revendedor || 5

  let tipoPrecioGlobal = 'Minorista'
  if (totalUnidades >= umbralRevendedor) tipoPrecioGlobal = 'Revendedor'
  else if (totalUnidades >= umbralMayor) tipoPrecioGlobal = 'Mayorista'

  // ACTUALIZAR PRECIO DE CADA ITEM SEGÚN EL TIPO GLOBAL
  itemsVenta.forEach(item => {
    if (tipoPrecioGlobal === 'Revendedor' && item.precio_revendedor) {
      item.precio = item.precio_revendedor
    } else if (tipoPrecioGlobal === 'Mayorista' && item.precio_mayor) {
      item.precio = item.precio_mayor
    } else {
      item.precio = item.precio_base
    }
    item.tipo_precio = tipoPrecioGlobal
  })

  // BADGE DE TIPO DE PRECIO GLOBAL
  const badgeColor = tipoPrecioGlobal === 'Revendedor' ? '#7c3aed' : tipoPrecioGlobal === 'Mayorista' ? '#2563eb' : 'var(--verde)'

  // DESKTOP
  tbody.innerHTML = itemsVenta.map((item, i) => `
    <tr>
      <td>
        ${item.nombre}
        <div style="font-size:11px; margin-top:2px">
          <span style="background:${badgeColor}; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px">${item.tipo_precio}</span>
        </div>
      </td>
      <td>$${Number(item.precio).toLocaleString('es-AR')}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px">
          <button class="btn-gris" style="padding:4px 10px" onclick="cambiarCantidad(${i}, -1)">-</button>
          <span>${item.cantidad}</span>
          <button class="btn-gris" style="padding:4px 10px" onclick="cambiarCantidad(${i}, 1)">+</button>
        </div>
      </td>
      <td>$${Number(item.precio * item.cantidad).toLocaleString('es-AR')}</td>
      <td><button class="btn-rojo" onclick="quitarItemVenta(${i})">Quitar</button></td>
    </tr>
  `).join('')

  // MOBILE CARDS
  wrapper.innerHTML = itemsVenta.map((item, i) => `
    <div class="venta-item-card">
      <div class="venta-item-info">
        <div class="venta-item-nombre">${item.nombre}</div>
        <div style="font-size:11px; margin-top:2px">
          <span style="background:${badgeColor}; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px">${item.tipo_precio}</span>
        </div>
        <div class="venta-item-precio">$${Number(item.precio * item.cantidad).toLocaleString('es-AR')}</div>
      </div>
      <div class="venta-item-controles">
        <button class="btn-gris" style="padding:4px 10px" onclick="cambiarCantidad(${i}, -1)">-</button>
        <span>${item.cantidad}</span>
        <button class="btn-gris" style="padding:4px 10px" onclick="cambiarCantidad(${i}, 1)">+</button>
        <button class="btn-rojo" style="padding:4px 10px" onclick="quitarItemVenta(${i})">✕</button>
      </div>
    </div>
  `).join('')

  calcularVuelto()

  // MOSTRAR TIPO DE PRECIO GLOBAL ARRIBA DEL RESUMEN
  const resumenTipo = document.getElementById('resumen-tipo-precio')
  if (resumenTipo) {
    resumenTipo.textContent = `Precio ${tipoPrecioGlobal} (${totalUnidades} unidades)`
    resumenTipo.style.color = badgeColor
  }

  calcularVuelto()
}

// CAMBIAR CANTIDAD
function cambiarCantidad(i, delta) {
  itemsVenta[i].cantidad += delta
  if (itemsVenta[i].cantidad <= 0) itemsVenta.splice(i, 1)
  renderizarItemsVenta()
}

// QUITAR ITEM
function quitarItemVenta(i) {
  itemsVenta.splice(i, 1)
  renderizarItemsVenta()
}

// VUELTO
document.getElementById('venta-efectivo').addEventListener('input', calcularVuelto)
document.getElementById('descuento-valor').addEventListener('input', () => {
  const valor = parseFloat(document.getElementById('descuento-valor').value) || 0
  if (valor > 0 && !esPremium()) {
    document.getElementById('descuento-valor').value = ''
    mostrarModalPremium('Los descuentos por venta son una función Premium. ¡Pasate a Premium para activarla!')
    return
  }
  calcularVuelto()
})
document.getElementById('descuento-tipo').addEventListener('change', calcularVuelto)
document.getElementById('venta-metodo').addEventListener('change', (e) => {
  document.getElementById('campo-efectivo').style.display = e.target.value === 'efectivo' ? 'flex' : 'none'
})

function calcularVuelto() {
  const subtotal = itemsVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const descuentoValor = parseFloat(document.getElementById('descuento-valor').value) || 0
  const descuentoTipo = document.getElementById('descuento-tipo').value

  let descuento = 0
  if (descuentoTipo === 'porcentaje') {
    descuento = subtotal * (descuentoValor / 100)
  } else {
    descuento = descuentoValor
  }

  const total = Math.max(0, subtotal - descuento)

  document.getElementById('venta-subtotal').textContent = '$' + subtotal.toLocaleString('es-AR')
  document.getElementById('venta-total').textContent = '$' + total.toLocaleString('es-AR')

  const efectivo = parseFloat(document.getElementById('venta-efectivo').value) || 0
  const vueltoBox = document.getElementById('vuelto-box')

  if (efectivo > 0) {
    const vuelto = efectivo - total
    document.getElementById('venta-vuelto').textContent = '$' + vuelto.toLocaleString('es-AR')
    vueltoBox.style.display = 'flex'
    document.getElementById('venta-vuelto').style.color = vuelto >= 0 ? 'var(--verde)' : '#dc2626'
  } else {
    vueltoBox.style.display = 'none'
  }
}

// CONFIRMAR VENTA

document.getElementById('btn-confirmar-venta').addEventListener('click', async () => {
  
  // VERIFICAR SI LA CAJA ESTÁ CERRADA
  const { inicio: inicioHoy, fin: finHoy } = getInicioFinHoy()
  const { data: cierreDia } = await db
    .from('caja')
    .select('id')
    .eq('negocio_id', negocioActual.id)
    .eq('tipo', 'cierre')
    .gte('fecha', inicioHoy)
    .lte('fecha', finHoy)
    .maybeSingle()

  if (cierreDia) {
    mostrarToast('La caja está cerrada. No podés registrar ventas hasta mañana.', 'error')
    return
  }

  if (itemsVenta.length === 0) {
    mostrarToast('Agregá al menos un producto', 'error')
    return
  }

  const subtotal = itemsVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
const descuentoValor = parseFloat(document.getElementById('descuento-valor').value) || 0
const descuentoTipo = document.getElementById('descuento-tipo').value
const descuento = descuentoTipo === 'porcentaje' ? subtotal * (descuentoValor / 100) : descuentoValor
const total = Math.max(0, subtotal - descuento)
const metodo = document.getElementById('venta-metodo').value

  const cliente = document.getElementById('venta-cliente').value.trim() || null

  const { data: venta, error } = await db.from('ventas').insert({
    negocio_id: negocioActual.id,
    total,
    metodo_pago: metodo,
    cliente
  }).select().single()

  if (error) {
    mostrarToast('Error al guardar la venta', 'error')
    return
  }

  await db.from('venta_items').insert(
    itemsVenta.map(i => ({
      venta_id: venta.id,
      producto_id: i.id,
      nombre_producto: i.nombre,
      precio_unitario: i.precio,
      cantidad: i.cantidad
    }))
  )

  // ACTUALIZAR STOCK
  for (const item of itemsVenta) {
    const { data: prod } = await db.from('productos').select('stock').eq('id', item.id).single()
    await db.from('productos').update({ stock: prod.stock - item.cantidad }).eq('id', item.id)
  }

  const itemsParaTicket = [...itemsVenta.map(i => ({
  nombre_producto: i.nombre,
  precio_unitario: i.precio,
  cantidad: i.cantidad,
  productos: { codigo: i.codigo || null }
}))]

  itemsVenta = []
renderizarItemsVenta()
document.getElementById('venta-efectivo').value = ''
document.getElementById('vuelto-box').style.display = 'none'
document.getElementById('venta-cliente').value = ''
document.getElementById('descuento-valor').value = ''

  mostrarToast('Venta registrada!')
  mostrarTicket(venta, itemsParaTicket)
})

// CANCELAR VENTA
document.getElementById('btn-cancelar-venta').addEventListener('click', () => {
  if (itemsVenta.length > 0 && !confirm('¿Cancelar la venta actual?')) return
  itemsVenta = []
  renderizarItemsVenta()
  document.getElementById('venta-efectivo').value = ''
  document.getElementById('vuelto-box').style.display = 'none'
})

// ── HISTORIAL ──
async function cargarHistorial(filtros = {}) {
  let query = db
    .from('ventas')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .order('fecha', { ascending: false })

    if (!esPremium() && filtros.desde) {
  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  const desdeDate = new Date(filtros.desde)
  if (desdeDate < hace30dias) {
    mostrarModalPremium('El historial completo es una función Premium. El plan gratuito solo muestra los últimos 30 días.')
    return
  }
}

if (!esPremium()) {
  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  query = query.gte('fecha', hace30dias.toISOString())
}

  if (filtros.desde) query = query.gte('fecha', filtros.desde + 'T00:00:00')
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta + 'T23:59:59')
  if (filtros.metodo) query = query.eq('metodo_pago', filtros.metodo)
  if (filtros.cliente) query = query.ilike('cliente', `%${filtros.cliente}%`)
  if (filtros.ticket) query = query.eq('numero_ticket', parseInt(filtros.ticket))

  const { data: ventas, error } = await query
  const tbody = document.getElementById('tabla-historial')
  const resumen = document.getElementById('filtros-resumen')

  if (error || !ventas || ventas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="tabla-vacia">No se encontraron ventas</td></tr>'
    resumen.style.display = 'none'
    return
  }

  const totalFiltrado = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  document.getElementById('filtros-cantidad').textContent = ventas.length
  document.getElementById('filtros-total').textContent = '$' + totalFiltrado.toLocaleString('es-AR')
  resumen.style.display = 'flex'

  tbody.innerHTML = ventas.map(v => {
    const fecha = new Date(v.fecha)
    const fechaTexto = fecha.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'}) + ' - ' + fecha.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires'})

    return `
      <tr class="fila-venta">
        <td onclick="toggleDetalle('${v.id}')"><button class="btn-expandir" id="flecha-${v.id}"><i data-lucide="chevron-right"></i></button></td>
        <td onclick="toggleDetalle('${v.id}')" style="font-weight:600; color:var(--verde)">#${v.numero_ticket || '-'}</td>
        <td onclick="toggleDetalle('${v.id}')">${fechaTexto}</td>
        <td onclick="toggleDetalle('${v.id}')">${v.cliente || '<span style="color:var(--texto-suave)">-</span>'}</td>
        <td onclick="toggleDetalle('${v.id}')"><span class="badge-metodo">${v.metodo_pago}</span></td>
        <td onclick="toggleDetalle('${v.id}')">$${Number(v.total).toLocaleString('es-AR')}</td>
        <td style="display:flex; gap:6px">
          <button class="btn-gris" style="padding:6px 10px" onclick="verTicketHistorial('${v.id}')"><i data-lucide="receipt" style="width:14px;height:14px"></i></button>
          <button class="btn-rojo" onclick="confirmarEliminarVenta('${v.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </td>
      </tr>
      <tr class="fila-detalle" id="detalle-${v.id}" style="display:none">
        <td colspan="7">
          <div class="detalle-contenido" id="detalle-contenido-${v.id}">
            Cargando...
          </div>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()
}

// ── BOTONES FILTROS ──
document.getElementById('btn-filtrar').addEventListener('click', () => {
  aplicarFiltrosHistorial()
})

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  document.getElementById('filtro-desde').value = ''
  document.getElementById('filtro-hasta').value = ''
  document.getElementById('filtro-metodo').value = ''
  document.getElementById('filtro-buscar').value = ''
  document.getElementById('filtros-resumen').style.display = 'none'
  cargarHistorial()
})

// BÚSQUEDA EN TIEMPO REAL
document.getElementById('filtro-buscar').addEventListener('input', () => {
  aplicarFiltrosHistorial()
})

function aplicarFiltrosHistorial() {
  const desde = document.getElementById('filtro-desde').value
  const hasta = document.getElementById('filtro-hasta').value
  const metodo = document.getElementById('filtro-metodo').value
  const buscar = document.getElementById('filtro-buscar').value.trim()

  // si empieza con # o es número lo tratamos como ticket
  const esTicket = buscar.startsWith('#') || /^\d+$/.test(buscar)
  const ticket = esTicket ? buscar.replace('#', '') : ''
  const cliente = !esTicket ? buscar : ''

  cargarHistorial({ desde, hasta, metodo, cliente, ticket })
}

// EXPANDIR / COLAPSAR DETALLE
async function toggleDetalle(ventaId) {
  const fila = document.getElementById('detalle-' + ventaId)
  const flecha = document.getElementById('flecha-' + ventaId)
  const contenido = document.getElementById('detalle-contenido-' + ventaId)

  const estaAbierto = fila.style.display === 'table-row'

  if (estaAbierto) {
    fila.style.display = 'none'
    flecha.classList.remove('abierto')
    return
  }

  fila.style.display = 'table-row'
  flecha.classList.add('abierto')

  const { data: items } = await db
    .from('venta_items')
    .select('*, productos(codigo)')
    .eq('venta_id', ventaId)

  if (!items || items.length === 0) {
    contenido.innerHTML = '<p style="color:var(--texto-suave); font-size:13px">Sin detalle</p>'
    return
  }

  contenido.innerHTML = items.map(i => `
    <div class="detalle-item">
      <span class="detalle-codigo">${i.productos?.codigo || '-'}</span>
      <span class="detalle-nombre">${i.nombre_producto}</span>
      <span class="detalle-cantidad">x${i.cantidad}</span>
      <span class="detalle-subtotal">$${Number(i.precio_unitario * i.cantidad).toLocaleString('es-AR')}</span>
    </div>
  `).join('')
}

// ── CAJA ──
let cajaAperturaActual = null

function getInicioFinHoy() {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
  return { inicio: inicio.toISOString(), fin: fin.toISOString() }
}

async function cargarCaja() {
  const { inicio, fin } = getInicioFinHoy()

  // VERIFICAR SI HAY CIERRE HOY
  const { data: cierre } = await db
    .from('caja')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .eq('tipo', 'cierre')
    .gte('fecha', inicio)
    .lte('fecha', fin)
    .maybeSingle()

  if (cierre) {
    document.getElementById('caja-sin-abrir').style.display = 'none'
    document.getElementById('caja-abierta').style.display = 'none'
    document.getElementById('caja-cerrada').style.display = 'flex'

    const efectivoReal = Number(cierre.monto)
    document.getElementById('cierre-resumen-texto').textContent = cierre.descripcion
    return
  }

  // VERIFICAR SI HAY APERTURA HOY
  const { data: apertura } = await db
    .from('caja')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .eq('tipo', 'apertura')
    .gte('fecha', inicio)
    .lte('fecha', fin)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!apertura) {
    document.getElementById('caja-sin-abrir').style.display = 'flex'
    document.getElementById('caja-abierta').style.display = 'none'
    document.getElementById('caja-cerrada').style.display = 'none'
    return
  }

  cajaAperturaActual = apertura
  document.getElementById('caja-sin-abrir').style.display = 'none'
  document.getElementById('caja-abierta').style.display = 'block'
  document.getElementById('caja-cerrada').style.display = 'none'

  await renderizarCaja(inicio, fin)
}

async function renderizarCaja(inicio, fin) {
  const { data: ventasHoy } = await db
    .from('ventas')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .eq('metodo_pago', 'efectivo')
    .gte('fecha', inicio)
    .lte('fecha', fin)

  const { data: egresosHoy } = await db
    .from('caja')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .eq('tipo', 'egreso')
    .gte('fecha', inicio)
    .lte('fecha', fin)

  const totalVentas = (ventasHoy || []).reduce((acc, v) => acc + Number(v.total), 0)
  const totalEgresos = (egresosHoy || []).reduce((acc, e) => acc + Number(e.monto), 0)
  const saldo = Number(cajaAperturaActual.monto) + totalVentas - totalEgresos

  document.getElementById('caja-card-apertura').textContent = '$' + Number(cajaAperturaActual.monto).toLocaleString('es-AR')
  document.getElementById('caja-card-ventas').textContent = '$' + totalVentas.toLocaleString('es-AR')
  document.getElementById('caja-card-egresos').textContent = '$' + totalEgresos.toLocaleString('es-AR')
  document.getElementById('caja-card-saldo').textContent = '$' + saldo.toLocaleString('es-AR')

  // TABLA DE MOVIMIENTOS
  const movimientos = []

  movimientos.push({
  hora: new Date(cajaAperturaActual.fecha),
  tipo: 'Apertura',
  descripcion: '-',
  categoria: null,
  monto: Number(cajaAperturaActual.monto),
  positivo: true
})

;(ventasHoy || []).forEach(v => {
  movimientos.push({
    hora: new Date(v.fecha),
    tipo: 'Venta',
    descripcion: 'Venta en efectivo',
    categoria: null,
    monto: Number(v.total),
    positivo: true
  })
})

  ;(egresosHoy || []).forEach(e => {
  movimientos.push({
    hora: new Date(e.fecha),
    tipo: 'Egreso',
    descripcion: e.descripcion || '-',
    categoria: e.categoria || null,
    monto: Number(e.monto),
    positivo: false
  })
})

  movimientos.sort((a, b) => b.hora - a.hora)

  const tbody = document.getElementById('tabla-movimientos')

  if (movimientos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">Sin movimientos</td></tr>'
    return
  }

  tbody.innerHTML = movimientos.map(m => `
  <tr>
    <td>${m.hora.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires'})}</td>
    <td><span class="badge-metodo">${m.tipo}</span></td>
    <td>
      ${m.categoria ? `<span class="badge-categoria">${m.categoria}</span>` : '-'}
    </td>
    <td>${m.descripcion}</td>
    <td style="color:${m.positivo ? 'var(--verde)' : '#dc2626'}">${m.positivo ? '+' : '-'}$${m.monto.toLocaleString('es-AR')}</td>
  </tr>
`).join('')
}

document.getElementById('btn-abrir-caja').addEventListener('click', async () => {
  const monto = parseFloat(document.getElementById('caja-monto-inicial').value)

  if (isNaN(monto) || monto < 0) {
    mostrarToast('Ingresá un monto válido', 'error')
    return
  }

  await db.from('caja').insert({
    negocio_id: negocioActual.id,
    tipo: 'apertura',
    monto: monto
  })

  document.getElementById('caja-monto-inicial').value = ''
  cargarCaja()
})

document.getElementById('btn-registrar-egreso').addEventListener('click', async () => {
  const monto = parseFloat(document.getElementById('egreso-monto').value)
  const descripcion = document.getElementById('egreso-descripcion').value.trim()
  const categoria = document.getElementById('egreso-categoria').value

  if (isNaN(monto) || monto <= 0) {
    mostrarToast('Ingresá un monto válido', 'error')
    return
  }

  await db.from('caja').insert({
    negocio_id: negocioActual.id,
    tipo: 'egreso',
    monto: monto,
    descripcion: descripcion,
    categoria: categoria
  })

  document.getElementById('egreso-monto').value = ''
  document.getElementById('egreso-descripcion').value = ''
  document.getElementById('egreso-categoria').value = 'insumos'

  mostrarToast('Egreso registrado!')
  cargarCaja()
})

// ── DASHBOARD ──
let graficaVentas = null

async function cargarDashboard() {
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0).toISOString()
  const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59).toISOString()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0).toISOString()
  const inicio7dias = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6, 0, 0, 0).toISOString()

  // VENTAS DEL DÍA
  const { data: ventasHoy } = await db
    .from('ventas')
    .select('total')
    .eq('negocio_id', negocioActual.id)
    .gte('fecha', inicioHoy)
    .lte('fecha', finHoy)

  const totalHoy = (ventasHoy || []).reduce((acc, v) => acc + Number(v.total), 0)

  // VENTAS DEL MES
  const { data: ventasMes } = await db
    .from('ventas')
    .select('total')
    .eq('negocio_id', negocioActual.id)
    .gte('fecha', inicioMes)

  const totalMes = (ventasMes || []).reduce((acc, v) => acc + Number(v.total), 0)
  const cantidadVentasMes = (ventasMes || []).length

  // CANTIDAD DE PRODUCTOS
  const { count: cantidadProductos } = await db
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('negocio_id', negocioActual.id)

  const ticketPromedio = cantidadVentasMes > 0 ? totalMes / cantidadVentasMes : 0

  document.querySelector('#seccion-dashboard .card:nth-child(1) .card-valor').textContent = '$' + totalHoy.toLocaleString('es-AR')
  document.querySelector('#seccion-dashboard .card:nth-child(2) .card-valor').textContent = '$' + totalMes.toLocaleString('es-AR')
  document.querySelector('#seccion-dashboard .card:nth-child(3) .card-valor').textContent = (cantidadProductos || 0).toString()
  document.querySelector('#seccion-dashboard .card:nth-child(4) .card-valor').textContent = '$' + Math.round(ticketPromedio).toLocaleString('es-AR')

  // VENTAS ÚLTIMOS 7 DÍAS
  const { data: ventas7dias } = await db
    .from('ventas')
    .select('total, fecha')
    .eq('negocio_id', negocioActual.id)
    .gte('fecha', inicio7dias)

  const labels = []
  const valores = []

  for (let i = 6; i >= 0; i--) {
    const dia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i)
    const diaStr = dia.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    labels.push(diaStr)

    const totalDia = (ventas7dias || [])
      .filter(v => {
        const fechaVenta = new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
        const fechaDia = dia.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
        return fechaVenta === fechaDia
      })
      .reduce((acc, v) => acc + Number(v.total), 0)

    valores.push(totalDia)
  }

  const ctx = document.getElementById('grafico-ventas').getContext('2d')
  if (graficaVentas) graficaVentas.destroy()

  graficaVentas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ventas',
        data: valores,
        backgroundColor: '#22c55e',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '$' + Number(ctx.raw).toLocaleString('es-AR')
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => '$' + Number(val).toLocaleString('es-AR')
          }
        }
      }
    }
  })

  // TOP 5 PRODUCTOS DEL MES
  const { data: itemsMes } = await db
    .from('venta_items')
    .select('nombre_producto, cantidad, precio_unitario, venta_id')
    .in('venta_id', 
      (await db.from('ventas').select('id').eq('negocio_id', negocioActual.id).gte('fecha', inicioMes)).data?.map(v => v.id) || []
    )

  const resumenProductos = {}
  ;(itemsMes || []).forEach(item => {
    if (!resumenProductos[item.nombre_producto]) {
      resumenProductos[item.nombre_producto] = { cantidad: 0, total: 0 }
    }
    resumenProductos[item.nombre_producto].cantidad += item.cantidad
    resumenProductos[item.nombre_producto].total += item.cantidad * item.precio_unitario
  })

  const top5 = Object.entries(resumenProductos)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5)

  const topContainer = document.getElementById('top-productos')

  if (top5.length === 0) {
    topContainer.innerHTML = '<p style="color:var(--texto-suave); font-size:14px">Sin ventas este mes todavía</p>'
  } else {
    topContainer.innerHTML = top5.map(([nombre, datos], i) => `
      <div class="top-producto-item">
        <div class="top-producto-rank">${i + 1}</div>
        <div class="top-producto-nombre">${nombre}</div>
        <div class="top-producto-cantidad">${datos.cantidad} uds</div>
        <div class="top-producto-total">$${Number(datos.total).toLocaleString('es-AR')}</div>
      </div>
    `).join('')
  }

  // COMPARATIVA SEMANAS
  const comparativaWrapper = document.querySelector('.comparativa-wrapper')
if (!esPremium()) {
  const comparativaWrapper = document.querySelector('.comparativa-wrapper')
  if (comparativaWrapper) {
    comparativaWrapper.style.position = 'relative'
    comparativaWrapper.style.overflow = 'hidden'
    comparativaWrapper.innerHTML += `
      <div style="position:absolute;inset:0;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(0,0,0,0.05)">
        <button onclick="mostrarModalPremium('La comparativa de semanas es una función Premium.')" style="background:var(--verde);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">
          🔒 Función Premium
        </button>
      </div>`
  }
  return
}
const inicioEstaSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - ahora.getDay() + 1)
const inicioSemanaAnterior = new Date(inicioEstaSemana)
inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7)
const finSemanaAnterior = new Date(inicioEstaSemana)
finSemanaAnterior.setDate(finSemanaAnterior.getDate() - 1)

const { data: ventasEstaSemana } = await db
  .from('ventas')
  .select('total')
  .eq('negocio_id', negocioActual.id)
  .gte('fecha', inicioEstaSemana.toISOString())

const { data: ventasSemanaAnterior } = await db
  .from('ventas')
  .select('total')
  .eq('negocio_id', negocioActual.id)
  .gte('fecha', inicioSemanaAnterior.toISOString())
  .lte('fecha', finSemanaAnterior.toISOString())

const totalActual = (ventasEstaSemana || []).reduce((acc, v) => acc + Number(v.total), 0)
const totalAnterior = (ventasSemanaAnterior || []).reduce((acc, v) => acc + Number(v.total), 0)
const transActual = (ventasEstaSemana || []).length
const transAnterior = (ventasSemanaAnterior || []).length
const ticketActual = transActual > 0 ? totalActual / transActual : 0
const ticketAnterior = transAnterior > 0 ? totalAnterior / transAnterior : 0

function setComparativa(idActual, idAnterior, idFlecha, idDiff, actual, anterior, esMonto) {
  const fmt = v => esMonto ? '$' + Math.round(v).toLocaleString('es-AR') : v.toString()
  document.getElementById(idActual).textContent = fmt(actual)
  document.getElementById(idAnterior).textContent = fmt(anterior)

  const diff = anterior > 0 ? ((actual - anterior) / anterior * 100).toFixed(1) : null
  const flecha = actual >= anterior ? '↑' : '↓'
  const color = actual >= anterior ? 'var(--verde)' : '#dc2626'
  const bgColor = actual >= anterior ? 'var(--verde-suave)' : '#fee2e2'

  document.getElementById(idFlecha).textContent = flecha
  document.getElementById(idFlecha).style.color = color

  const diffEl = document.getElementById(idDiff)
  if (diff !== null) {
    diffEl.textContent = `${actual >= anterior ? '+' : ''}${diff}% vs semana anterior`
    diffEl.style.color = color
    diffEl.style.background = bgColor
  } else {
    diffEl.textContent = 'Sin datos semana anterior'
    diffEl.style.color = 'var(--texto-suave)'
    diffEl.style.background = 'var(--fondo)'
  }
}

setComparativa('comp-total-actual', 'comp-total-anterior', 'comp-total-flecha', 'comp-total-diff', totalActual, totalAnterior, true)
setComparativa('comp-trans-actual', 'comp-trans-anterior', 'comp-trans-flecha', 'comp-trans-diff', transActual, transAnterior, false)
setComparativa('comp-ticket-actual', 'comp-ticket-anterior', 'comp-ticket-flecha', 'comp-ticket-diff', ticketActual, ticketAnterior, true)
}

// ── PERFIL / AJUSTES ──
function actualizarPerfilSidebar() {
  document.getElementById('sidebar-nombre-negocio').textContent = negocioActual.nombre

  const avatar = document.getElementById('avatar-iniciales')
  if (negocioActual.logo_url) {
    avatar.innerHTML = `<img src="${negocioActual.logo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
  } else {
    avatar.textContent = negocioActual.nombre.charAt(0).toUpperCase()
  }

  const badgePlan = document.getElementById('badge-plan')
  if (badgePlan) {
    const plan = negocioActual?.plan || 'free'
    badgePlan.textContent = plan === 'premium' ? 'PREMIUM' : 'FREE'
    badgePlan.style.background = plan === 'premium' ? 'var(--verde)' : '#6b7280'
  }
}

document.getElementById('btn-abrir-ajustes').addEventListener('click', () => {
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'))
  document.querySelectorAll('[id^="seccion-"]').forEach(s => s.style.display = 'none')
  document.getElementById('seccion-ajustes').style.display = 'block'

  document.getElementById('ajustes-nombre').value = negocioActual.nombre
  document.getElementById('ajustes-rubro').value = negocioActual.rubro
  document.getElementById('ajustes-instagram').value = negocioActual.instagram || ''
  document.getElementById('ajustes-direccion').value = negocioActual.direccion || ''
  document.getElementById('ajustes-telefono').value = negocioActual.telefono || ''
  document.getElementById('ajustes-email').value = usuarioActual.email || ''
  document.getElementById('ajustes-umbral-mayor').value = negocioActual.umbral_mayor || 3
  document.getElementById('ajustes-umbral-revendedor').value = negocioActual.umbral_revendedor || 5
  document.getElementById('ajustes-umbral-stock').value = negocioActual.umbral_stock || 5
  const alertasActivas = negocioActual.alertas_stock !== false
document.getElementById('ajustes-alertas-stock').checked = alertasActivas
const inputStock = document.getElementById('ajustes-umbral-stock')
inputStock.disabled = !alertasActivas
inputStock.style.opacity = alertasActivas ? '1' : '0.4'
inputStock.style.cursor = alertasActivas ? 'auto' : 'not-allowed'
  document.getElementById('ajustes-pin').value = negocioActual.pin_seguridad ? '****' : ''

  if (negocioActual.logo_url) {
    document.getElementById('logo-preview').src = negocioActual.logo_url
    document.getElementById('logo-preview').style.display = 'block'
    document.getElementById('logo-placeholder').style.display = 'none'
  }

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-abierto')
    document.getElementById('sidebar-overlay').classList.remove('visible')
  }

  lucide.createIcons()
})

// GUARDAR INFO NEGOCIO
document.getElementById('btn-guardar-info-negocio').addEventListener('click', async () => {
  const nombre = document.getElementById('ajustes-nombre').value.trim()
  const rubro = document.getElementById('ajustes-rubro').value
  const instagram = document.getElementById('ajustes-instagram').value.trim()

  if (!nombre) {
    document.getElementById('ajustes-mensaje-info').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje-info').textContent = 'El nombre no puede estar vacío'
    return
  }

  const { error } = await db.from('negocios').update({ nombre, rubro, instagram }).eq('id', negocioActual.id)

  if (error) {
    document.getElementById('ajustes-mensaje-info').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje-info').textContent = 'Error al guardar'
    return
  }

  negocioActual.nombre = nombre
  negocioActual.rubro = rubro
  negocioActual.instagram = instagram
  actualizarPerfilSidebar()
  document.getElementById('nav-email').textContent = nombre
  document.getElementById('ajustes-mensaje-info').style.color = 'var(--verde)'
  document.getElementById('ajustes-mensaje-info').textContent = 'Cambios guardados!'
})

// GUARDAR CONTACTO + EMAIL
document.getElementById('btn-guardar-contacto').addEventListener('click', async () => {
  const direccion = document.getElementById('ajustes-direccion').value.trim()
  const telefono = document.getElementById('ajustes-telefono').value.trim()

  const { error } = await db.from('negocios').update({ direccion, telefono }).eq('id', negocioActual.id)

  if (error) {
    document.getElementById('ajustes-mensaje-contacto').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje-contacto').textContent = 'Error al guardar'
    return
  }

  negocioActual.direccion = direccion
  negocioActual.telefono = telefono
  document.getElementById('ajustes-mensaje-contacto').style.color = 'var(--verde)'
  document.getElementById('ajustes-mensaje-contacto').textContent = 'Datos guardados!'
})

// ── BOTÓN CANDADO ──
document.getElementById('btn-toggle-pin').addEventListener('click', () => {
  if (!negocioActual.pin_seguridad) {
    infoDesbloqueada = !infoDesbloqueada
    const celdas = document.querySelectorAll('.info-sensible')
    celdas.forEach(el => {
      el.style.filter = infoDesbloqueada ? 'none' : 'blur(4px)'
      el.style.userSelect = infoDesbloqueada ? 'auto' : 'none'
    })
    const btn = document.getElementById('btn-toggle-pin')
    btn.innerHTML = infoDesbloqueada
      ? '<i data-lucide="unlock" style="width:13px;height:13px"></i>'
      : '<i data-lucide="lock" style="width:13px;height:13px"></i>'
    lucide.createIcons()
    return
  }

  if (infoDesbloqueada) {
    toggleInfoSensible(false)
    return
  }

  // Limpiar inputs y abrir modal
  document.querySelectorAll('.pin-input').forEach(input => input.value = '')
  document.getElementById('pin-error').textContent = ''
  document.getElementById('modal-pin').style.display = 'flex'
  document.querySelectorAll('.pin-input')[0].focus()
  lucide.createIcons()
})

// NAVEGACIÓN ENTRE INPUTS DEL PIN
document.querySelectorAll('.pin-input').forEach((input, i, inputs) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && i < inputs.length - 1) {
      inputs[i + 1].focus()
    }
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && i > 0) {
      inputs[i - 1].focus()
    }
  })
})

document.getElementById('btn-cerrar-modal-pin').addEventListener('click', () => {
  document.getElementById('modal-pin').style.display = 'none'
})

document.getElementById('btn-cancelar-pin').addEventListener('click', () => {
  document.getElementById('modal-pin').style.display = 'none'
})

document.getElementById('btn-confirmar-pin').addEventListener('click', () => {
  const pinIngresado = Array.from(document.querySelectorAll('.pin-input')).map(i => i.value).join('')

  if (pinIngresado.length < 4) {
    document.getElementById('pin-error').textContent = 'Ingresá los 4 dígitos'
    return
  }

  if (pinIngresado === negocioActual.pin_seguridad) {
    document.getElementById('modal-pin').style.display = 'none'
    toggleInfoSensible(true)
    mostrarToast('Info desbloqueada!')
  } else {
    document.getElementById('pin-error').textContent = 'PIN incorrecto, intentá de nuevo'
    document.querySelectorAll('.pin-input').forEach(input => input.value = '')
    document.querySelectorAll('.pin-input')[0].focus()
  }
})

// ── LOGO DEL NEGOCIO ──
let logoArchivo = null

document.getElementById('logo-zona').addEventListener('click', () => {
  document.getElementById('logo-archivo').click()
})

document.getElementById('logo-archivo').addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    mostrarToast('El logo no puede superar 2MB', 'error')
    return
  }

  logoArchivo = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    document.getElementById('logo-preview').src = ev.target.result
    document.getElementById('logo-preview').style.display = 'block'
    document.getElementById('logo-placeholder').style.display = 'none'
    document.getElementById('btn-guardar-logo').style.display = 'flex'
  }
  reader.readAsDataURL(file)
})

document.getElementById('btn-guardar-logo').addEventListener('click', async () => {
  if (!logoArchivo) return

  const msg = document.getElementById('ajustes-mensaje-logo')
  const extension = logoArchivo.name.split('.').pop()
  const nombreArchivo = `${negocioActual.id}.${extension}`

  const { error: uploadError } = await db.storage
    .from('logos')
    .upload(nombreArchivo, logoArchivo, { upsert: true })

  if (uploadError) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Error al subir el logo'
    return
  }

  const { data: urlData } = db.storage.from('logos').getPublicUrl(nombreArchivo)
  const logoUrl = urlData.publicUrl

  const { error } = await db.from('negocios').update({ logo_url: logoUrl }).eq('id', negocioActual.id)

  if (error) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Error al guardar el logo'
    return
  }

  negocioActual.logo_url = logoUrl
  msg.style.color = 'var(--verde)'
  msg.textContent = 'Logo guardado!'
  logoArchivo = null
  document.getElementById('btn-guardar-logo').style.display = 'none'
  actualizarPerfilSidebar()
})

// ── PIN DE SEGURIDAD ──
let infoDesbloqueada = false

function toggleInfoSensible(mostrar) {
  infoDesbloqueada = mostrar
  const celdas = document.querySelectorAll('.info-sensible')
  celdas.forEach(el => {
    el.style.filter = mostrar ? 'none' : 'blur(4px)'
    el.style.userSelect = mostrar ? 'auto' : 'none'
  })

  // BLOQUEAR/DESBLOQUEAR BOTONES DE ACCIONES (excepto el de código de barras)
document.querySelectorAll('#tabla-productos .acciones button').forEach(btn => {
  if (btn.getAttribute('onclick')?.includes('verCodigoBarras')) return
  btn.disabled = !mostrar
  btn.style.opacity = mostrar ? '1' : '0.3'
  btn.style.cursor = mostrar ? 'pointer' : 'not-allowed'
})
  const btn = document.getElementById('btn-toggle-pin')
  if (btn) {
    btn.innerHTML = mostrar
      ? '<i data-lucide="unlock" style="width:14px;height:14px"></i>'
      : '<i data-lucide="lock" style="width:14px;height:14px"></i>'
    lucide.createIcons()
  }
}

// CAMBIAR EMAIL
document.getElementById('btn-guardar-email').addEventListener('click', async () => {
  const emailNuevo = document.getElementById('ajustes-email').value.trim()
  const msg = document.getElementById('ajustes-mensaje-email')

  if (!emailNuevo) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Ingresá un email válido'
    return
  }

  if (emailNuevo === usuarioActual.email) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Ese ya es tu email actual'
    return
  }

  const { error } = await db.auth.updateUser({ email: emailNuevo })

  if (error) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Error al cambiar el email: ' + error.message
    return
  }

  msg.style.color = 'var(--verde)'
  msg.textContent = 'Revisá tu email nuevo para confirmar el cambio!'
})

// CAMBIAR CONTRASEÑA
document.getElementById('btn-guardar-password').addEventListener('click', async () => {
  const passwordNueva = document.getElementById('ajustes-password-nueva').value
  const passwordConfirmar = document.getElementById('ajustes-password-confirmar').value
  const msg = document.getElementById('ajustes-mensaje-password')

  if (!passwordNueva || !passwordConfirmar) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Completá los dos campos'
    return
  }

  if (passwordNueva.length < 6) {
    msg.style.color = '#dc2626'
    msg.textContent = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (passwordNueva !== passwordConfirmar) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Las contraseñas no coinciden'
    return
  }

  const { error } = await db.auth.updateUser({ password: passwordNueva })

  if (error) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Error al cambiar la contraseña'
    return
  }

document.getElementById('ajustes-password-nueva').value = ''
  document.getElementById('ajustes-password-confirmar').value = ''
  msg.style.color = 'var(--verde)'
  msg.textContent = 'Contraseña actualizada!'
})

// GUARDAR PIN
document.getElementById('btn-guardar-pin').addEventListener('click', async () => {
  const pin = document.getElementById('ajustes-pin').value.trim()
  const msg = document.getElementById('ajustes-mensaje-password')

  if (pin && (pin.length !== 4 || isNaN(pin))) {
    msg.style.color = '#dc2626'
    msg.textContent = 'El PIN debe ser de exactamente 4 dígitos numéricos'
    return
  }

  const { error } = await db.from('negocios').update({ pin_seguridad: pin || null }).eq('id', negocioActual.id)

  if (error) {
    msg.style.color = '#dc2626'
    msg.textContent = 'Error al guardar el PIN'
    return
  }

  negocioActual.pin_seguridad = pin || null
  msg.style.color = 'var(--verde)'
  msg.textContent = pin ? 'PIN guardado!' : 'PIN eliminado'
  document.getElementById('ajustes-pin').value = pin ? '****' : ''
})

// GUARDAR PRECIOS
document.getElementById('btn-guardar-precios').addEventListener('click', async () => {
  const umbralMayor = parseInt(document.getElementById('ajustes-umbral-mayor').value) || 3
  const umbralRevendedor = parseInt(document.getElementById('ajustes-umbral-revendedor').value) || 5
  const umbralStock = parseInt(document.getElementById('ajustes-umbral-stock').value) || 5
  const alertasStock = document.getElementById('ajustes-alertas-stock').checked

  const { error } = await db.from('negocios').update({
    umbral_mayor: umbralMayor,
    umbral_revendedor: umbralRevendedor,
    umbral_stock: umbralStock,
    alertas_stock: alertasStock
  }).eq('id', negocioActual.id)

  if (error) {
    document.getElementById('ajustes-mensaje-precios').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje-precios').textContent = 'Error al guardar'
    return
  }

  negocioActual.umbral_mayor = umbralMayor
  negocioActual.umbral_revendedor = umbralRevendedor
  negocioActual.umbral_stock = umbralStock
  negocioActual.alertas_stock = alertasStock
  document.getElementById('ajustes-mensaje-precios').style.color = 'var(--verde)'
  document.getElementById('ajustes-mensaje-precios').textContent = 'Cambios guardados!'
})

// ── MODO OSCURO ──
const toggleTema = document.getElementById('toggle-tema')

function aplicarTemaGuardado() {
  const temaGuardado = localStorageDisponible() ? localStorage.getItem('finesse-tema') : null
  if (temaGuardado === 'oscuro') {
    document.body.classList.add('modo-oscuro')
    toggleTema.checked = true
  }
}

function localStorageDisponible() {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

toggleTema.addEventListener('change', () => {
  if (toggleTema.checked) {
    document.body.classList.add('modo-oscuro')
    if (localStorageDisponible()) localStorage.setItem('finesse-tema', 'oscuro')
  } else {
    document.body.classList.remove('modo-oscuro')
    if (localStorageDisponible()) localStorage.setItem('finesse-tema', 'claro')
  }
})

aplicarTemaGuardado()

// ── LOGO LLEVA AL DASHBOARD ──
document.getElementById('btn-ir-dashboard').addEventListener('click', () => {
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'))
  document.querySelector('.menu-item[data-seccion="dashboard"]').classList.add('active')

  document.querySelectorAll('[id^="seccion-"]').forEach(s => s.style.display = 'none')
  document.getElementById('seccion-dashboard').style.display = 'block'

  cargarDashboard()

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-abierto')
    document.getElementById('sidebar-overlay').classList.remove('visible')
  }
})

// ── TOAST ──
function mostrarToast(texto, tipo = 'exito') {
  const toast = document.getElementById('toast')
  toast.textContent = tipo === 'exito' ? '✓ ' + texto : '✕ ' + texto
  toast.className = 'toast' + (tipo === 'error' ? ' error' : '')

  setTimeout(() => toast.classList.add('visible'), 10)

  setTimeout(() => {
    toast.classList.remove('visible')
  }, 3500)
}

// ── ELIMINAR VENTA ──
let ventaAEliminar = null

function confirmarEliminarVenta(id) {
  ventaAEliminar = id
  document.getElementById('modal-eliminar-venta').style.display = 'flex'
  lucide.createIcons()
}

document.getElementById('btn-cerrar-modal-eliminar').addEventListener('click', () => {
  document.getElementById('modal-eliminar-venta').style.display = 'none'
  ventaAEliminar = null
})

document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => {
  document.getElementById('modal-eliminar-venta').style.display = 'none'
  ventaAEliminar = null
})

document.getElementById('btn-confirmar-eliminar').addEventListener('click', async () => {
  if (!ventaAEliminar) return

  await db.from('venta_items').delete().eq('venta_id', ventaAEliminar)
  await db.from('ventas').delete().eq('id', ventaAEliminar)

  document.getElementById('modal-eliminar-venta').style.display = 'none'
  ventaAEliminar = null

  mostrarToast('Venta eliminada')
  cargarHistorial()
  cargarDashboard()
})

// ── CIERRE DE CAJA ──
document.getElementById('cierre-efectivo-real').addEventListener('input', () => {
  const efectivoReal = parseFloat(document.getElementById('cierre-efectivo-real').value) || 0
  const saldoEsperado = parseFloat(document.getElementById('caja-card-saldo').textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0
  const diferencia = efectivoReal - saldoEsperado

  document.getElementById('cierre-esperado').textContent = '$' + saldoEsperado.toLocaleString('es-AR')
  document.getElementById('cierre-real').textContent = '$' + efectivoReal.toLocaleString('es-AR')
  document.getElementById('cierre-diferencia').textContent = (diferencia >= 0 ? '+' : '') + '$' + diferencia.toLocaleString('es-AR')
  document.getElementById('cierre-diferencia').style.color = diferencia >= 0 ? 'var(--verde)' : '#dc2626'
  document.getElementById('cierre-comparacion').style.display = 'flex'
})

document.getElementById('btn-cerrar-caja').addEventListener('click', async () => {
  const efectivoReal = parseFloat(document.getElementById('cierre-efectivo-real').value)

  if (isNaN(efectivoReal) || efectivoReal < 0) {
    mostrarToast('Ingresá el efectivo real contado', 'error')
    return
  }

  const saldoEsperado = parseFloat(document.getElementById('caja-card-saldo').textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0
  const diferencia = efectivoReal - saldoEsperado

  const { error } = await db.from('caja').insert({
    negocio_id: negocioActual.id,
    tipo: 'cierre',
    monto: efectivoReal,
    efectivo_real: efectivoReal,
    descripcion: `Cierre de caja. Esperado: $${saldoEsperado.toLocaleString('es-AR')} | Real: $${efectivoReal.toLocaleString('es-AR')} | Diferencia: $${diferencia.toLocaleString('es-AR')}`
  })

  if (error) {
    mostrarToast('Error al cerrar la caja', 'error')
    return
  }

  mostrarToast('Caja cerrada correctamente!')
  cargarCaja()
})

// ── TICKET ──
function mostrarTicket(venta, items) {
  const fecha = new Date(venta.fecha)
  const fechaTexto = fecha.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'})
  const horaTexto = fecha.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires'})

  const rubros = {
  'ropa': 'Ropa y accesorios',
  'ferreteria': 'Ferretería',
  'kiosco': 'Kiosco',
  'mates': 'Mates y derivados',
  'emprendimiento': 'Emprendimiento',
  'otro': 'Otro'
}
const rubro = rubros[negocioActual.rubro] || negocioActual.rubro || ''

  document.getElementById('ticket-contenido').innerHTML = `
    <div class="ticket-wrapper">

      <div class="ticket-header">
  <div class="ticket-negocio">${negocioActual.nombre.toUpperCase()}</div>
  ${rubro ? `<div class="ticket-subnegocio">${rubro}</div>` : ''}
  ${negocioActual.direccion ? `<div class="ticket-fecha">${negocioActual.direccion}</div>` : ''}
  ${negocioActual.telefono ? `<div class="ticket-fecha">Tel: ${negocioActual.telefono}</div>` : ''}
  ${negocioActual.instagram ? `<div class="ticket-fecha">${negocioActual.instagram}</div>` : ''}
</div>

      <hr class="ticket-separador">

      <div class="ticket-info-fila">
        <span>Ticket N°:</span>
        <span><strong>${venta.numero_ticket || '-'}</strong></span>
      </div>
      <div class="ticket-info-fila">
        <span>Fecha:</span>
        <span>${fechaTexto}</span>
      </div>
      <div class="ticket-info-fila">
        <span>Hora:</span>
        <span>${horaTexto}</span>
      </div>
      ${venta.cliente ? `
      <div class="ticket-info-fila">
        <span>Cliente:</span>
        <span><strong>${venta.cliente.toUpperCase()}</strong></span>
      </div>` : ''}

      <hr class="ticket-separador">

      <div class="ticket-col-header">
        <span>Producto</span>
        <span style="text-align:center">Cant</span>
        <span style="text-align:right">Subtotal</span>
      </div>

      <hr class="ticket-separador">

      <div>
        ${items.map(i => `
          <div class="ticket-item">
            <span class="ticket-item-nombre">${i.nombre_producto}</span>
            <span class="ticket-item-cantidad">x${i.cantidad}</span>
            <span class="ticket-item-subtotal">$${Number(i.precio_unitario * i.cantidad).toLocaleString('es-AR')}</span>
          </div>
          <div style="font-size:11px; color:#555; padding: 0 0 4px 0">
            1 x $${Number(i.precio_unitario).toLocaleString('es-AR')}
          </div>
        `).join('')}
      </div>

      <hr class="ticket-separador">

      <div class="ticket-total-fila">
        <span>TOTAL:</span>
        <span>$${Number(venta.total).toLocaleString('es-AR')}</span>
      </div>

      <div class="ticket-metodo">Pago: ${venta.metodo_pago.toUpperCase()}</div>

      <hr class="ticket-separador">

      <div class="ticket-footer">
  ${negocioActual.mensaje_ticket || 'No válido como factura'}<br>
  ¡Gracias por su compra!
</div>

    </div>
  `

  document.getElementById('modal-ticket').style.display = 'flex'
  lucide.createIcons()

}

document.getElementById('btn-cerrar-ticket').addEventListener('click', () => {
  document.getElementById('modal-ticket').style.display = 'none'
})

document.getElementById('btn-cerrar-ticket-2').addEventListener('click', () => {
  document.getElementById('modal-ticket').style.display = 'none'
})

document.getElementById('btn-imprimir-ticket').addEventListener('click', () => {
  window.print()
})

async function verTicketHistorial(ventaId) {
  const { data: venta } = await db
    .from('ventas')
    .select('*')
    .eq('id', ventaId)
    .single()

  const { data: items } = await db
    .from('venta_items')
    .select('*, productos(codigo)')
    .eq('venta_id', ventaId)

  mostrarTicket(venta, items || [])
}

// ── REPORTES ──
function setFechasReporte(desde, hasta) {
  document.getElementById('reporte-desde').value = desde
  document.getElementById('reporte-hasta').value = hasta
}

document.getElementById('reporte-hoy').addEventListener('click', () => {
  const hoy = new Date().toISOString().split('T')[0]
  setFechasReporte(hoy, hoy)
})

document.getElementById('reporte-semana').addEventListener('click', () => {
  const hoy = new Date()
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
  setFechasReporte(lunes.toISOString().split('T')[0], hoy.toISOString().split('T')[0])
})

document.getElementById('reporte-mes').addEventListener('click', () => {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  setFechasReporte(inicioMes, hoy.toISOString().split('T')[0])
})

document.getElementById('btn-generar-reporte').addEventListener('click', async () => {
  const desde = document.getElementById('reporte-desde').value
  const hasta = document.getElementById('reporte-hasta').value

  if (!desde || !hasta) {
    mostrarToast('Seleccioná un período', 'error')
    return
  }

  const { data: ventas } = await db
    .from('ventas')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .gte('fecha', desde + 'T00:00:00')
    .lte('fecha', hasta + 'T23:59:59')

  if (!ventas || ventas.length === 0) {
    mostrarToast('No hay ventas en ese período', 'error')
    document.getElementById('reporte-resultado').style.display = 'none'
    return
  }

  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const ticketPromedio = totalVentas / ventas.length

  document.getElementById('reporte-total').textContent = '$' + totalVentas.toLocaleString('es-AR')
  document.getElementById('reporte-transacciones').textContent = ventas.length
  document.getElementById('reporte-ticket').textContent = '$' + Math.round(ticketPromedio).toLocaleString('es-AR')

  // MÉTODOS DE PAGO
  const metodos = {}
  ventas.forEach(v => {
    metodos[v.metodo_pago] = (metodos[v.metodo_pago] || 0) + Number(v.total)
  })

  const maxMetodo = Math.max(...Object.values(metodos))
  document.getElementById('reporte-metodos').innerHTML = Object.entries(metodos)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, monto]) => `
  <div class="metodo-fila metodo-venta-fila">
    <span class="metodo-nombre">${nombre}</span>
        <div class="metodo-barra-wrapper">
          <div class="metodo-barra" style="width:${(monto/maxMetodo*100).toFixed(0)}%"></div>
        </div>
        <span class="metodo-monto">$${monto.toLocaleString('es-AR')}</span>
      </div>
    `).join('')

  // TOP PRODUCTOS + GANANCIA
  const ventaIds = ventas.map(v => v.id)
  const { data: items } = await db
    .from('venta_items')
    .select('*, productos(costo)')
    .in('venta_id', ventaIds)

  const resumen = {}
  let gananciaTotal = 0

  ;(items || []).forEach(i => {
    const costo = i.productos?.costo || 0
    const ganancia = (i.precio_unitario - costo) * i.cantidad
    gananciaTotal += ganancia

    if (!resumen[i.nombre_producto]) {
      resumen[i.nombre_producto] = { cantidad: 0, total: 0 }
    }
    resumen[i.nombre_producto].cantidad += i.cantidad
    resumen[i.nombre_producto].total += i.precio_unitario * i.cantidad
  })

  document.getElementById('reporte-ganancia').textContent = '$' + Math.round(gananciaTotal).toLocaleString('es-AR')

  const top = Object.entries(resumen)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5)

  document.getElementById('reporte-top-productos').innerHTML = top.length === 0
    ? '<p style="color:var(--texto-suave); font-size:14px">Sin datos</p>'
    : top.map(([nombre, datos], i) => `
      <div class="top-producto-item">
        <div class="top-producto-rank">${i + 1}</div>
        <div class="top-producto-nombre">${nombre}</div>
        <div class="top-producto-cantidad">${datos.cantidad} uds</div>
        <div class="top-producto-total">$${Number(datos.total).toLocaleString('es-AR')}</div>
      </div>
    `).join('')

    // EGRESOS POR CATEGORÍA
const { data: egresosPeriodo } = await db
  .from('caja')
  .select('*')
  .eq('negocio_id', negocioActual.id)
  .eq('tipo', 'egreso')
  .gte('fecha', desde + 'T00:00:00')
  .lte('fecha', hasta + 'T23:59:59')

const categorias = {}
;(egresosPeriodo || []).forEach(e => {
  const cat = e.categoria || 'otros'
  categorias[cat] = (categorias[cat] || 0) + Number(e.monto)
})

const totalEgresosPeriodo = Object.values(categorias).reduce((acc, v) => acc + v, 0)

document.getElementById('reporte-egresos').innerHTML = Object.keys(categorias).length === 0
  ? '<p style="color:var(--texto-suave); font-size:14px">Sin egresos en este período</p>'
  : Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, monto]) => `
  <div class="metodo-fila metodo-egreso-fila">
    <span class="metodo-nombre" style="text-transform:capitalize">${cat}</span>
        <div class="metodo-barra-wrapper">
          <div class="metodo-barra" style="width:${((monto/totalEgresosPeriodo)*100).toFixed(0)}%; background:#7c3aed"></div>
        </div>
        <span class="metodo-monto" style="color:#7c3aed">$${monto.toLocaleString('es-AR')}</span>
      </div>
    `).join('')

  document.getElementById('reporte-resultado').style.display = 'block'
  lucide.createIcons()
})

// ── DESCARGAR PDF TICKET ──
document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] })

  const ticket = document.getElementById('ticket-contenido')
  const negocio = ticket.querySelector('.ticket-negocio')?.textContent || ''
  const fecha = ticket.querySelector('.ticket-fecha')?.textContent || ''
  const items = ticket.querySelectorAll('.ticket-item')
  const total = ticket.querySelector('.ticket-total-fila span:last-child')?.textContent || ''
  const metodo = ticket.querySelector('.ticket-metodo')?.textContent || ''

  let y = 10

  // NEGOCIO
  doc.setFontSize(14)
  doc.setFont('courier', 'bold')
  doc.text(negocio.toUpperCase(), 40, y, { align: 'center' })
  y += 6

  // FECHA
  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  doc.text(fecha, 40, y, { align: 'center' })
  y += 4

  // SEPARADOR
  doc.setLineDashPattern([1, 1], 0)
  doc.line(5, y, 75, y)
  y += 5

  // HEADER COLUMNAS
  doc.setFontSize(8)
  doc.setFont('courier', 'bold')
  doc.text('PRODUCTO', 5, y)
  doc.text('CANT', 52, y, { align: 'center' })
  doc.text('SUBTOTAL', 75, y, { align: 'right' })
  y += 3

  doc.line(5, y, 75, y)
  y += 4

  // ITEMS
  doc.setFont('courier', 'normal')
  items.forEach(item => {
    const nombre = item.querySelector('.ticket-item-nombre')?.textContent || ''
    const cantidad = item.querySelector('.ticket-item-cantidad')?.textContent || ''
    const subtotal = item.querySelector('.ticket-item-subtotal')?.textContent || ''

    const nombreCorto = nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre
    doc.text(nombreCorto, 5, y)
    doc.text(cantidad, 52, y, { align: 'center' })
    doc.text(subtotal, 75, y, { align: 'right' })
    y += 6
  })

  // SEPARADOR
  doc.line(5, y, 75, y)
  y += 5

  // TOTAL
  doc.setFontSize(12)
  doc.setFont('courier', 'bold')
  doc.text('TOTAL', 5, y)
  doc.text(total, 75, y, { align: 'right' })
  y += 6

  // MÉTODO
  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  doc.text(metodo, 40, y, { align: 'center' })
  y += 6

  // SEPARADOR
  doc.line(5, y, 75, y)
  y += 5

  // FOOTER
  doc.text('¡Gracias por su compra!', 40, y, { align: 'center' })
  y += 4
  doc.text('Powered by Finesse POS', 40, y, { align: 'center' })

  doc.save(`ticket-${negocio.toLowerCase().replace(/ /g, '-')}-${Date.now()}.pdf`)
})

// ── DESCARGAR PDF REPORTE ──
document.getElementById('btn-descargar-reporte-pdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const desde = document.getElementById('reporte-desde').value
  const hasta = document.getElementById('reporte-hasta').value
  const total = document.getElementById('reporte-total').textContent
  const transacciones = document.getElementById('reporte-transacciones').textContent
  const ticket = document.getElementById('reporte-ticket').textContent
  const ganancia = document.getElementById('reporte-ganancia').textContent

  const verde = [22, 163, 74]
  const verdeClaro = [220, 252, 231]
  const rojo = [220, 38, 38]
  const rojoClaro = [255, 235, 235]
  const grisOscuro = [30, 30, 30]
  const grisTexto = [80, 80, 80]
  const grisBorde = [220, 220, 220]

  let y = 0

  // ── HEADER ──
  doc.setFillColor(...verde)
  doc.rect(0, 0, 210, 38, 'F')

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('FINESSE POS', 15, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de ventas', 15, 24)
  doc.text(`${negocioActual.nombre}  |  ${desde} al ${hasta}`, 15, 31)

  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 195, 16, { align: 'right' })

  y = 48

  // ── CARDS RESUMEN ──
  const cards = [
    { label: 'Total ventas', valor: total },
    { label: 'Transacciones', valor: transacciones },
    { label: 'Ticket promedio', valor: ticket },
    { label: 'Ganancia estimada', valor: ganancia }
  ]

  const cardW = 42
  const cardGap = 4

  cards.forEach((card, i) => {
    const x = 15 + i * (cardW + cardGap)
    doc.setFillColor(...verdeClaro)
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F')
    doc.setFillColor(...verde)
    doc.roundedRect(x, y, 3, 22, 1, 1, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grisTexto)
    doc.text(card.label.toUpperCase(), x + 6, y + 8)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...verde)
    doc.text(card.valor, x + 6, y + 17)
  })

  y += 32

  // ── MÉTODOS DE PAGO ──
  doc.setFillColor(...verde)
  doc.roundedRect(15, y, 85, 7, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Ventas por método de pago', 18, y + 5)
  y += 12

  const metodoFilas = document.querySelectorAll('.metodo-venta-fila')
  const totalVentasNum = parseFloat(total.replace('$', '').replace(/\./g, '').replace(',', '.')) || 1

  metodoFilas.forEach((fila, i) => {
    const nombre = fila.querySelector('.metodo-nombre')?.textContent || ''
    const monto = fila.querySelector('.metodo-monto')?.textContent || ''
    const montoNum = parseFloat(monto.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0
    const porcentaje = ((montoNum / totalVentasNum) * 100).toFixed(0)

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248)
      doc.rect(15, y - 3, 85, 8, 'F')
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...grisOscuro)
    doc.text(nombre.charAt(0).toUpperCase() + nombre.slice(1), 18, y + 2)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grisTexto)
    doc.text(`${porcentaje}%`, 60, y + 2)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...verde)
    doc.text(monto, 98, y + 2, { align: 'right' })

    doc.setFillColor(...grisBorde)
    doc.roundedRect(18, y + 4, 60, 2, 1, 1, 'F')
    doc.setFillColor(...verde)
    doc.roundedRect(18, y + 4, 60 * (montoNum / totalVentasNum), 2, 1, 1, 'F')

    y += 10
  })

  y += 8

  // ── TOP PRODUCTOS (columna derecha) ──
  let yProd = 80 + 32 + 7

  doc.setFillColor(...verde)
  doc.roundedRect(110, yProd, 85, 7, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Productos más vendidos', 113, yProd + 5)
  yProd += 12

  const productoFilas = document.querySelectorAll('#reporte-top-productos .top-producto-item')
  productoFilas.forEach((fila, i) => {
    const nombre = fila.querySelector('.top-producto-nombre')?.textContent || ''
    const cantidad = fila.querySelector('.top-producto-cantidad')?.textContent || ''
    const totalProd = fila.querySelector('.top-producto-total')?.textContent || ''

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248)
      doc.rect(110, yProd - 3, 85, 8, 'F')
    }

    doc.setFillColor(...verde)
    doc.circle(115, yProd + 1, 3, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${i + 1}`, 115, yProd + 2, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grisOscuro)
    const nombreCorto = nombre.length > 18 ? nombre.substring(0, 18) + '...' : nombre
    doc.text(nombreCorto, 120, yProd + 2)

    doc.setTextColor(...grisTexto)
    doc.text(cantidad, 155, yProd + 2)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...verde)
    doc.text(totalProd, 193, yProd + 2, { align: 'right' })

    yProd += 10
  })

  // ── EGRESOS POR CATEGORÍA (ancho completo abajo) ──
  // calculamos el y más bajo entre la columna izq y der
  y = Math.max(y, yProd) + 8

  doc.setFillColor(...rojo)
  doc.roundedRect(15, y, 180, 7, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Egresos por categoría', 18, y + 5)
  y += 12

  const egresoFilas = document.querySelectorAll('.metodo-egreso-fila')
  const totalEgresosNum = Array.from(egresoFilas).reduce((acc, fila) => {
    const monto = fila.querySelector('.metodo-monto')?.textContent || '0'
    return acc + (parseFloat(monto.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0)
  }, 0)

  if (egresoFilas.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grisTexto)
    doc.text('Sin egresos en este período', 18, y + 2)
    y += 10
  } else {
    egresoFilas.forEach((fila, i) => {
      const nombre = fila.querySelector('.metodo-nombre')?.textContent || ''
      const monto = fila.querySelector('.metodo-monto')?.textContent || ''
      const montoNum = parseFloat(monto.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0
      const porcentaje = totalEgresosNum > 0 ? ((montoNum / totalEgresosNum) * 100).toFixed(0) : 0

      if (i % 2 === 0) {
        doc.setFillColor(...rojoClaro)
        doc.rect(15, y - 3, 180, 8, 'F')
      }

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...grisOscuro)
      doc.text(nombre.charAt(0).toUpperCase() + nombre.slice(1), 18, y + 2)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grisTexto)
      doc.text(`${porcentaje}%`, 100, y + 2)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...rojo)
      doc.text(monto, 193, y + 2, { align: 'right' })

      doc.setFillColor(...grisBorde)
      doc.roundedRect(18, y + 4, 120, 2, 1, 1, 'F')
      doc.setFillColor(...rojo)
      doc.roundedRect(18, y + 4, 120 * (montoNum / (totalEgresosNum || 1)), 2, 1, 1, 'F')

      y += 10
    })
  }

  // ── FOOTER ──
  const pageH = 297
  doc.setFillColor(...verde)
  doc.rect(0, pageH - 12, 210, 12, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Powered by Finesse POS', 105, pageH - 5, { align: 'center' })

  doc.save(`reporte-${negocioActual.nombre.toLowerCase().replace(/ /g, '-')}-${desde}-${hasta}.pdf`)
})

// ── IMPORTAR PRODUCTOS ──
let productosParaImportar = []

document.getElementById('btn-descargar-plantilla').addEventListener('click', () => {
  const cabecera = 'nombre,precio,costo,stock,categoria,codigo,precio_mayor,precio_revendedor'
  const ejemplo = 'Remera básica,7500,4500,10,Remeras,R001,6000,5300'
  const csv = cabecera + '\n' + ejemplo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla-productos-finesse.csv'
  a.click()
  URL.revokeObjectURL(url)
})

document.getElementById('btn-abrir-importar').addEventListener('click', () => {
  if (!verificarLimiteFree('importar')) return
  document.getElementById('modal-importar').style.display = 'flex'
  document.getElementById('importar-preview').style.display = 'none'
  document.getElementById('btn-confirmar-importar').style.display = 'none'
  document.getElementById('importar-archivo').value = ''
  productosParaImportar = []
  lucide.createIcons()
})

document.getElementById('btn-cerrar-importar').addEventListener('click', () => {
  document.getElementById('modal-importar').style.display = 'none'
})

document.getElementById('btn-cancelar-importar').addEventListener('click', () => {
  document.getElementById('modal-importar').style.display = 'none'
})

// CLICK EN ZONA DE CARGA
document.getElementById('importar-zona').addEventListener('click', () => {
  document.getElementById('importar-archivo').click()
})

// DRAG AND DROP
const zonaImportar = document.getElementById('importar-zona')
zonaImportar.addEventListener('dragover', (e) => {
  e.preventDefault()
  zonaImportar.classList.add('arrastrando')
})
zonaImportar.addEventListener('dragleave', () => {
  zonaImportar.classList.remove('arrastrando')
})
zonaImportar.addEventListener('drop', (e) => {
  e.preventDefault()
  zonaImportar.classList.remove('arrastrando')
  const file = e.dataTransfer.files[0]
  if (file) procesarCSV(file)
})

// SELECCIÓN DE ARCHIVO
document.getElementById('importar-archivo').addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) procesarCSV(file)
})

// PROCESAR CSV
function procesarCSV(file) {
  if (!file.name.endsWith('.csv')) {
    mostrarToast('Solo se aceptan archivos CSV', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const texto = e.target.result
    const lineas = texto.trim().split('\n')

    if (lineas.length < 2) {
      mostrarToast('El archivo está vacío o no tiene productos', 'error')
      return
    }

    productosParaImportar = []
    const errores = []

    // Función para parsear una línea CSV respetando comillas
    function parsearLinea(linea) {
      const resultado = []
      let campo = ''
      let dentroComillas = false

      for (let i = 0; i < linea.length; i++) {
        const char = linea[i]

        if (char === '"') {
          dentroComillas = !dentroComillas
        } else if (char === ',' && !dentroComillas) {
          resultado.push(campo.trim())
          campo = ''
        } else {
          campo += char
        }
      }
      resultado.push(campo.trim())
      return resultado
    }

    lineas.slice(1).forEach((linea, i) => {
      const cols = parsearLinea(linea)

      const nombre = cols[0] || ''
      const precio = parseFloat(cols[1]) || 0
      const costo = parseFloat(cols[2]) || null
      const stock = parseInt(cols[3]) || 0
      const categoria = cols[4] || null
      const codigo = cols[5] || null
      const precioMayor = parseFloat(cols[6]) || null
      const precioRevendedor = parseFloat(cols[7]) || null

      if (!nombre || isNaN(precio)) {
        errores.push(`Fila ${i + 2}: nombre o precio inválido`)
        return
      }

      productosParaImportar.push({
        nombre, precio, costo, stock, categoria, codigo,
        precio_mayor: precioMayor,
        precio_revendedor: precioRevendedor
      })
    })

    if (errores.length > 0) {
      mostrarToast(`${errores.length} fila(s) con errores fueron ignoradas`, 'error')
    }

    if (productosParaImportar.length === 0) {
      mostrarToast('No se encontraron productos válidos', 'error')
      return
    }

    document.getElementById('importar-preview-titulo').textContent = `${productosParaImportar.length} producto(s) listos para importar`
    document.getElementById('importar-preview-tbody').innerHTML = productosParaImportar.map(p => `
      <tr>
        <td>${p.nombre}</td>
        <td>$${Number(p.precio).toLocaleString('es-AR')}</td>
        <td>${p.costo ? '$' + Number(p.costo).toLocaleString('es-AR') : '-'}</td>
        <td>${p.stock}</td>
        <td>${p.categoria || '-'}</td>
        <td>${p.codigo || '-'}</td>
      </tr>
    `).join('')

    document.getElementById('importar-preview').style.display = 'block'
    document.getElementById('btn-confirmar-importar').style.display = 'flex'
  }

  reader.readAsText(file)
}

// CONFIRMAR IMPORTACIÓN
document.getElementById('btn-confirmar-importar').addEventListener('click', async () => {
  if (productosParaImportar.length === 0) return

  const productosConNegocio = productosParaImportar.map(p => ({
    ...p,
    negocio_id: negocioActual.id,
    activo: true
  }))

  const { error } = await db.from('productos').insert(productosConNegocio)

  if (error) {
    mostrarToast('Error al importar los productos', 'error')
    return
  }

  document.getElementById('modal-importar').style.display = 'none'
  mostrarToast(`${productosParaImportar.length} productos importados!`)
  productosParaImportar = []
  cargarProductos()
})

// ── AJUSTE RÁPIDO DE STOCK ──
let stockProductoActual = null

function abrirAjusteStock(id, nombre, stockActual) {
  stockProductoActual = { id, stockActual }
  document.getElementById('stock-producto-nombre').textContent = nombre
  document.getElementById('stock-actual-valor').textContent = stockActual
  document.getElementById('stock-tipo').value = 'sumar'
  document.getElementById('stock-cantidad-label').textContent = 'Cantidad a sumar'
  document.getElementById('stock-cantidad').value = ''
  document.getElementById('stock-preview').style.display = 'none'
  document.getElementById('modal-stock').style.display = 'flex'
  lucide.createIcons()
}

document.getElementById('btn-cerrar-stock').addEventListener('click', () => {
  document.getElementById('modal-stock').style.display = 'none'
})

document.getElementById('btn-cancelar-stock').addEventListener('click', () => {
  document.getElementById('modal-stock').style.display = 'none'
})

document.getElementById('stock-tipo').addEventListener('change', (e) => {
  const labels = {
    'sumar': 'Cantidad a sumar',
    'restar': 'Cantidad a restar',
    'fijar': 'Nuevo valor de stock'
  }
  document.getElementById('stock-cantidad-label').textContent = labels[e.target.value]
  document.getElementById('stock-cantidad').value = ''
  document.getElementById('stock-preview').style.display = 'none'
})

document.getElementById('stock-cantidad').addEventListener('input', () => {
  const tipo = document.getElementById('stock-tipo').value
  const cantidad = parseInt(document.getElementById('stock-cantidad').value) || 0
  const stockActual = stockProductoActual?.stockActual || 0

  let resultado
  if (tipo === 'sumar') resultado = stockActual + cantidad
  else if (tipo === 'restar') resultado = stockActual - cantidad
  else resultado = cantidad

  const preview = document.getElementById('stock-preview')
  const previewValor = document.getElementById('stock-preview-valor')

  previewValor.textContent = resultado
  previewValor.style.color = resultado < 0 ? '#dc2626' : 'var(--verde)'
  preview.style.display = 'flex'
})

document.getElementById('btn-guardar-stock').addEventListener('click', async () => {
  const tipo = document.getElementById('stock-tipo').value
  const cantidad = parseInt(document.getElementById('stock-cantidad').value)

  if (isNaN(cantidad) || cantidad < 0) {
    mostrarToast('Ingresá una cantidad válida', 'error')
    return
  }

  const stockActual = stockProductoActual.stockActual
  let nuevoStock
  if (tipo === 'sumar') nuevoStock = stockActual + cantidad
  else if (tipo === 'restar') nuevoStock = stockActual - cantidad
  else nuevoStock = cantidad

  if (nuevoStock < 0) {
    mostrarToast('El stock no puede quedar negativo', 'error')
    return
  }

  const { error } = await db
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', stockProductoActual.id)

  if (error) {
    mostrarToast('Error al actualizar el stock', 'error')
    return
  }

  document.getElementById('modal-stock').style.display = 'none'
  mostrarToast('Stock actualizado!')
  cargarProductos()
})

// ── BUSCADOR PRODUCTOS ──
document.getElementById('buscador-productos').addEventListener('input', (e) => {
  const texto = e.target.value.trim().toLowerCase()
  const filas = document.querySelectorAll('#tabla-productos tr')

  filas.forEach(fila => {
    if (fila.querySelector('.tabla-vacia')) return

    // Buscar solo en las celdas de código (col 1) y nombre (col 2)
    const celdas = fila.querySelectorAll('td')
    if (celdas.length < 2) return

    const codigo = celdas[0]?.textContent.toLowerCase() || ''
    const nombre = celdas[1]?.textContent.toLowerCase() || ''

    fila.style.display = (codigo.includes(texto) || nombre.includes(texto)) ? '' : 'none'
  })
})

// ── MODAL PREMIUM ──
document.getElementById('btn-cerrar-premium').addEventListener('click', () => {
  document.getElementById('modal-premium').style.display = 'none'
})
document.getElementById('btn-cerrar-premium-2').addEventListener('click', () => {
  document.getElementById('modal-premium').style.display = 'none'
})
document.getElementById('btn-upgrade-premium').addEventListener('click', () => {
  document.getElementById('modal-premium').style.display = 'none'
  mostrarToast('Próximamente podés contratar Premium desde la app!')
})

// ── SWITCH ALERTAS STOCK ──
document.getElementById('ajustes-alertas-stock').addEventListener('change', (e) => {
  const input = document.getElementById('ajustes-umbral-stock')
  input.disabled = !e.target.checked
  input.style.opacity = e.target.checked ? '1' : '0.4'
  input.style.cursor = e.target.checked ? 'auto' : 'not-allowed'
})

// ── MODAL CÓDIGO DE BARRAS ──
function verCodigoBarras(id, nombre, precio, precioMayor, precioRevendedor, codigo) {
  document.getElementById('barcode-producto-nombre').textContent = nombre
  document.getElementById('barcode-codigo-texto').textContent = codigo

  // PRECIOS
let preciosHTML = `<div style="display:flex; flex-direction:column; gap:6px; width:100%">
  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 14px; background:#dcfce7; border-radius:8px">
    <span style="font-size:11px; color:#6b7280; font-weight:600">Menor</span>
    <span style="font-size:15px; font-weight:bold; color:#16a34a">$${Number(precio).toLocaleString('es-AR')}</span>
  </div>`

if (precioMayor) preciosHTML += `
  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 14px; background:#eff6ff; border-radius:8px">
    <span style="font-size:11px; color:#6b7280; font-weight:600">Mayor</span>
    <span style="font-size:15px; font-weight:bold; color:#2563eb">$${Number(precioMayor).toLocaleString('es-AR')}</span>
  </div>`

if (precioRevendedor) preciosHTML += `
  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 14px; background:#f5f3ff; border-radius:8px">
    <span style="font-size:11px; color:#6b7280; font-weight:600">Revendedor</span>
    <span style="font-size:15px; font-weight:bold; color:#7c3aed">$${Number(precioRevendedor).toLocaleString('es-AR')}</span>
  </div>`

preciosHTML += `</div>`

  document.getElementById('barcode-precios').innerHTML = preciosHTML

  document.getElementById('modal-barcode').style.display = 'flex'

  setTimeout(() => {
    JsBarcode('#barcode-svg', codigo, {
  format: 'CODE128',
  width: 2,
  height: 80,
  displayValue: true,
  fontSize: 14,
  margin: 10,
  textAlign: 'center',
  textPosition: 'bottom'
})
  }, 100)

  lucide.createIcons()
}

document.getElementById('btn-cerrar-barcode').addEventListener('click', () => {
  document.getElementById('modal-barcode').style.display = 'none'
})

document.getElementById('btn-cerrar-barcode-2').addEventListener('click', () => {
  document.getElementById('modal-barcode').style.display = 'none'
})

document.getElementById('btn-imprimir-barcode').addEventListener('click', () => {
  const nombre = document.getElementById('barcode-producto-nombre').textContent
  const svgEl = document.getElementById('barcode-svg')
  const precios = document.getElementById('barcode-precios').innerHTML

  const ventana = window.open('', '_blank')
  ventana.document.write(`
    <html>
    <head>
      <title>Código - ${nombre}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 8mm;
          width: 80mm;
          margin: 0 auto;
        }
        h2 {
          font-size: 14px;
          margin-bottom: 6px;
        }
        .precio-fila {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .precio-label { color: #555; }
        .precio-valor { font-weight: bold; }
        svg { width: 100%; }
      </style>
    </head>
    <body>
      <h2>${nombre}</h2>
      ${precios}
      ${svgEl.outerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body>
    </html>
  `)
  ventana.document.close()
})

document.getElementById('btn-cancelar-cerrar-sesion').addEventListener('click', () => {
  document.getElementById('modal-cerrar-sesion').style.display = 'none'
})

document.getElementById('btn-confirmar-cerrar-sesion').addEventListener('click', async () => {
  await db.auth.signOut()
  usuarioActual = null
  negocioActual = null
  document.getElementById('modal-cerrar-sesion').style.display = 'none'
  document.getElementById('pantalla-app').style.display = 'none'
  document.getElementById('pantalla-login').style.display = 'flex'
})

function abrirCodigoOPremium(id, nombre, precio, precioMayor, precioRevendedor, codigo) {
  if (!esPremium()) {
    mostrarModalPremium('El código de barras es una función Premium. ¡Pasate a Premium para activarla!')
    return
  }
  verCodigoBarras(id, nombre, precio, precioMayor, precioRevendedor, codigo)
}

lucide.createIcons()

// ── MODAL CERRAR SESIÓN ──
document.getElementById('btn-cancelar-cerrar-sesion-x').addEventListener('click', () => {
  document.getElementById('modal-cerrar-sesion').style.display = 'none'
})
