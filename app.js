const SUPABASE_URL = 'https://dqcowatretisfkfvulmk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY293YXRyZXRpc2ZrZnZ1bG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTIxMDMsImV4cCI6MjA5ODMyODEwM30.u-FPmVyAPDgHJlwvpYE8SjNv7AG5qKI1XGkfzgJ_fHk'

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

let usuarioActual = null
let negocioActual = null

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
document.getElementById('btn-registro').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  if (!email || !password) {
    mostrarMensaje('Completá email y contraseña', 'error')
    return
  }

  const { data, error } = await db.auth.signUp({ email, password })

  if (error) {
    mostrarMensaje(error.message, 'error')
    return
  }

  mostrarMensaje('Cuenta creada! Ya podés iniciar sesión.', 'exito')
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
document.getElementById('btn-salir').addEventListener('click', async () => {
  await db.auth.signOut()
  usuarioActual = null
  negocioActual = null
  document.getElementById('pantalla-app').style.display = 'none'
  document.getElementById('pantalla-login').style.display = 'flex'
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

// ── PRODUCTOS ──
async function cargarProductos() {
  const { data, error } = await db
    .from('productos')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .order('created_at', { ascending: false })

  const tbody = document.getElementById('tabla-productos')

  if (error || !data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="tabla-vacia">No hay productos todavía</td></tr>'
    return
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.codigo || '-'}</td>
      <td>${p.nombre}</td>
      <td>$${Number(p.precio).toLocaleString('es-AR')}</td>
      <td>${p.stock}</td>
      <td>${p.categoria || '-'}</td>
      <td class="acciones">
        <button class="btn-editar" onclick="abrirEditar('${p.id}', '${p.nombre}', ${p.precio}, ${p.stock}, '${p.categoria || ''}', '${p.codigo || ''}', ${p.costo || 0})">Editar</button>
        <button class="btn-rojo" onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('')
}

// ── ABRIR MODAL NUEVO ──
document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  document.getElementById('modal-titulo').textContent = 'Nuevo producto'
  document.getElementById('producto-id').value = ''
  document.getElementById('producto-nombre').value = ''
  document.getElementById('producto-precio').value = ''
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

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    alert('Completá nombre, precio y stock')
    return
  }

  if (id) {
    await db.from('productos').update({ nombre, precio, stock, categoria, codigo, costo }).eq('id', id)
  } else {
    await db.from('productos').insert({ nombre, precio, stock, categoria, codigo, costo, negocio_id: negocioActual.id })
  }

  document.getElementById('modal-producto').style.display = 'none'
  cargarProductos()
})

// ── EDITAR PRODUCTO ──
function abrirEditar(id, nombre, precio, stock, categoria, codigo, costo) {
  document.getElementById('modal-titulo').textContent = 'Editar producto'
  document.getElementById('producto-id').value = id
  document.getElementById('producto-nombre').value = nombre
  document.getElementById('producto-precio').value = precio
  document.getElementById('producto-stock').value = stock
  document.getElementById('producto-categoria').value = categoria
  document.getElementById('producto-codigo').value = codigo
  document.getElementById('producto-costo').value = costo || ''
  document.getElementById('modal-producto').style.display = 'flex'
  lucide.createIcons()
}

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
    .limit(5)

  if (!data || data.length === 0) {
    resultados.innerHTML = '<div class="resultado-item">No se encontraron productos</div>'
    return
  }

  resultados.innerHTML = data.map(p => `
    <div class="resultado-item" onclick="agregarItemVenta('${p.id}', '${p.nombre}', ${p.precio})">
      <div>
        <div>${p.nombre}</div>
        <div class="resultado-codigo">${p.codigo || 'Sin código'}</div>
      </div>
      <div class="resultado-precio">$${Number(p.precio).toLocaleString('es-AR')}</div>
    </div>
  `).join('')
})

