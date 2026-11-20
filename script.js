// Publicaciones de ejemplo
const publicacionesIniciales = [
  {
    id: 1,
    usuario: 'Daniel Rodríguez',
    contenido: 'Estoy buscando compañeros para desarrollar una página web como proyecto de práctica. Me gustaría trabajar especialmente en la parte de frontend.',
    categoria: 'Programación',
    tipo: 'academico',
    likes: 4
  },
  {
    id: 2,
    usuario: 'María Fernández',
    contenido: 'Puedo ayudar a repasar álgebra y explicar ejercicios paso a paso. Si alguien necesita estudiar, podemos organizar una sesión.',
    categoria: 'Matemáticas',
    tipo: 'academico',
    likes: 7
  },
  {
    id: 3,
    usuario: 'Sebastián Mora',
    contenido: 'Estoy buscando ideas para crear una aplicación móvil sencilla y aprender a trabajar en equipo.',
    categoria: 'Desarrollo de aplicaciones',
    tipo: 'academico',
    likes: 3
  },
  {
    id: 4,
    usuario: 'Valeria Chaves',
    contenido: 'Comparto algunos consejos para organizar mejor las interfaces y mantener un diseño fácil de utilizar.',
    categoria: 'Diseño',
    tipo: 'academico',
    likes: 5
  },
  {
    id: 5,
    usuario: 'Andrea Solís',
    contenido: '¿Qué actividades creativas recomiendan para compartir durante el tiempo libre?',
    categoria: 'Otra',
    tipo: 'ocio',
    likes: 2
  },
  {
    id: 6,
    usuario: 'Luis Vargas',
    contenido: 'Estoy buscando recomendaciones de música para escuchar mientras estudio o trabajo en proyectos.',
    categoria: 'Otra',
    tipo: 'ocio',
    likes: 6
  }
];

// obtenerPublicaciones
function obtenerPublicaciones() {
  const datosGuardados = localStorage.getItem('sinergiaPublicacionesAcademicas');

  if (datosGuardados) {
    return JSON.parse(datosGuardados);
  }

  return publicacionesIniciales;
}

// guardarPublicaciones
function guardarPublicaciones() {
  localStorage.setItem('sinergiaPublicacionesAcademicas', JSON.stringify(publicaciones));
}

// mostrarPublicaciones
function mostrarPublicaciones() {
  const listaAcademica = document.getElementById('lista-publicaciones-academicas');
  const listaOcio = document.getElementById('lista-publicaciones-ocio');

  if (!listaAcademica || !listaOcio) return;

  listaAcademica.innerHTML = '';
  listaOcio.innerHTML = '';

  const categoriaElegida = document.getElementById('filtro-categoria')?.value || 'todas';
  const tipoElegido = document.querySelector('[data-filtro][aria-pressed="true"]')?.dataset.filtro || 'todas';
  const busqueda = new URLSearchParams(window.location.search).get('busqueda')?.toLowerCase() || '';

  publicaciones.forEach((publicacion) => {
    const categoriaCoincide = categoriaElegida === 'todas' || convertirCategoria(publicacion.categoria) === categoriaElegida;
    const tipoCoincide = tipoElegido === 'todas' || publicacion.tipo === (tipoElegido === 'academicas' ? 'academico' : 'ocio');
    const texto = `${publicacion.usuario} ${publicacion.contenido} ${publicacion.categoria}`.toLowerCase();
    const busquedaCoincide = texto.includes(busqueda);

    if (!categoriaCoincide || !tipoCoincide || !busquedaCoincide) return;

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta publicacion';
    tarjeta.dataset.id = publicacion.id;

    const encabezado = document.createElement('header');
    encabezado.className = 'publicacion-cabecera';

    const usuario = document.createElement('h3');
    usuario.textContent = publicacion.usuario;
    encabezado.appendChild(usuario);

    const contenido = document.createElement('p');
    contenido.className = 'publicacion-contenido';
    contenido.textContent = publicacion.contenido;

    const categoria = document.createElement('p');
    categoria.className = 'publicacion-categoria';
    categoria.textContent = `Categoría: ${publicacion.categoria}`;

    const pie = document.createElement('footer');
    pie.className = 'publicacion-pie';

    const cantidadLikes = document.createElement('p');
    cantidadLikes.className = 'contador-me-gusta';
    cantidadLikes.textContent = `${publicacion.likes} Me gusta`;

    const botonMeGusta = document.createElement('button');
    botonMeGusta.type = 'button';
    botonMeGusta.className = 'boton boton-me-gusta';
    botonMeGusta.textContent = 'Me gusta';
    botonMeGusta.dataset.accion = 'like';

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'boton boton-eliminar-publicacion';
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.dataset.accion = 'eliminar';

    pie.append(cantidadLikes, botonMeGusta, botonEliminar);
    tarjeta.append(encabezado, contenido, categoria, pie);

    if (publicacion.tipo === 'ocio') {
      listaOcio.appendChild(tarjeta);
    } else {
      listaAcademica.appendChild(tarjeta);
    }
  });

  actualizarSecciones();
}