// AGREGAR ITEM A LA VENTA
function agregarItemVenta(id, nombre, precio) {
  document.getElementById('venta-buscar').value = ''
  document.getElementById('venta-resultados').innerHTML = ''

  const existente = itemsVenta.find(i => i.id === id)
  if (existente) {
    existente.cantidad++
  } else {
    itemsVenta.push({ id, nombre, precio, cantidad: 1 })
  }

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

  // DESKTOP
  tbody.innerHTML = itemsVenta.map((item, i) => `
    <tr>
      <td>${item.nombre}</td>
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

  const total = itemsVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  document.getElementById('venta-total').textContent = '$' + total.toLocaleString('es-AR')
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
document.getElementById('venta-metodo').addEventListener('change', (e) => {
  document.getElementById('campo-efectivo').style.display = e.target.value === 'efectivo' ? 'flex' : 'none'
})

function calcularVuelto() {
  const total = itemsVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
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
  if (itemsVenta.length === 0) {
    alert('Agregá al menos un producto')
    return
  }

  const total = itemsVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const metodo = document.getElementById('venta-metodo').value

  const { data: venta, error } = await db.from('ventas').insert({
    negocio_id: negocioActual.id,
    total,
    metodo_pago: metodo
  }).select().single()

  if (error) {
    alert('Error al guardar la venta')
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

  itemsVenta = []
  renderizarItemsVenta()
  document.getElementById('venta-efectivo').value = ''
  document.getElementById('vuelto-box').style.display = 'none'
  alert('Venta registrada!')
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
async function cargarHistorial() {
  const { data: ventas, error } = await db
    .from('ventas')
    .select('*')
    .eq('negocio_id', negocioActual.id)
    .order('fecha', { ascending: false })

  const tbody = document.getElementById('tabla-historial')

  if (error || !ventas || ventas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">No hay ventas registradas</td></tr>'
    return
  }

  tbody.innerHTML = ventas.map(v => {
    const fecha = new Date(v.fecha)
    const fechaTexto = fecha.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'}) + ' - ' + fecha.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires'})

    return `
      <tr class="fila-venta" onclick="toggleDetalle('${v.id}')">
        <td><button class="btn-expandir" id="flecha-${v.id}"><i data-lucide="chevron-right"></i></button></td>
        <td>${fechaTexto}</td>
        <td><span class="badge-metodo">${v.metodo_pago}</span></td>
        <td>$${Number(v.total).toLocaleString('es-AR')}</td>
      </tr>
      <tr class="fila-detalle" id="detalle-${v.id}" style="display:none">
        <td colspan="4">
          <div class="detalle-contenido" id="detalle-contenido-${v.id}">
            Cargando...
          </div>
        </td>
      </tr>
    `
  }).join('')

  lucide.createIcons()
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
    return
  }

  cajaAperturaActual = apertura
  document.getElementById('caja-sin-abrir').style.display = 'none'
  document.getElementById('caja-abierta').style.display = 'block'

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
    monto: Number(cajaAperturaActual.monto),
    positivo: true
  })

  ;(ventasHoy || []).forEach(v => {
    movimientos.push({
      hora: new Date(v.fecha),
      tipo: 'Venta',
      descripcion: 'Venta en efectivo',
      monto: Number(v.total),
      positivo: true
    })
  })

  ;(egresosHoy || []).forEach(e => {
    movimientos.push({
      hora: new Date(e.fecha),
      tipo: 'Egreso',
      descripcion: e.descripcion || '-',
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
      <td>${m.descripcion}</td>
      <td style="color:${m.positivo ? 'var(--verde)' : '#dc2626'}">${m.positivo ? '+' : '-'}$${m.monto.toLocaleString('es-AR')}</td>
    </tr>
  `).join('')
}

document.getElementById('btn-abrir-caja').addEventListener('click', async () => {
  const monto = parseFloat(document.getElementById('caja-monto-inicial').value)

  if (isNaN(monto) || monto < 0) {
    alert('Ingresá un monto válido')
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

  if (isNaN(monto) || monto <= 0) {
    alert('Ingresá un monto válido')
    return
  }

  await db.from('caja').insert({
    negocio_id: negocioActual.id,
    tipo: 'egreso',
    monto: monto,
    descripcion: descripcion
  })

  document.getElementById('egreso-monto').value = ''
  document.getElementById('egreso-descripcion').value = ''
  cargarCaja()
})

// ── DASHBOARD ──
async function cargarDashboard() {
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0).toISOString()
  const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59).toISOString()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0).toISOString()

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

  // TICKET PROMEDIO (del mes)
  const ticketPromedio = cantidadVentasMes > 0 ? totalMes / cantidadVentasMes : 0

  // RENDERIZAR
  document.querySelector('#seccion-dashboard .card:nth-child(1) .card-valor').textContent = '$' + totalHoy.toLocaleString('es-AR')
  document.querySelector('#seccion-dashboard .card:nth-child(2) .card-valor').textContent = '$' + totalMes.toLocaleString('es-AR')
  document.querySelector('#seccion-dashboard .card:nth-child(3) .card-valor').textContent = (cantidadProductos || 0).toString()
  document.querySelector('#seccion-dashboard .card:nth-child(4) .card-valor').textContent = '$' + Math.round(ticketPromedio).toLocaleString('es-AR')
}

// ── PERFIL / AJUSTES ──
function actualizarPerfilSidebar() {
  document.getElementById('sidebar-nombre-negocio').textContent = negocioActual.nombre
  document.getElementById('avatar-iniciales').textContent = negocioActual.nombre.charAt(0).toUpperCase()
}

document.getElementById('btn-abrir-ajustes').addEventListener('click', () => {
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'))
  document.querySelectorAll('[id^="seccion-"]').forEach(s => s.style.display = 'none')
  document.getElementById('seccion-ajustes').style.display = 'block'

  document.getElementById('ajustes-nombre').value = negocioActual.nombre
  document.getElementById('ajustes-rubro').value = negocioActual.rubro

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-abierto')
    document.getElementById('sidebar-overlay').classList.remove('visible')
  }
})

document.getElementById('btn-guardar-ajustes').addEventListener('click', async () => {
  const nombre = document.getElementById('ajustes-nombre').value.trim()
  const rubro = document.getElementById('ajustes-rubro').value

  if (!nombre) {
    document.getElementById('ajustes-mensaje').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje').textContent = 'El nombre no puede estar vacío'
    return
  }

  const { error } = await db.from('negocios').update({ nombre, rubro }).eq('id', negocioActual.id)

  if (error) {
    document.getElementById('ajustes-mensaje').style.color = '#dc2626'
    document.getElementById('ajustes-mensaje').textContent = 'Error al guardar'
    return
  }

  negocioActual.nombre = nombre
  negocioActual.rubro = rubro
  actualizarPerfilSidebar()
  document.getElementById('nav-email').textContent = nombre

  document.getElementById('ajustes-mensaje').style.color = 'var(--verde)'
  document.getElementById('ajustes-mensaje').textContent = 'Cambios guardados!'
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

lucide.createIcons()