// convertirCategoria
function convertirCategoria(categoria) {
  return categoria.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(' ', '-');
}

// actualizarSecciones
function actualizarSecciones() {
  const filtroActivo = document.querySelector('[data-filtro][aria-pressed="true"]')?.dataset.filtro || 'todas';
  const seccionOcio = document.getElementById('publicaciones-ocio');
  const seccionAcademica = document.getElementById('publicaciones-academicas');

  if (seccionOcio) seccionOcio.hidden = filtroActivo === 'academicas';
  if (seccionAcademica) seccionAcademica.hidden = filtroActivo === 'ocio';
}

// crearPublicacion
function crearPublicacion(evento) {
  evento.preventDefault();

  const nombre = document.getElementById('publicar-nombre').value.trim();
  const contenido = document.getElementById('publicar-contenido').value.trim();
  const categoria = document.getElementById('publicar-categoria').value;
  const tipo = document.getElementById('publicar-tipo').value;
  const estado = document.getElementById('estado-publicacion');

  if (nombre === '' || contenido.length < 10 || categoria === '' || tipo === '') {
    estado.textContent = 'Completa todos los campos y escribe al menos 10 caracteres.';
    estado.hidden = false;
    return;
  }

  const nuevaPublicacion = {
    id: Date.now(),
    usuario: nombre,
    contenido: contenido,
    categoria: categoria,
    tipo: tipo,
    likes: 0
  };

  publicaciones.unshift(nuevaPublicacion);
  guardarPublicaciones();
  estado.textContent = 'La publicación se creó correctamente.';
  estado.hidden = false;
  document.querySelector('.formulario-publicacion').reset();
  window.location.href = 'publicaciones.html#publicaciones';
}

// manejarAccionesPublicacion
function manejarAccionesPublicacion(evento) {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const tarjeta = boton.closest('[data-id]');
  const id = Number(tarjeta.dataset.id);
  const publicacion = publicaciones.find((elemento) => elemento.id === id);

  if (!publicacion) return;

  if (boton.dataset.accion === 'like') {
    publicacion.likes++;
  }

  if (boton.dataset.accion === 'eliminar') {
    publicaciones = publicaciones.filter((elemento) => elemento.id !== id);
  }

  guardarPublicaciones();
  mostrarPublicaciones();
}

// activarFiltros
function activarFiltros() {
  document.querySelectorAll('[data-filtro]').forEach((boton) => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('[data-filtro]').forEach((elemento) => {
        elemento.setAttribute('aria-pressed', 'false');
      });

      boton.setAttribute('aria-pressed', 'true');
      mostrarPublicaciones();
    });
  });

  document.getElementById('filtro-categoria')?.addEventListener('change', mostrarPublicaciones);
}

// iniciarSesion
function iniciarSesion(evento) {
  evento.preventDefault();

  const correo = document.getElementById('sesion-correo').value.trim();
  const contrasena = document.getElementById('sesion-contrasena').value;
  const mensaje = document.getElementById('mensaje-acceso');

  if (correo === 'daniel@sinergia.demo' && contrasena === 'Sinergia2026') {
    sessionStorage.setItem('sinergiaSesionAcademica', 'activa');
    mensaje.textContent = 'Inicio de sesión correcto. Bienvenido a Sinergia.';
    mensaje.hidden = false;
    window.location.href = 'inicio.html';
  } else {
    mensaje.textContent = 'El correo o la contraseña no son correctos.';
    mensaje.hidden = false;
  }
}

// mostrarOpcionesAcceso
function mostrarOpcionesAcceso() {
  document.querySelectorAll('[data-acceso-mostrar]').forEach((boton) => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('.bloque-acceso-formulario').forEach((seccion) => {
        seccion.hidden = true;
      });

      const destino = document.getElementById(boton.dataset.accesoMostrar);
      if (destino) destino.hidden = false;
      document.getElementById('acceso-opciones')?.setAttribute('hidden', '');
    });
  });

  document.querySelectorAll('[data-acceso-volver]').forEach((boton) => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('.bloque-acceso-formulario').forEach((seccion) => {
        seccion.hidden = true;
      });
      document.getElementById('acceso-opciones')?.removeAttribute('hidden');
    });
  });
}

// cambiarTema
function cambiarTema() {
  const boton = document.querySelector('.boton-tema');
  if (!boton) return;

  const temaGuardado = localStorage.getItem('sinergiaTemaAcademico');
  if (temaGuardado === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  actualizarBotonTema(boton);

  boton.addEventListener('click', () => {
    const temaActual = document.documentElement.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nuevoTema);
    localStorage.setItem('sinergiaTemaAcademico', nuevoTema);
    actualizarBotonTema(boton);
  });
}

// actualizarBotonTema
function actualizarBotonTema(boton) {
  const temaOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  boton.textContent = temaOscuro ? 'Tema claro' : 'Tema oscuro';
  boton.setAttribute('aria-pressed', String(temaOscuro));
}

// activarBusqueda
function activarBusqueda() {
  const formulario = document.querySelector('form[role="search"]');
  const campo = document.getElementById('buscador-texto');

  if (!formulario || !campo) return;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const busqueda = campo.value.trim();
    const paginaPublicaciones = window.location.pathname.includes('publicaciones.html');

    if (paginaPublicaciones) {
      const parametros = new URLSearchParams(window.location.search);
      if (busqueda) parametros.set('busqueda', busqueda);
      else parametros.delete('busqueda');
      window.location.search = parametros.toString();
    } else if (busqueda) {
      window.location.href = `${window.location.pathname.includes('/sinergia/') ? '' : 'sinergia/'}publicaciones.html?busqueda=${encodeURIComponent(busqueda)}`;
    }
  });
}


// actualizarVistaPrevia
function actualizarVistaPrevia() {
  const formulario = document.querySelector('.formulario-publicacion');
  const vistaPrevia = document.querySelector('.publicacion-ejemplo');
  if (!formulario || !vistaPrevia) return;

  const nombre = document.getElementById('publicar-nombre').value.trim();
  const contenido = document.getElementById('publicar-contenido').value.trim();
  const categoria = document.getElementById('publicar-categoria').value;

  const titulo = vistaPrevia.querySelector('h3');
  const texto = vistaPrevia.querySelector('.publicacion-contenido');
  const etiqueta = vistaPrevia.querySelector('.publicacion-categoria');

  if (titulo) titulo.textContent = nombre || 'Tu nombre';
  if (texto) texto.textContent = contenido || 'Aquí aparecerá el contenido de tu publicación.';
  if (etiqueta) etiqueta.textContent = `Categoría: ${categoria || 'Sin seleccionar'}`;
}

// iniciarSinergiaAcademica
function iniciarSinergiaAcademica() {
  const categoriaURL = new URLSearchParams(window.location.search).get('categoria');
  const filtroCategoria = document.getElementById('filtro-categoria');
  if (categoriaURL && filtroCategoria) filtroCategoria.value = categoriaURL;

  mostrarPublicaciones();
  activarFiltros();
  document.querySelector('.formulario-publicacion')?.addEventListener('submit', crearPublicacion);
  document.querySelector('.formulario-publicacion')?.addEventListener('input', actualizarVistaPrevia);
  document.querySelector('.formulario-publicacion')?.addEventListener('change', actualizarVistaPrevia);
  document.querySelector('.feed-publicaciones')?.addEventListener('click', manejarAccionesPublicacion);
  document.getElementById('formulario-inicio-sesion')?.addEventListener('submit', iniciarSesion);
  document.getElementById('formulario-registro')?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const mensaje = document.getElementById('mensaje-acceso');
    mensaje.textContent = 'El registro no está habilitado en esta versión académica. Utiliza la cuenta de demostración.';
    mensaje.hidden = false;
  });
  document.getElementById('formulario-recuperacion')?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const mensaje = document.getElementById('mensaje-acceso');
    mensaje.textContent = 'La recuperación de contraseña es solo informativa en esta demostración.';
    mensaje.hidden = false;
  });
  mostrarOpcionesAcceso();
  cambiarTema();
  activarBusqueda();
}

let publicaciones = obtenerPublicaciones();
document.addEventListener('DOMContentLoaded', iniciarSinergiaAcademica);
