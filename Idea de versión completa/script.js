// JavaScript principal de Sinergia.
// Organiza el almacenamiento, la sesión, la navegación, las publicaciones, los perfiles y los mensajes.
// Los datos de demostración se guardan localmente en el navegador.
(() => {
  'use strict';

  // ETAPA 1 DE 6: CONFIGURACIÓN GENERAL, ALMACENAMIENTO Y SESIÓN En esta sección se centralizan las claves del navegador, la cuenta de demostración, la lectura/escritura segura y el control de sesión.

  const STORAGE = {
    accounts: 'sinergia.accounts.v1',
    rememberedSession: 'sinergia.session.v1',
    tabSession: 'sinergia.tab-session.v1',
    theme: 'sinergia.theme.v1',
    chats: 'sinergia.chats.v1',
    reactions: 'sinergia.reactions.v1',
    comments: 'sinergia.comments.v1',
    preferences: 'sinergia.preferences.v1',
    publications: 'sinergia.publications.v1',
    profile: 'sinergia.profile.v1',
    chatUnread: 'sinergia.chat-unread.v1',
    evaluations: 'sinergia.evaluations.v1',
    manualLocation: 'sinergia.manual-location.v1',
    notifications: 'sinergia.notifications.v1'
  };

  const DEMO_ACCOUNT = {
    name: 'Daniel Rodríguez',
    email: 'daniel@sinergia.demo',
    password: 'Sinergia2026'
  };

  // Lee JSON sin detener la aplicación si el navegador bloquea el almacenamiento.
  // safeRead
  function safeRead(storage, key, fallback) {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn(`No se pudo leer ${key}:`, error);
      return fallback;
    }
  }

  // Guarda JSON y devuelve false si se alcanza el límite del almacenamiento.
  // safeWrite
  function safeWrite(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`No se pudo guardar ${key}:`, error);
      return false;
    }
  }

  // getAccounts
  function getAccounts() {
    const accounts = safeRead(localStorage, STORAGE.accounts, null);
    if (Array.isArray(accounts) && accounts.length) return accounts;
    safeWrite(localStorage, STORAGE.accounts, [DEMO_ACCOUNT]);
    return [DEMO_ACCOUNT];
  }

  // getSession
  function getSession() {
    return safeRead(sessionStorage, STORAGE.tabSession, null)
      || safeRead(localStorage, STORAGE.rememberedSession, null);
  }

  // setSession
  function setSession(account, remember) {
    const session = { name: account.name, email: account.email, createdAt: Date.now() };
    // Una sesión recordada anterior no debe reemplazar la nueva elección.
    try { localStorage.removeItem(STORAGE.rememberedSession); } catch (_) { /* almacenamiento opcional */ }
    try { sessionStorage.removeItem(STORAGE.tabSession); } catch (_) { /* almacenamiento opcional */ }
    if (remember) safeWrite(localStorage, STORAGE.rememberedSession, session);
    else safeWrite(sessionStorage, STORAGE.tabSession, session);
  }

  // clearSession
  function clearSession() {
    try { localStorage.removeItem(STORAGE.rememberedSession); } catch (_) { /* almacenamiento opcional */ }
    try { sessionStorage.removeItem(STORAGE.tabSession); } catch (_) { /* almacenamiento opcional */ }
  }

  // isNestedPage
  function isNestedPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return /\/sinergia\//i.test(path) || path.toLowerCase().includes('sinergia');
  }

  // goToPublicHome
  function goToPublicHome() {
    window.location.href = isNestedPage() ? '../index.html' : 'index.html';
  }

  // showStatus
  function showStatus(target, message, type = 'info') {
    if (!target) return;
    target.textContent = message;
    target.hidden = false;
    target.dataset.type = type;
    target.classList.toggle('estado-error', type === 'error');
    target.classList.toggle('estado-aprobada', type === 'success');
  }

  // formatDate
  function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(date);
  }

  // formatTime
  function formatTime(date = new Date()) {
    return new Intl.DateTimeFormat('es-CR', {
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  // ETAPA 2 DE 6: TEMA, NAVEGACIÓN, ACCESO Y PREFERENCIAS Se conserva el inicio de sesión local, el cierre de sesión, los formularios de acceso y el guardado explícito de la configuración.

  // applyTheme
  function applyTheme(theme) {
    const selected = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = selected;
    try { localStorage.setItem(STORAGE.theme, selected); } catch (_) { /* vista local */ }

    document.querySelectorAll('.boton-tema').forEach((button) => {
      const dark = selected === 'dark';
      button.textContent = dark ? 'Tema claro' : 'Tema oscuro';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    });

    const themeSelect = document.getElementById('tema-seleccion');
    if (themeSelect) themeSelect.value = selected === 'dark' ? 'oscuro' : 'claro';
  }

  // initTheme
  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(STORAGE.theme); } catch (_) { /* tema claro por defecto */ }
    applyTheme(stored === 'dark' ? 'dark' : 'light');

    const preferenceForm = document.querySelector('.formulario-preferencias');
    const themeSelect = document.getElementById('tema-seleccion');

    document.querySelectorAll('.boton-tema').forEach((button) => {
      button.addEventListener('click', () => {
        const activeTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';

        // En Configuración el botón solo prepara el cambio; guardar lo aplica.
        if (preferenceForm && themeSelect) {
          themeSelect.value = nextTheme === 'dark' ? 'oscuro' : 'claro';
          let notice = document.getElementById('aviso-tema-pendiente');
          if (!notice) {
            notice = document.createElement('p');
            notice.id = 'aviso-tema-pendiente';
            notice.className = 'estado';
            notice.setAttribute('role', 'status');
            preferenceForm.appendChild(notice);
          }
          notice.textContent = `Tema ${nextTheme === 'dark' ? 'oscuro' : 'claro'} seleccionado. Pulsa «Guardar preferencias» para aplicarlo.`;
          return;
        }
        applyTheme(nextTheme);
      });
    });
  }

  // Mantiene accesos y enlaces correctos cuando hay una sesión iniciada.
  // updatePublicHeader
  function updatePublicHeader(session) {
    if (!session) return;
    const actions = document.querySelector('.encabezado-acciones[data-public-actions]')
      || (document.querySelector('.navegacion-publica') ? document.querySelector('.encabezado-acciones') : null);

    if (actions) {
      actions.replaceChildren();
      const appLink = document.createElement('a');
      appLink.href = isNestedPage() ? 'inicio.html' : 'sinergia/inicio.html';
      appLink.className = 'enlace-perfil';
      appLink.textContent = 'Volver a Sinergia';

      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'boton boton-cerrar-sesion';
      logout.dataset.cerrarSesion = '';
      logout.textContent = 'Cerrar sesión';
      actions.append(appLink, logout);
    }

    if (isNestedPage()) {
      const brandLink = document.querySelector('.marca-nombre a');
      if (brandLink) brandLink.href = 'inicio.html';
      const publicHome = document.querySelector('.navegacion-publica a[href="../index.html"]');
      if (publicHome) publicHome.href = 'inicio.html';
    } else {
      const quickAccess = document.querySelector('.pantalla-presentacion .lista-accesos');
      if (quickAccess) {
        quickAccess.replaceChildren();
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'boton boton-principal';
        link.href = 'sinergia/inicio.html';
        link.textContent = 'Ir a mi espacio';
        item.appendChild(link);
        quickAccess.appendChild(item);
      }
    }
  }

  // initLogout
  function initLogout() {
    document.querySelectorAll('[data-cerrar-sesion]').forEach((button) => {
      button.addEventListener('click', () => {
        clearSession();
        goToPublicHome();
      });
    });
  }

  // initAccess
  function initAccess() {
    const accessRoot = document.getElementById('acceso');
    if (!accessRoot) return;

    const hub = document.getElementById('acceso-opciones');
    const demoNote = document.querySelector('.acceso-demo');
    const status = document.getElementById('mensaje-acceso');
    const panels = ['registro', 'inicio-sesion', 'recuperacion'];

    // showPanel
    function showPanel(panelId, updateHash = true) {
      const valid = panels.includes(panelId);
      panels.forEach((id) => {
        const panel = document.getElementById(id);
        if (panel) panel.hidden = !valid || id !== panelId;
      });
      if (hub) hub.hidden = valid;
      if (demoNote) demoNote.hidden = valid;
      if (status) status.hidden = true;
      if (updateHash) {
        const nextHash = valid ? `#${panelId}` : '#acceso';
        if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
      }
      if (valid) document.querySelector(`#${panelId} input`)?.focus({ preventScroll: true });
    }

    document.querySelectorAll('[data-acceso-mostrar]').forEach((control) => {
      control.addEventListener('click', (event) => {
        event.preventDefault();
        showPanel(control.dataset.accesoMostrar);
      });
    });
    document.querySelectorAll('[data-acceso-volver]').forEach((control) => {
      control.addEventListener('click', () => showPanel(null));
    });

    // syncHash
    function syncHash() {
      const hash = window.location.hash.slice(1);
      showPanel(panels.includes(hash) ? hash : null, false);
    }
    window.addEventListener('hashchange', syncHash);
    syncHash();
    getAccounts();

    const registerForm = document.getElementById('formulario-registro');
    registerForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(registerForm);
      const name = String(form.get('nombre') || '').trim();
      const email = String(form.get('correo') || '').trim().toLowerCase();
      const password = String(form.get('contrasena') || '');
      const confirmation = String(form.get('confirmacion') || '');
      if (!name || !email || password.length < 8) {
        showStatus(status, 'Completa los datos y utiliza una contraseña de al menos ocho caracteres.', 'error');
        return;
      }
      if (password !== confirmation) {
        showStatus(status, 'Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.', 'error');
        return;
      }
      const accounts = getAccounts();
      if (accounts.some((account) => account.email.toLowerCase() === email)) {
        showStatus(status, 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.', 'error');
        return;
      }
      const account = { name, email, password };
      accounts.push(account);
      safeWrite(localStorage, STORAGE.accounts, accounts);
      setSession(account, false);
      window.location.href = 'inicio.html';
    });

    const loginForm = document.getElementById('formulario-inicio-sesion');
    loginForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(loginForm);
      const email = String(form.get('correo') || '').trim().toLowerCase();
      const password = String(form.get('contrasena') || '');
      const account = getAccounts().find((item) => item.email.toLowerCase() === email && item.password === password);
      if (!account) {
        showStatus(status, 'El correo o la contraseña no son correctos. Revisa los datos o crea una cuenta.', 'error');
        return;
      }
      setSession(account, form.get('recordar') === 'on');
      window.location.href = 'inicio.html';
    });

    const recoveryForm = document.getElementById('formulario-recuperacion');
    recoveryForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      showStatus(status, 'Solicitud registrada solo como demostración. Para enviar un correo real se necesita configurar un backend de recuperación.', 'info');
    });
  }

  // initSettings
  function initSettings() {
    const preferenceForm = document.querySelector('.formulario-preferencias');
    if (!preferenceForm) return;

    const themeSelect = document.getElementById('tema-seleccion');
    const savedValue = safeRead(localStorage, STORAGE.preferences, {});
    const savedPreferences = savedValue && typeof savedValue === 'object' ? savedValue : {};
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'oscuro' : 'claro';
    if (themeSelect) themeSelect.value = currentTheme;

    const checkboxPreferences = [
      ['perfil_visible', 'profileVisible'],
      ['historias_amigos', 'friendsOnlyStories'],
      ['notif_solicitudes', 'notifyRequests'],
      ['notif_matches', 'notifyMatches'],
      ['notif_mensajes', 'notifyMessages']
    ];
    checkboxPreferences.forEach(([fieldName, preferenceName]) => {
      const field = preferenceForm.elements.namedItem(fieldName);
      if (field && typeof savedPreferences[preferenceName] === 'boolean') {
        field.checked = savedPreferences[preferenceName];
      }
    });

    const locationSelect = preferenceForm.elements.namedItem('ubicacion_modo');
    if (locationSelect) locationSelect.value = savedPreferences.locationMode || 'manual';

    preferenceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(preferenceForm);
      const preferences = {
        profileVisible: formData.get('perfil_visible') === 'on',
        friendsOnlyStories: formData.get('historias_amigos') === 'on',
        locationMode: String(formData.get('ubicacion_modo') || 'manual'),
        notifyRequests: formData.get('notif_solicitudes') === 'on',
        notifyMatches: formData.get('notif_matches') === 'on',
        notifyMessages: formData.get('notif_mensajes') === 'on',
        theme: String(formData.get('tema') || 'claro')
      };

      // Se aplica el tema solo después de enviar el formulario.
      applyTheme(preferences.theme === 'oscuro' ? 'dark' : 'light');
      safeWrite(localStorage, STORAGE.preferences, preferences);

      let notice = document.getElementById('estado-preferencias');
      if (!notice) {
        notice = document.createElement('p');
        notice.id = 'estado-preferencias';
        notice.className = 'estado estado-aprobada';
        notice.setAttribute('role', 'status');
        preferenceForm.appendChild(notice);
      }
      notice.textContent = `Preferencias guardadas. El tema ${preferences.theme === 'oscuro' ? 'oscuro' : 'claro'} ya está aplicado en este navegador.`;
    });
  }

  // Los controles de perfiles inexistentes quedan como elementos decorativos.
  // initPlaceholderProfiles
  function initPlaceholderProfiles() {
    document.querySelectorAll('.boton-perfil-no-disponible').forEach((control) => {
      control.setAttribute('tabindex', '-1');
      control.removeAttribute('href');
      control.setAttribute('aria-disabled', 'true');
    });
  }

  // Acepta, rechaza o cancela solicitudes desde la pantalla de Amigos.
  // initFriendRequests
  function initFriendRequests() {
    document.querySelectorAll('[data-solicitud-accion]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('[data-person-id]');
        if (!card) return;
        const action = button.dataset.solicitudAccion;
        const personId = card.dataset.personId;
        if (action === 'aceptar') {
          card.querySelectorAll('[data-solicitud-accion]').forEach((control) => control.remove());
          card.classList.remove('tarjeta-solicitud');
          card.classList.add('tarjeta-amigo');
          const status = card.querySelector('.zona-publica');
          if (status) status.textContent = 'Ahora forma parte de tus amigos.';
          const messageLink = document.createElement('a');
          messageLink.className = 'boton boton-secundario';
          messageLink.href = `mensajes.html?chat=${encodeURIComponent(personId)}`;
          messageLink.textContent = 'Enviar mensaje';
          card.appendChild(messageLink);
          document.querySelector('.rejilla-amigos')?.prepend(card);
          const communityCount = document.querySelector('.contador-comunidad');
          const friendCount = document.querySelectorAll('.rejilla-amigos .tarjeta-amigo').length;
          if (communityCount) communityCount.textContent = `${friendCount} amigos`;
        } else if (action === 'rechazar' || action === 'cancelar') {
          card.remove();
        }

        const requestSection = button.dataset.solicitudAccion === 'cancelar'
          ? document.querySelector('[aria-labelledby="amigos-enviadas"]')
          : document.querySelector('[aria-labelledby="amigos-recibidas"]');
        const remaining = requestSection?.querySelectorAll('[data-solicitud-accion]').length || 0;
        const counter = requestSection?.querySelector('.titulo-bloque span');
        if (counter) counter.textContent = `${remaining} pendientes`;
        if (requestSection && remaining === 0) {
          let empty = requestSection.querySelector('.estado-solicitudes-vacio');
          if (!empty) {
            empty = document.createElement('p');
            empty.className = 'estado-solicitudes-vacio';
            empty.textContent = 'No hay solicitudes pendientes.';
            requestSection.querySelector('.rejilla-tarjetas')?.appendChild(empty);
          }
        }
      });
    });
  }

  // ETAPA 3 DE 6: MENSAJERÍA Y CONVERSACIONES Cada conversación utiliza un identificador propio. Los mensajes se generan con el DOM, se guardan localmente y se actualiza su vista.

  const CHAT_DATA = {
    andrea: {
      "name": "Andrea Solís",
      "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-andrea-solis.html",
      "status": "En línea",
      "unread": 2,
      "messages": [
            {
                  "text": "¡Hola Daniel! ¿Cómo vas con el diseño de Sinergia?",
                  "time": "14:08",
                  "own": false
            },
            {
                  "text": "¡Hola Andrea! Ya corregí la estructura de las tarjetas.",
                  "time": "14:09",
                  "own": true
            },
            {
                  "text": "Vi los cambios, ahora se ve mucho más ordenado.",
                  "time": "14:11",
                  "own": false
            },
            {
                  "text": "Quiero revisar los colores en tema oscuro también.",
                  "time": "14:12",
                  "own": true
            },
            {
                  "text": "Perfecto. Puedo revisar contraste y tamaños esta tarde.",
                  "time": "14:14",
                  "own": false
            },
            {
                  "text": "¡Gracias! Te comparto la última versión cuando la tenga.",
                  "time": "14:16",
                  "own": true
            },
            {
                  "text": "Dale, así hacemos una revisión juntos.",
                  "time": "14:17",
                  "own": false
            }
      ]
},
    luis: {
      "name": "Luis Vargas",
      "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-luis-vargas.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "Encontré unos recursos para la práctica de redes.",
                  "time": "11:10",
                  "own": false
            },
            {
                  "text": "Buenísimo, ¿me los puedes pasar?",
                  "time": "11:12",
                  "own": true
            },
            {
                  "text": "Claro, los voy a organizar por tema.",
                  "time": "11:13",
                  "own": false
            },
            {
                  "text": "También agregué ejemplos de direccionamiento IP.",
                  "time": "11:15",
                  "own": false
            },
            {
                  "text": "Eso nos puede servir para estudiar antes de la prueba.",
                  "time": "11:16",
                  "own": true
            },
            {
                  "text": "Cuando termine te mando el resumen.",
                  "time": "11:18",
                  "own": false
            }
      ]
},
    maria: {
      "name": "María Fernández",
      "avatar": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-maria-fernandez.html",
      "status": "En línea",
      "unread": 1,
      "messages": [
            {
                  "text": "Hola, ya preparé algunos ejercicios de álgebra.",
                  "time": "10:42",
                  "own": false
            },
            {
                  "text": "¡Qué bien! ¿Incluiste sistemas de ecuaciones?",
                  "time": "10:44",
                  "own": true
            },
            {
                  "text": "Sí, agregué tres ejemplos resueltos.",
                  "time": "10:46",
                  "own": false
            },
            {
                  "text": "Podríamos hacer una sesión de estudio el viernes.",
                  "time": "10:48",
                  "own": true
            },
            {
                  "text": "Me parece. Voy a invitar a Camila también.",
                  "time": "10:49",
                  "own": false
            },
            {
                  "text": "Excelente, así repasamos en grupo.",
                  "time": "10:51",
                  "own": true
            }
      ]
},
    sebastian: {
      "name": "Sebastián Mora",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-sebastian-mora.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "¿Ya definieron qué tecnología usarán para la app?",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Estamos comparando opciones para el prototipo.",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Podemos iniciar con HTML, CSS y JavaScript.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Sí, primero queremos validar las pantallas.",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Yo puedo preparar un flujo básico de navegación.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Perfecto, lo revisamos en la reunión.",
                  "time": "Ayer",
                  "own": true
            }
      ]
},
    valeria: {
      "name": "Valeria Chaves",
      "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-valeria-chaves.html",
      "status": "En línea",
      "unread": 3,
      "messages": [
            {
                  "text": "Tengo una propuesta para mejorar la página de inicio.",
                  "time": "09:20",
                  "own": false
            },
            {
                  "text": "¿Qué tienes pensado?",
                  "time": "09:22",
                  "own": true
            },
            {
                  "text": "Podemos usar una imagen amplia y tarjetas más limpias.",
                  "time": "09:24",
                  "own": false
            },
            {
                  "text": "Me gusta. También estaría bien mejorar el espacio entre secciones.",
                  "time": "09:25",
                  "own": true
            },
            {
                  "text": "Preparé un pequeño boceto para que lo veas.",
                  "time": "09:27",
                  "own": false
            },
            {
                  "text": "Pásamelo y lo integramos a la lista de tareas.",
                  "time": "09:28",
                  "own": true
            }
      ]
},
    andres: {
      "name": "Andrés Quesada",
      "avatar": "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-andres-quesada.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "Estoy probando un script para ordenar los datos.",
                  "time": "08:52",
                  "own": false
            },
            {
                  "text": "¿Lo hiciste en Python?",
                  "time": "08:54",
                  "own": true
            },
            {
                  "text": "Sí, con una función que elimina registros repetidos.",
                  "time": "08:55",
                  "own": false
            },
            {
                  "text": "Eso puede servir para limpiar la información de pruebas.",
                  "time": "08:57",
                  "own": true
            },
            {
                  "text": "Te comparto el código cuando lo documente.",
                  "time": "08:58",
                  "own": false
            },
            {
                  "text": "Genial, lo revisamos con calma.",
                  "time": "09:00",
                  "own": true
            }
      ]
},
    mateo: {
      "name": "Mateo Araya",
      "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-mateo-araya.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "¿Te gustaría que prepare una lista de pruebas?",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Sí, necesitamos probar los formularios y los botones.",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Haré casos para datos vacíos y valores incorrectos.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Incluye también el comportamiento en celular.",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Listo, agrego una sección de pruebas responsive.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Gracias, eso nos va a ayudar bastante.",
                  "time": "Ayer",
                  "own": true
            }
      ]
},
    camila: {
      "name": "Camila Jiménez",
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-camila-jimenez.html",
      "status": "En línea",
      "unread": 1,
      "messages": [
            {
                  "text": "Estoy reuniendo fuentes para el proyecto de ciencias.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "¿Quieres que te ayude a resumirlas?",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Sí, especialmente las que explican el método.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Podemos separar objetivo, materiales y resultados.",
                  "time": "Ayer",
                  "own": true
            },
            {
                  "text": "Perfecto, así queda más claro para el informe.",
                  "time": "Ayer",
                  "own": false
            },
            {
                  "text": "Te envío el esquema por aquí.",
                  "time": "Ayer",
                  "own": false
            }
      ]
},
    sofia: {
      "name": "Sofía Vargas",
      "avatar": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-sofia-vargas.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "Hice una propuesta de identidad visual para el equipo.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "¿Usaste una paleta de tres colores?",
                  "time": "Lun",
                  "own": true
            },
            {
                  "text": "Sí, combiné lavanda, azul y un tono neutro.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "Se ve equilibrada. ¿Tiene versión para tema oscuro?",
                  "time": "Lun",
                  "own": true
            },
            {
                  "text": "Preparé ambas versiones para mantener el contraste.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "Excelente, la podemos mostrar en la presentación.",
                  "time": "Lun",
                  "own": true
            }
      ]
},
    diego: {
      "name": "Diego Méndez",
      "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-diego-mendez.html",
      "status": "En línea",
      "unread": 1,
      "messages": [
            {
                  "text": "Ya terminé la función que valida los campos.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "¿También comprueba el correo?",
                  "time": "Lun",
                  "own": true
            },
            {
                  "text": "Sí, y muestra un mensaje si el formato no es correcto.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "Perfecto. Falta probar los límites de caracteres.",
                  "time": "Lun",
                  "own": true
            },
            {
                  "text": "Agregué validaciones para texto vacío y demasiado largo.",
                  "time": "Lun",
                  "own": false
            },
            {
                  "text": "Buen trabajo, lo integramos en la siguiente revisión.",
                  "time": "Lun",
                  "own": true
            }
      ]
},
    paula: {
      "name": "Paula Castillo",
      "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-paula-castillo.html",
      "status": "Visto recientemente",
      "unread": 0,
      "messages": [
            {
                  "text": "Organicé los textos para que tengan el mismo tono.",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Gracias. ¿Puedes revisar también los títulos?",
                  "time": "Dom",
                  "own": true
            },
            {
                  "text": "Claro, hice que sean más directos y fáciles de leer.",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Me parece importante que la información no se vea saturada.",
                  "time": "Dom",
                  "own": true
            },
            {
                  "text": "Dejé párrafos cortos y separé las ideas por secciones.",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Así se entiende mucho mejor.",
                  "time": "Dom",
                  "own": true
            }
      ]
},
    laura: {
      "name": "Laura Campos",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=84",
      "profile": "perfil-laura-campos.html",
      "status": "En línea",
      "unread": 2,
      "messages": [
            {
                  "text": "¿Pudiste revisar la tarjeta de mi perfil?",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Sí, corregí el enlace para que abra tu perfil y no el mío.",
                  "time": "Dom",
                  "own": true
            },
            {
                  "text": "¡Perfecto! También tengo una foto nueva para la portada.",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Podemos usarla siempre que tenga buen contraste.",
                  "time": "Dom",
                  "own": true
            },
            {
                  "text": "Te paso la URL de Unsplash que encontré.",
                  "time": "Dom",
                  "own": false
            },
            {
                  "text": "Gracias, la probamos en ambos temas.",
                  "time": "Dom",
                  "own": true
            }
      ]
}
  };

  // Conserva los mensajes existentes y agrega conversaciones nuevas cuando se amplía el prototipo.
  // getChatMessages
  function getChatMessages() {
    const savedValue = safeRead(localStorage, STORAGE.chats, {});
    const saved = savedValue && typeof savedValue === 'object' && !Array.isArray(savedValue) ? savedValue : {};
    const combined = {};
    Object.keys(CHAT_DATA).forEach((id) => {
      if (Array.isArray(saved[id])) {
        // Conserva el historial anterior y agrega los mensajes de muestra que aún no existan.
        const existing = saved[id].slice();
        const knownTexts = new Set(existing.map((item) => item.text));
        CHAT_DATA[id].messages.forEach((seedMessage) => {
          if (!knownTexts.has(seedMessage.text)) existing.push(seedMessage);
        });
        combined[id] = existing;
      } else {
        combined[id] = CHAT_DATA[id].messages.slice();
      }
    });
    return combined;
  }

  // initMessages
  function initMessages() {
    const app = document.getElementById('mensajes-app');
    if (!app) return;

    const conversationList = app.querySelector('[data-chat-list]');
    const messageList = app.querySelector('[data-chat-messages]');
    const title = app.querySelector('[data-chat-nombre]');
    const avatar = app.querySelector('[data-chat-avatar]');
    const chatStatus = app.querySelector('[data-chat-estado]');
    const profileLink = app.querySelector('[data-chat-profile]');
    const form = app.querySelector('#formulario-mensaje');
    const input = form?.querySelector('input[name="mensaje"]');
    const search = app.querySelector('[data-chat-search]');
    const total = app.querySelector('[data-chat-total]');
    const messages = getChatMessages();
    const savedUnread = safeRead(localStorage, STORAGE.chatUnread, null);
    if (savedUnread && typeof savedUnread === 'object') {
      Object.keys(CHAT_DATA).forEach((id) => {
        if (Number.isFinite(Number(savedUnread[id]))) CHAT_DATA[id].unread = Math.max(0, Number(savedUnread[id]));
      });
    }
    let activeId = 'andrea';

    // persistUnread
    function persistUnread() {
      const unread = {};
      Object.keys(CHAT_DATA).forEach((id) => { unread[id] = Number(CHAT_DATA[id].unread || 0); });
      safeWrite(localStorage, STORAGE.chatUnread, unread);
    }

    // updateUnreadCounter
    function updateUnreadCounter() {
      if (!total) return;
      const unreadCount = Object.values(CHAT_DATA).reduce((sum, chat) => sum + Math.max(0, Number(chat.unread || 0)), 0);
      total.textContent = String(unreadCount);
      total.setAttribute('aria-label', `${unreadCount} conversaciones con mensajes sin leer`);
      total.title = `${unreadCount} mensajes sin leer`;
    }

    // lastMessage
    function lastMessage(chatId) {
      const list = messages[chatId] || [];
      return list.length ? list[list.length - 1] : { text: 'Inicia una conversación', time: '' };
    }

    // Crea cada fila de la bandeja mediante el DOM para evitar HTML insertado como texto.
    // renderConversationList
    function renderConversationList() {
      if (!conversationList) return;
      const query = String(search?.value || '').trim().toLocaleLowerCase('es');
      conversationList.replaceChildren();
      const visibleIds = Object.keys(CHAT_DATA).filter((id) => {
        const chat = CHAT_DATA[id];
        return !query || `${chat.name} ${lastMessage(id).text}`.toLocaleLowerCase('es').includes(query);
      });
      updateUnreadCounter();

      visibleIds.forEach((id) => {
        const chat = CHAT_DATA[id];
        const last = lastMessage(id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'conversacion';
        button.dataset.chatId = id;
        button.setAttribute('aria-pressed', String(id === activeId));
        if (id === activeId) button.classList.add('conversacion-activa-seleccionada');

        const photo = document.createElement('img');
        photo.className = 'foto-perfil foto-mediana';
        photo.src = chat.avatar;
        photo.alt = '';
        photo.loading = 'lazy';
        const info = document.createElement('span');
        info.className = 'conversacion-info';
        const name = document.createElement('span');
        name.className = 'conversacion-nombre';
        name.textContent = chat.name;
        const preview = document.createElement('span');
        preview.className = 'conversacion-ultimo';
        preview.textContent = last.text;
        info.append(name, preview);

        const meta = document.createElement('span');
        meta.className = 'conversacion-meta';
        const time = document.createElement('time');
        time.textContent = last.time || '';
        meta.appendChild(time);
        if (chat.unread && id !== activeId) {
          const badge = document.createElement('span');
          badge.className = 'insignia';
          badge.textContent = String(chat.unread);
          meta.appendChild(badge);
        }
        button.append(photo, info, meta);
        conversationList.appendChild(button);
      });

      if (!visibleIds.length) {
        const empty = document.createElement('p');
        empty.className = 'estado-chat-vacio';
        empty.textContent = 'No hay conversaciones que coincidan con tu búsqueda.';
        conversationList.appendChild(empty);
      }
    }

    // Renderiza el historial completo del chat activo y desplaza al último mensaje.
    // renderMessages
    function renderMessages() {
      const chat = CHAT_DATA[activeId];
      if (!messageList || !chat) return;
      messageList.replaceChildren();
      messages[activeId].forEach((item) => {
        const li = document.createElement('li');
        li.className = `mensaje ${item.own ? 'mensaje-enviado' : 'mensaje-recibido'}`;
        const text = document.createElement('p');
        text.textContent = item.text;
        const timeP = document.createElement('p');
        const time = document.createElement('time');
        time.textContent = item.time;
        if (/^\d{2}:\d{2}$/.test(item.time)) time.dateTime = item.time;
        timeP.appendChild(time);
        if (item.own) {
          const status = document.createElement('span');
          status.className = 'mensaje-estado';
          status.textContent = ' ✓✓';
          status.setAttribute('aria-label', 'Enviado');
          timeP.appendChild(status);
        }
        li.append(text, timeP);
        messageList.appendChild(li);
      });
      messageList.setAttribute('aria-label', `Mensajes de ${chat.name}`);
      messageList.scrollTop = messageList.scrollHeight;
    }

    // selectChat
    function selectChat(id, openOnSmallScreen = true) {
      if (!CHAT_DATA[id]) return;
      activeId = id;
      const chat = CHAT_DATA[id];
      if (title) title.textContent = chat.name;
      if (avatar) {
        avatar.src = chat.avatar;
        avatar.alt = `Fotografía de ${chat.name}`;
      }
      if (chatStatus) chatStatus.textContent = chat.status;
      if (profileLink) profileLink.href = chat.profile;
      chat.unread = 0;
      persistUnread();
      app.classList.toggle('chat-abierto', openOnSmallScreen);
      renderConversationList();
      renderMessages();
    }

    conversationList?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chat-id]');
      if (button) selectChat(button.dataset.chatId, true);
    });
    search?.addEventListener('input', renderConversationList);
    app.querySelector('[data-chat-volver]')?.addEventListener('click', () => app.classList.remove('chat-abierto'));

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input?.value.trim();
      if (!text) return;
      messages[activeId].push({ text: text.slice(0, 1000), time: formatTime(), own: true });
      if (!safeWrite(localStorage, STORAGE.chats, messages)) {
        messages[activeId].pop();
        showStatus(app.querySelector('[data-chat-notice]'), 'No se pudo guardar el mensaje en este navegador.', 'error');
        return;
      }
      renderConversationList();
      renderMessages();
      input.value = '';
      input.focus();
    });

    renderConversationList();
    const requestedChat = new URLSearchParams(window.location.search).get('chat');
    selectChat(CHAT_DATA[requestedChat] ? requestedChat : 'andrea', Boolean(requestedChat));
  }

  // ETAPA 4 DE 6: PUBLICACIONES Y FUNCIONES PRINCIPALES DE LA RED SOCIAL Requisitos cubiertos en este grupo: - Arreglo de publicaciones con usuario, contenido, categoría y likes. - Renderizado de tarjetas recorriendo el arreglo con JavaScript. - Creación validada desde formulario y guardado local. - Me gusta, corazón, comentarios y eliminación de publicaciones. - Filtros por tipo y por categoría. - Manipulación del DOM mediante createElement, replaceChildren, appendChild, textContent, atributos y clases.

  // Datos iniciales de ejemplo que se muestran en la primera visita.
  // Cada objeto representa una publicación completa de la red social.
  const PUBLICACIONES_INICIALES = [
    {
      id: 'publicacion-1',
      usuario: 'Daniel Rodríguez',
      correoAutor: 'daniel@sinergia.demo',
      perfil: 'perfil.html',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=84',
      contenido: 'Busco alguien que domine frontend para trabajar juntos en un proyecto de desarrollo web. Yo puedo encargarme del backend.',
      categoria: 'Programación',
      tipo: 'academicas',
      likes: 12,
      corazones: 0,
      fecha: '30 de octubre de 2026',
      imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=86',
      comentarios: [
        { usuario: 'Andrea Solís', texto: 'Me gusta la idea. Podríamos definir primero las pantallas y después conectar el backend.', fecha: '12 nov 2026' },
        { usuario: 'Laura Campos', texto: 'Puedo ayudar con la parte visual y revisar que el diseño se adapte a móvil.', fecha: '12 nov 2026' },
        { usuario: 'Mateo Araya', texto: 'Yo puedo apoyar con las pruebas y documentar los casos principales.', fecha: '13 nov 2026' },
        { usuario: 'Valeria Chaves', texto: 'Sería útil hacer una lista de funciones para repartir mejor el trabajo.', fecha: '13 nov 2026' },
        { usuario: 'Luis Vargas', texto: 'También podemos organizar las tareas por etapas para no mezclar todo.', fecha: '13 nov 2026' }
      ]
    },
    {
      id: 'publicacion-2',
      usuario: 'María Fernández',
      correoAutor: 'maria.fernandez@sinergia.demo',
      perfil: 'perfil-maria-fernandez.html',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=84',
      contenido: 'Estoy preparando una guía de álgebra para estudiar en grupo. Si alguien necesita practicar ecuaciones, podemos organizar una sesión.',
      categoria: 'Matemáticas',
      tipo: 'academicas',
      likes: 8,
      corazones: 0,
      fecha: '29 de octubre de 2026',
      imagen: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=86',
      comentarios: [
        { usuario: 'Daniel Rodríguez', texto: '¡Gracias, María! Me vendría bien practicar sistemas de ecuaciones.', fecha: '11 nov 2026' },
        { usuario: 'Camila Jiménez', texto: 'Podemos preparar algunos ejercicios y explicar el procedimiento paso a paso.', fecha: '12 nov 2026' },
        { usuario: 'Andrés Quesada', texto: 'Tengo algunos apuntes de álgebra que podrían servir para estudiar.', fecha: '12 nov 2026' },
        { usuario: 'Paula Castillo', texto: 'Una guía con ejemplos resueltos sería excelente para repasar.', fecha: '13 nov 2026' }
      ]
    },
    {
      id: 'publicacion-3',
      usuario: 'Sebastián Mora',
      correoAutor: 'sebastian.mora@sinergia.demo',
      perfil: 'perfil-sebastian-mora.html',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&q=84',
      contenido: 'Busco compañeros interesados en desarrollar una aplicación móvil desde cero.',
      categoria: 'Desarrollo de aplicaciones',
      tipo: 'academicas',
      likes: 5,
      corazones: 0,
      fecha: '28 de octubre de 2026',
      imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=86',
      comentarios: [
        { usuario: 'Daniel Rodríguez', texto: 'Suena interesante. ¿Ya tienen definida la idea principal de la aplicación?', fecha: '10 nov 2026' },
        { usuario: 'Diego Méndez', texto: 'Puedo colaborar con la lógica y algunas pruebas de funcionamiento.', fecha: '11 nov 2026' },
        { usuario: 'Sofía Vargas', texto: 'También sería bueno crear un prototipo antes de empezar a programar.', fecha: '12 nov 2026' },
        { usuario: 'Andrea Solís', texto: 'Si necesitan apoyo con el diseño de las pantallas, puedo colaborar.', fecha: '13 nov 2026' },
        { usuario: 'María Fernández', texto: 'Me parece una buena oportunidad para aprender trabajando en equipo.', fecha: '13 nov 2026' }
      ]
    },
    {
          "id": "post-laura-1",
          "usuario": "Laura Campos",
          "correoAutor": "laura.campos@sinergia.demo",
          "perfil": "perfil-laura-campos.html",
          "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy trabajando en un prototipo de interfaz para una aplicación educativa. Me interesa que sea sencillo de navegar y que funcione bien tanto en computadora como en celular.",
          "categoria": "Diseño UX/UI",
          "tipo": "academicas",
          "likes": 9,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con diseño ux/ui para la publicación de Laura Campos",
          "comentarios": [
                {
                      "usuario": "Andrea Solís",
                      "texto": "La organización de las pantallas se ve muy clara.",
                      "fecha": "13 nov 2026"
                },
                {
                      "usuario": "Sofía Vargas",
                      "texto": "Me gusta la combinación de colores.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-andrea-1",
          "usuario": "Andrea Solís",
          "correoAutor": "andrea.solis@sinergia.demo",
          "perfil": "perfil-andrea-solis.html",
          "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&q=84",
          "contenido": "Busco compañeros para revisar la experiencia de usuario de un sitio web. Quiero probar formularios, navegación y accesibilidad antes de publicarlo.",
          "categoria": "Diseño UX/UI",
          "tipo": "academicas",
          "likes": 14,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con diseño ux/ui para la publicación de Andrea Solís",
          "comentarios": [
                {
                      "usuario": "Laura Campos",
                      "texto": "Podemos comparar los flujos de navegación.",
                      "fecha": "13 nov 2026"
                },
                {
                      "usuario": "Daniel Rodríguez",
                      "texto": "Me apunto para revisar los formularios.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-luis-1",
          "usuario": "Luis Vargas",
          "correoAutor": "luis.vargas@sinergia.demo",
          "perfil": "perfil-luis-vargas.html",
          "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=420&q=84",
          "contenido": "Preparé un resumen de direccionamiento IP y subnetting con ejemplos pequeños para practicar antes de la evaluación.",
          "categoria": "Redes",
          "tipo": "academicas",
          "likes": 7,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con redes para la publicación de Luis Vargas",
          "comentarios": [
                {
                      "usuario": "Andrés Quesada",
                      "texto": "Me serviría para repasar las máscaras.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-valeria-1",
          "usuario": "Valeria Chaves",
          "correoAutor": "valeria.chaves@sinergia.demo",
          "perfil": "perfil-valeria-chaves.html",
          "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy creando una guía rápida de colores y tipografías para mantener una identidad visual coherente en nuestros proyectos.",
          "categoria": "Diseño gráfico",
          "tipo": "academicas",
          "likes": 11,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1507908708918-778587c9e563?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con diseño gráfico para la publicación de Valeria Chaves",
          "comentarios": [
                {
                      "usuario": "Sofía Vargas",
                      "texto": "Puedo ayudarte a revisar la paleta para modo oscuro.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-andres-1",
          "usuario": "Andrés Quesada",
          "correoAutor": "andres.quesada@sinergia.demo",
          "perfil": "perfil-andres-quesada.html",
          "avatar": "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy practicando Python con pequeños programas para ordenar datos y automatizar tareas repetitivas. ¿Alguien quiere intercambiar ejercicios?",
          "categoria": "Programación",
          "tipo": "academicas",
          "likes": 6,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con programación para la publicación de Andrés Quesada",
          "comentarios": [
                {
                      "usuario": "Diego Méndez",
                      "texto": "Tengo un ejercicio de automatización que podemos comparar.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-mateo-1",
          "usuario": "Mateo Araya",
          "correoAutor": "mateo.araya@sinergia.demo",
          "perfil": "perfil-mateo-araya.html",
          "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy armando una lista de casos de prueba para revisar formularios y botones. La idea es detectar errores antes de entregar el proyecto.",
          "categoria": "Pruebas QA",
          "tipo": "academicas",
          "likes": 5,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con pruebas qa para la publicación de Mateo Araya",
          "comentarios": [
                {
                      "usuario": "Daniel Rodríguez",
                      "texto": "Podemos incluir pruebas en celular también.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-camila-1",
          "usuario": "Camila Jiménez",
          "correoAutor": "camila.jimenez@sinergia.demo",
          "perfil": "perfil-camila-jimenez.html",
          "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy organizando fuentes para un trabajo de ciencias. Quiero que cada integrante tenga claro qué información debe investigar y cómo citarla.",
          "categoria": "Investigación",
          "tipo": "academicas",
          "likes": 8,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con investigación para la publicación de Camila Jiménez",
          "comentarios": [
                {
                      "usuario": "María Fernández",
                      "texto": "Un documento compartido puede ayudar a ordenar las referencias.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-sofia-1",
          "usuario": "Sofía Vargas",
          "correoAutor": "sofia.vargas@sinergia.demo",
          "perfil": "perfil-sofia-vargas.html",
          "avatar": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=420&q=84",
          "contenido": "Hice unas pruebas de identidad visual con tonos lavanda, azul y turquesa. Busco opiniones sobre cuál combinación se siente más equilibrada.",
          "categoria": "Diseño gráfico",
          "tipo": "academicas",
          "likes": 10,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con diseño gráfico para la publicación de Sofía Vargas",
          "comentarios": [
                {
                      "usuario": "Valeria Chaves",
                      "texto": "La segunda paleta tiene buen contraste.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-diego-1",
          "usuario": "Diego Méndez",
          "correoAutor": "diego.mendez@sinergia.demo",
          "perfil": "perfil-diego-mendez.html",
          "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=420&q=84",
          "contenido": "Terminé una pequeña función para validar datos de formularios. Ahora estoy probando qué pasa cuando los campos llegan vacíos o superan el límite permitido.",
          "categoria": "Programación",
          "tipo": "academicas",
          "likes": 13,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con programación para la publicación de Diego Méndez",
          "comentarios": [
                {
                      "usuario": "Mateo Araya",
                      "texto": "Esos casos son importantes para QA.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-paula-1",
          "usuario": "Paula Castillo",
          "correoAutor": "paula.castillo@sinergia.demo",
          "perfil": "perfil-paula-castillo.html",
          "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy ayudando a organizar la documentación de un proyecto. Mi objetivo es explicar cada sección de forma clara y sin repetir información.",
          "categoria": "Comunicación",
          "tipo": "academicas",
          "likes": 4,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con comunicación para la publicación de Paula Castillo",
          "comentarios": [
                {
                      "usuario": "Camila Jiménez",
                      "texto": "Separar el documento por etapas ayuda mucho.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-mateo-2",
          "usuario": "Mateo Araya",
          "correoAutor": "mateo.araya@sinergia.demo",
          "perfil": "perfil-mateo-araya.html",
          "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=420&q=84",
          "contenido": "¿Qué herramientas utilizan para organizar las tareas de un proyecto? Estoy comparando tableros sencillos para que el equipo pueda ver lo pendiente y lo terminado.",
          "categoria": "Organización",
          "tipo": "academicas",
          "likes": 3,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con organización para la publicación de Mateo Araya",
          "comentarios": [
                {
                      "usuario": "Sebastián Mora",
                      "texto": "Un tablero Kanban nos ha funcionado bien.",
                      "fecha": "13 nov 2026"
                }
          ]
    },
    {
          "id": "post-sebastian-2",
          "usuario": "Sebastián Mora",
          "correoAutor": "sebastian.mora@sinergia.demo",
          "perfil": "perfil-sebastian-mora.html",
          "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&q=84",
          "contenido": "Estoy buscando colaboradores para convertir una idea de aplicación móvil en un prototipo. Podemos empezar definiendo las funciones principales y repartir tareas.",
          "categoria": "Desarrollo de aplicaciones",
          "tipo": "academicas",
          "likes": 15,
          "corazones": 0,
          "fecha": "13 de noviembre de 2026",
          "imagen": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9?auto=format&fit=crop&w=1400&q=86",
          "textoAlternativo": "Imagen relacionada con desarrollo de aplicaciones para la publicación de Sebastián Mora",
          "comentarios": [
                {
                      "usuario": "Daniel Rodríguez",
                      "texto": "Podemos trabajar primero en el flujo de pantallas.",
                      "fecha": "13 nov 2026"
                }
          ]
    }
    ,
    {
      "id": "post-andrea-2",
      "usuario": "Andrea Solís",
      "correoAutor": "andrea.solis@sinergia.demo",
      "perfil": "perfil-andrea-solis.html",
      "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&q=84",
      "contenido": "Terminé un prototipo para el panel de inicio. Estoy probando que los botones tengan estados claros y que los textos sean fáciles de leer.",
      "categoria": "Diseño UX/UI", "tipo": "academicas", "likes": 9, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Prototipo de una interfaz digital diseñado por Andrea Solís",
      "comentarios": [{"usuario":"Laura Campos","texto":"Me gusta el orden de las secciones. En móvil se entiende muy bien.","fecha":"13 nov 2026"},{"usuario":"Daniel Rodríguez","texto":"Los estados de los botones ayudan bastante a entender qué se puede hacer.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-luis-2",
      "usuario": "Luis Vargas",
      "correoAutor": "luis.vargas@sinergia.demo",
      "perfil": "perfil-luis-vargas.html",
      "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=420&q=84",
      "contenido": "Hice una práctica de configuración de una red pequeña con varias computadoras. Si alguien quiere repasar direccionamiento, podemos compartir ejercicios.",
      "categoria": "Redes", "tipo": "academicas", "likes": 12, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Equipos y conexiones de red para una práctica de informática",
      "comentarios": [{"usuario":"Andrés Quesada","texto":"Podemos comparar las tablas de direccionamiento.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-maria-2",
      "usuario": "María Fernández",
      "correoAutor": "maria.fernandez@sinergia.demo",
      "perfil": "perfil-maria-fernandez.html",
      "avatar": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=420&q=84",
      "contenido": "Organicé una sesión corta para resolver problemas de álgebra en equipo. La idea es explicar el procedimiento y no solamente compartir el resultado.",
      "categoria": "Matemáticas", "tipo": "academicas", "likes": 16, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Cuaderno con ejercicios de matemáticas para una sesión de estudio",
      "comentarios": [{"usuario":"Camila Jiménez","texto":"Me parece buena idea explicar cada paso para que todos puedan seguirlo.","fecha":"13 nov 2026"},{"usuario":"Daniel Rodríguez","texto":"Me apunto para practicar antes de la evaluación.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-valeria-2",
      "usuario": "Valeria Chaves",
      "correoAutor": "valeria.chaves@sinergia.demo",
      "perfil": "perfil-valeria-chaves.html",
      "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=420&q=84",
      "contenido": "Compartí una pequeña guía para mantener consistentes los colores, botones y espacios de una interfaz. También incluí ejemplos para el tema oscuro.",
      "categoria": "Diseño gráfico", "tipo": "academicas", "likes": 10, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1507908708918-778587c9e563?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Muestras de colores y elementos para una guía de diseño",
      "comentarios": [{"usuario":"Sofía Vargas","texto":"La paleta tiene buen contraste. Voy a usarla como referencia.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-andres-2",
      "usuario": "Andrés Quesada",
      "correoAutor": "andres.quesada@sinergia.demo",
      "perfil": "perfil-andres-quesada.html",
      "avatar": "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=420&q=84",
      "contenido": "Probé un programa que organiza una lista de datos y genera un resumen automáticamente. Estoy preparando una explicación para compartir el proceso.",
      "categoria": "Programación", "tipo": "academicas", "likes": 8, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Código de programación en una pantalla de computadora",
      "comentarios": [{"usuario":"Diego Méndez","texto":"Cuando esté listo podemos revisar los casos de entrada.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-mateo-3",
      "usuario": "Mateo Araya",
      "correoAutor": "mateo.araya@sinergia.demo",
      "perfil": "perfil-mateo-araya.html",
      "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=420&q=84",
      "contenido": "Preparé una lista para revisar el inicio de sesión, los formularios y los enlaces del proyecto. También agregué pruebas de navegación desde el celular.",
      "categoria": "Pruebas QA", "tipo": "academicas", "likes": 11, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Equipo de trabajo revisando pruebas de una aplicación",
      "comentarios": [{"usuario":"Daniel Rodríguez","texto":"Incluí también el cierre de sesión y los cambios de tema.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-camila-2",
      "usuario": "Camila Jiménez",
      "correoAutor": "camila.jimenez@sinergia.demo",
      "perfil": "perfil-camila-jimenez.html",
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=420&q=84",
      "contenido": "Estoy ordenando las referencias de nuestro trabajo de ciencias y separando las fuentes por tema para que sea más sencillo encontrar la información.",
      "categoria": "Investigación", "tipo": "academicas", "likes": 7, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Cuaderno y material de estudio para organizar una investigación",
      "comentarios": [{"usuario":"María Fernández","texto":"Separar las fuentes por tema va a facilitar la revisión.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-sofia-2",
      "usuario": "Sofía Vargas",
      "correoAutor": "sofia.vargas@sinergia.demo",
      "perfil": "perfil-sofia-vargas.html",
      "avatar": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=420&q=84",
      "contenido": "Hice una comparación de iconos y estilos de botones para que las pantallas mantengan la misma identidad visual en modo claro y oscuro.",
      "categoria": "Diseño gráfico", "tipo": "academicas", "likes": 13, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Diseño de interfaz y elementos gráficos para una aplicación",
      "comentarios": [{"usuario":"Valeria Chaves","texto":"Me gusta que los iconos conserven el mismo peso visual.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-diego-2",
      "usuario": "Diego Méndez",
      "correoAutor": "diego.mendez@sinergia.demo",
      "perfil": "perfil-diego-mendez.html",
      "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=420&q=84",
      "contenido": "Estoy probando distintas formas de validar los datos de un formulario para mostrar mensajes claros cuando falta información o hay un formato incorrecto.",
      "categoria": "Programación", "tipo": "academicas", "likes": 9, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Pantalla de trabajo con código de programación",
      "comentarios": [{"usuario":"Mateo Araya","texto":"Esos casos deberían aparecer en la lista de pruebas.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-paula-2",
      "usuario": "Paula Castillo",
      "correoAutor": "paula.castillo@sinergia.demo",
      "perfil": "perfil-paula-castillo.html",
      "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=420&q=84",
      "contenido": "Revisé la documentación del equipo y organicé los títulos para que cada parte tenga una explicación breve, ordenada y fácil de consultar.",
      "categoria": "Comunicación", "tipo": "academicas", "likes": 6, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Documentos y cuaderno para organizar la información de un proyecto",
      "comentarios": [{"usuario":"Camila Jiménez","texto":"Los títulos claros hacen que sea más rápido encontrar cada sección.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-laura-2",
      "usuario": "Laura Campos",
      "correoAutor": "laura.campos@sinergia.demo",
      "perfil": "perfil-laura-campos.html",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=84",
      "contenido": "Estoy revisando cómo se adapta la página de inicio a diferentes tamaños de pantalla. Quiero que las tarjetas mantengan buen espacio y que la navegación sea cómoda.",
      "categoria": "Diseño UX/UI", "tipo": "academicas", "likes": 12, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Interfaz web y diseño adaptable en distintos dispositivos",
      "comentarios": [{"usuario":"Andrea Solís","texto":"Podemos comprobar también los espacios entre las tarjetas.","fecha":"13 nov 2026"}]
    },
    {
      "id": "post-sebastian-3",
      "usuario": "Sebastián Mora",
      "correoAutor": "sebastian.mora@sinergia.demo",
      "perfil": "perfil-sebastian-mora.html",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&q=84",
      "contenido": "Avancé con el prototipo de una aplicación para organizar tareas de grupo. La siguiente parte será probar cómo se comporta cuando hay varias personas colaborando.",
      "categoria": "Desarrollo de aplicaciones", "tipo": "academicas", "likes": 17, "corazones": 0,
      "fecha": "13 de noviembre de 2026",
      "imagen": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9?auto=format&fit=crop&w=1400&q=86",
      "textoAlternativo": "Prototipo de aplicación móvil en una pantalla de teléfono",
      "comentarios": [{"usuario":"Daniel Rodríguez","texto":"Podemos probar primero la creación y asignación de tareas.","fecha":"13 nov 2026"}]
    }
    ,
    {
      id: 'post-ocio-diego-1', usuario: 'Diego Méndez', correoAutor: 'diego.mendez@sinergia.demo', perfil: 'perfil-diego-mendez.html',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=420&q=84',
      contenido: 'Este fin de semana salí a hacer fotografía urbana. Estoy buscando recomendaciones de lugares tranquilos y con buena arquitectura para practicar.',
      categoria: 'Fotografía', tipo: 'ocio', likes: 12, corazones: 3, fecha: '14 de noviembre de 2026',
      imagen: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=86',
      textoAlternativo: 'Calle urbana con arquitectura y luz de atardecer', comentarios: [{ usuario: 'Laura Campos', texto: 'El centro histórico tiene rincones muy buenos para eso.', fecha: '14 nov 2026' }]
    },
    {
      id: 'post-ocio-paula-1', usuario: 'Paula Castillo', correoAutor: 'paula.castillo@sinergia.demo', perfil: 'perfil-paula-castillo.html',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=420&q=84',
      contenido: 'Estoy armando una pequeña lista de canciones para estudiar, leer o dibujar. ¿Qué música les ayuda a concentrarse sin distraerse?',
      categoria: 'Música', tipo: 'ocio', likes: 18, corazones: 5, fecha: '14 de noviembre de 2026',
      imagen: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=86',
      textoAlternativo: 'Audífonos y equipo de música sobre un escritorio', comentarios: [{ usuario: 'Andrea Solís', texto: 'Las listas instrumentales y lo-fi me funcionan bastante.', fecha: '14 nov 2026' }]
    },
    {
      id: 'post-ocio-camila-1', usuario: 'Camila Jiménez', correoAutor: 'camila.jimenez@sinergia.demo', perfil: 'perfil-camila-jimenez.html',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=420&q=84',
      contenido: 'Quiero empezar a salir a caminar y conocer senderos sencillos cerca de la ciudad. Si tienen recomendaciones para principiantes, ¡las leo!',
      categoria: 'Aire libre', tipo: 'ocio', likes: 9, corazones: 4, fecha: '13 de noviembre de 2026',
      imagen: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=86',
      textoAlternativo: 'Sendero natural entre árboles', comentarios: [{ usuario: 'Sofía Vargas', texto: 'Busca rutas cortas y lleva agua; hay opciones muy bonitas.', fecha: '13 nov 2026' }]
    },
    {
      id: 'post-ocio-mateo-1', usuario: 'Mateo Araya', correoAutor: 'mateo.araya@sinergia.demo', perfil: 'perfil-mateo-araya.html',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=420&q=84',
      contenido: 'Estoy practicando ilustración digital y me gustaría compartir ejercicios, referencias y retos creativos con otras personas que estén aprendiendo.',
      categoria: 'Arte y creatividad', tipo: 'ocio', likes: 15, corazones: 2, fecha: '12 de noviembre de 2026',
      imagen: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1400&q=86',
      textoAlternativo: 'Materiales de dibujo y pintura en una mesa', comentarios: [{ usuario: 'Paula Castillo', texto: 'Podríamos hacer un reto de dibujo semanal.', fecha: '13 nov 2026' }]
    },
    {
      id: 'post-ocio-luis-1', usuario: 'Luis Vargas', correoAutor: 'luis.vargas@sinergia.demo', perfil: 'perfil-luis-vargas.html',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=420&q=84',
      contenido: '¿Alguien juega ajedrez o conoce algún club para partidas amistosas? Me gustaría practicar y conocer gente con el mismo pasatiempo.',
      categoria: 'Juegos', tipo: 'ocio', likes: 7, corazones: 1, fecha: '11 de noviembre de 2026',
      imagen: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1400&q=86',
      textoAlternativo: 'Tablero de ajedrez preparado para una partida', comentarios: [{ usuario: 'Andrés Quesada', texto: 'Me apunto a una partida amistosa cuando organicen.', fecha: '12 nov 2026' }]
    }
  ];

  // Recupera publicaciones. También migra los comentarios guardados en la ronda anterior.
  // obtenerPublicaciones
  function obtenerPublicaciones() {
    const guardadas = safeRead(localStorage, STORAGE.publications, null);
    if (Array.isArray(guardadas)) {
      const existingIds = new Set(guardadas.map((item) => item.id));
      const idsNuevos = ['post-laura-1', 'post-andrea-1', 'post-luis-1', 'post-valeria-1', 'post-andres-1', 'post-mateo-1', 'post-camila-1', 'post-sofia-1', 'post-diego-1', 'post-paula-1', 'post-mateo-2', 'post-sebastian-2', 'post-andrea-2', 'post-luis-2', 'post-maria-2', 'post-valeria-2', 'post-andres-2', 'post-mateo-3', 'post-camila-2', 'post-sofia-2', 'post-diego-2', 'post-paula-2', 'post-laura-2', 'post-sebastian-3', 'post-ocio-diego-1', 'post-ocio-paula-1', 'post-ocio-camila-1', 'post-ocio-mateo-1', 'post-ocio-luis-1'];
      const nuevasPublicaciones = idsNuevos
        .filter((id) => !existingIds.has(id))
        .map((id) => PUBLICACIONES_INICIALES.find((item) => item.id === id))
        .filter(Boolean);
      const agregadas = [...nuevasPublicaciones, ...guardadas];
      if (agregadas.length !== guardadas.length) safeWrite(localStorage, STORAGE.publications, agregadas);
      return agregadas;
    }

    const comentariosValue = safeRead(localStorage, STORAGE.comments, {});
    const reaccionesValue = safeRead(localStorage, STORAGE.reactions, {});
    const comentariosAnteriores = comentariosValue && typeof comentariosValue === 'object' ? comentariosValue : {};
    const reaccionesAnteriores = reaccionesValue && typeof reaccionesValue === 'object' ? reaccionesValue : {};
    const iniciales = PUBLICACIONES_INICIALES.map((publicacion) => {
      const previous = reaccionesAnteriores[publicacion.id] || {};
      return {
        ...publicacion,
        // Migra los clics de la versión anterior a los contadores numéricos del arreglo.
        likes: Number(publicacion.likes || 0) + Number(Boolean(previous.like)),
        corazones: Number(publicacion.corazones || 0) + Number(Boolean(previous.heart)),
        comentarios: Array.isArray(comentariosAnteriores[publicacion.id])
          ? comentariosAnteriores[publicacion.id].map((comentario) => ({
            usuario: comentario.usuario || comentario.author || 'Miembro de Sinergia',
            texto: comentario.texto || comentario.text || '',
            fecha: comentario.fecha || comentario.time || 'Reciente'
          }))
          : publicacion.comentarios.map((comentario) => ({
            usuario: comentario.usuario,
            texto: comentario.texto,
            fecha: comentario.fecha
          }))
      };
    });
    safeWrite(localStorage, STORAGE.publications, iniciales);
    return iniciales;
  }

  // guardarPublicaciones
  function guardarPublicaciones(publicaciones) {
    const saved = safeWrite(localStorage, STORAGE.publications, publicaciones);
    if (!saved) {
      console.warn('No se guardaron las publicaciones. Puede que el almacenamiento del navegador esté lleno o bloqueado.');
    }
    return saved;
  }

  // Normaliza categorías para comparar valores escritos y parámetros de URL.
  // normalizarCategoria
  function normalizarCategoria(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');
  }

  // crearElemento
  function crearElemento(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  // crearBotonReaccion
  function crearBotonReaccion(tipo, etiqueta, ariaLabel) {
    const button = crearElemento('button', 'boton boton-reaccion');
    button.type = 'button';
    button.dataset.reaction = tipo;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', ariaLabel);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', tipo === 'like'
      ? 'M2.7 10.4h3.1v10.1H2.7zM8 20.5h9.4c.9 0 1.7-.6 1.9-1.5l1.7-7.1c.3-1.2-.6-2.3-1.8-2.3h-5.4l.8-4.1c.2-1-.2-2-1.1-2.5l-.7-.4L8 9.2v11.3z'
      : 'M12 21s-8.2-4.8-9.6-10C1.1 6.5 3.6 3 7.4 3c2 0 3.7 1.1 4.6 2.7C12.9 4.1 14.6 3 16.6 3c3.8 0 6.3 3.5 5 8-1.4 5.2-9.6 10-9.6 10z');
    svg.appendChild(path);
    button.append(svg, crearElemento('span', '', etiqueta));
    return button;
  }

  // Dibuja cada comentario sin insertar HTML escrito por usuarios.
  // crearComentario
  function crearComentario(comentario) {
    const item = crearElemento('li', 'comentario-item');
    const header = crearElemento('div', 'comentario-encabezado');
    header.append(
      crearElemento('strong', '', comentario.usuario || 'Miembro de Sinergia'),
      crearElemento('time', '', comentario.fecha || 'Reciente')
    );
    item.append(header, crearElemento('p', 'comentario-texto', comentario.texto || ''));
    return item;
  }

  // Actualiza contadores y estados accesibles de los dos tipos de reacción.
  // actualizarContadores
  function actualizarContadores(article, publicacion, reacciones) {
    const meGusta = Number(publicacion.likes || 0);
    const corazones = Number(publicacion.corazones || 0);
    const likeCount = article.querySelector('[data-count-like]');
    const heartCount = article.querySelector('[data-count-heart]');
    if (likeCount) likeCount.textContent = `${meGusta} Me gusta`;
    if (heartCount) heartCount.textContent = `${corazones} corazones`;

    article.querySelectorAll('[data-reaction]').forEach((button) => {
      const active = Boolean(reacciones[button.dataset.reaction]);
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('reaccion-activa', active);
    });
  }

  // Construye una tarjeta de publicación completa a partir de un objeto del arreglo.
  // crearTarjetaPublicacion
  function crearTarjetaPublicacion(publicacion, sesion, mapaReacciones) {
    const article = crearElemento('article', 'tarjeta publicacion');
    article.id = publicacion.id;
    article.dataset.postId = publicacion.id;

    const header = crearElemento('header', 'publicacion-cabecera');
    const avatar = crearElemento('img', 'foto-perfil foto-pequena');
    avatar.src = publicacion.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=84';
    avatar.alt = `Fotografía de perfil de ${publicacion.usuario}`;
    avatar.loading = 'lazy';
    const author = crearElemento('h3', '', publicacion.usuario);
    const date = crearElemento('p');
    const time = crearElemento('time', '', publicacion.fecha || 'Publicación reciente');
    date.appendChild(time);
    header.append(avatar, author, date);

    if (publicacion.perfil) {
      const profileLink = crearElemento('a', 'boton boton-perfil-disponible', 'Ver perfil del autor');
      profileLink.href = publicacion.perfil;
      profileLink.setAttribute('aria-label', `Ver perfil de ${publicacion.usuario}`);
      header.appendChild(profileLink);
    }

    article.append(header, crearElemento('p', 'publicacion-contenido', publicacion.contenido));

    if (publicacion.imagen) {
      const figure = crearElemento('figure', 'publicacion-media');
      const image = crearElemento('img');
      image.src = publicacion.imagen;
      image.alt = publicacion.textoAlternativo || `Imagen relacionada con la publicación de ${publicacion.usuario}`;
      image.loading = 'lazy';
      figure.appendChild(image);
      article.appendChild(figure);
    }

    article.appendChild(crearElemento('p', 'publicacion-categoria', `Categoría: ${publicacion.categoria}`));

    const footer = crearElemento('footer', 'publicacion-pie');
    const stats = crearElemento('div', 'estadisticas-publicacion');
    const likeCount = crearElemento('p', 'contador-me-gusta', '');
    const heartCount = crearElemento('p', 'contador-corazones', '');
    likeCount.dataset.countLike = '';
    heartCount.dataset.countHeart = '';
    stats.append(likeCount, heartCount);

    const actions = crearElemento('div', 'acciones-reaccion');
    actions.setAttribute('aria-label', `Reacciones a la publicación de ${publicacion.usuario}`);
    actions.append(
      crearBotonReaccion('like', 'Me gusta', `Dar me gusta a la publicación de ${publicacion.usuario}`),
      crearBotonReaccion('heart', 'Corazón', `Enviar corazón a la publicación de ${publicacion.usuario}`)
    );
    footer.append(stats, actions);

    // Solo el dueño de la publicación ve la opción para eliminarla.
    if (sesion?.email && publicacion.correoAutor === sesion.email) {
      const deleteButton = crearElemento('button', 'boton boton-eliminar-publicacion', 'Eliminar');
      deleteButton.type = 'button';
      deleteButton.dataset.deletePost = publicacion.id;
      deleteButton.setAttribute('aria-label', `Eliminar publicación de ${publicacion.usuario}`);
      footer.appendChild(deleteButton);
    }
    article.appendChild(footer);

    const commentsSection = crearElemento('section', 'comentarios');
    const commentsTitle = crearElemento('h4');
    commentsTitle.id = `titulo-comentarios-${publicacion.id}`;
    const comments = Array.isArray(publicacion.comentarios) ? publicacion.comentarios : [];
    const commentCount = crearElemento('span', '', String(comments.length));
    commentCount.dataset.commentCount = '';
    commentsTitle.append(commentCount, document.createTextNode(' Comentarios'));

    const scroll = crearElemento('div', 'comentarios-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', `Comentarios de la publicación de ${publicacion.usuario}`);
    const list = crearElemento('ol', 'lista-comentarios');
    list.dataset.commentList = '';
    comments.forEach((comment) => list.appendChild(crearComentario(comment)));
    scroll.appendChild(list);

    const commentForm = crearElemento('form', 'formulario formulario-comentario');
    commentForm.method = 'post';
    commentForm.dataset.commentForm = '';
    const fieldId = `comentario-${publicacion.id}`;
    const label = crearElemento('label', '', 'Escribe un comentario');
    label.htmlFor = fieldId;
    const textarea = crearElemento('textarea');
    textarea.id = fieldId;
    textarea.name = 'comentario';
    textarea.rows = 2;
    textarea.maxLength = 500;
    textarea.required = true;
    textarea.placeholder = 'Comparte una idea respetuosa...';
    const submit = crearElemento('button', 'boton', 'Comentar');
    submit.type = 'submit';
    commentForm.append(label, textarea, submit);

    commentsSection.append(commentsTitle, scroll, commentForm);
    commentsSection.setAttribute('aria-labelledby', commentsTitle.id);
    article.appendChild(commentsSection);

    const reactionState = mapaReacciones[publicacion.id] || { like: false, heart: false };
    actualizarContadores(article, publicacion, reactionState);
    return article;
  }

  // Carga datos iniciales y conecta filtros, reacciones, comentarios y borrado.
  // initPublications
  function initPublications() {
    const page = document.querySelector('.pantalla-publicaciones');
    if (!page) return;

    const academicFeed = page.querySelector('#lista-publicaciones-academicas');
    const leisureFeed = page.querySelector('#lista-publicaciones-ocio');
    if (!academicFeed || !leisureFeed) return;

    let publications = obtenerPublicaciones();
    let reactionMap = safeRead(localStorage, STORAGE.reactions, {});
    if (!reactionMap || typeof reactionMap !== 'object' || Array.isArray(reactionMap)) reactionMap = {};
    let activeType = 'todas';
    const requestedSearch = String(new URLSearchParams(window.location.search).get('busqueda') || '').trim().toLocaleLowerCase('es');

    const categorySelect = page.querySelector('#filtro-categoria');
    const typeButtons = [...page.querySelectorAll('[data-filtro]')];
    const requestedCategory = new URLSearchParams(window.location.search).get('categoria');
    if (categorySelect && requestedCategory) {
      const normalized = normalizarCategoria(requestedCategory);
      const option = [...categorySelect.options].find((item) => normalizarCategoria(item.value) === normalized);
      if (option) categorySelect.value = option.value;
    }

    // showEmptyState
    function showEmptyState(feed, message) {
      feed.appendChild(crearElemento('p', 'estado-publicaciones-vacio', message));
    }

    // Recorre el arreglo y pinta únicamente las publicaciones que coinciden.
    // renderPublications
    function renderPublications() {
      academicFeed.replaceChildren();
      leisureFeed.replaceChildren();
      const category = normalizarCategoria(categorySelect?.value || 'todas');

      const visible = publications.filter((post) => {
        const typeMatches = activeType === 'todas' || post.tipo === activeType;
        const categoryMatches = !category || category === 'todas' || normalizarCategoria(post.categoria) === category;
        const searchable = `${post.texto || ''} ${post.usuario || ''} ${post.categoria || ''}`.toLocaleLowerCase('es');
        const searchMatches = !requestedSearch || searchable.includes(requestedSearch);
        return typeMatches && categoryMatches && searchMatches;
      });

      const academic = visible.filter((post) => post.tipo !== 'ocio');
      const leisure = visible.filter((post) => post.tipo === 'ocio');

      academic.forEach((post) => academicFeed.appendChild(
        crearTarjetaPublicacion(post, getSession(), reactionMap)
      ));
      leisure.forEach((post) => leisureFeed.appendChild(
        crearTarjetaPublicacion(post, getSession(), reactionMap)
      ));

      if (!academic.length && activeType !== 'ocio') {
        showEmptyState(academicFeed, requestedSearch ? `No encontramos publicaciones académicas para «${requestedSearch}». Prueba otro tema.` : 'No hay publicaciones académicas para esta categoría todavía.');
      }
      if (!leisure.length && activeType !== 'academicas') {
        showEmptyState(leisureFeed, requestedSearch ? `No encontramos publicaciones de ocio para «${requestedSearch}». Prueba otro tema.` : 'No hay publicaciones de ocio para esta categoría todavía.');
      }

      const academicSection = page.querySelector('#publicaciones-academicas');
      const leisureSection = page.querySelector('#publicaciones-ocio');
      if (academicSection) academicSection.hidden = activeType === 'ocio';
      if (leisureSection) leisureSection.hidden = activeType === 'academicas';

      typeButtons.forEach((button) => {
        const active = button.dataset.filtro === activeType;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('pestana-activa', active);
      });
    }

    // Cambia la pestaña de tipo (Todas, Ocio o Académicas).
    typeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeType = button.dataset.filtro || 'todas';
        renderPublications();
      });
    });
    categorySelect?.addEventListener('change', renderPublications);

    // Delegación de eventos: las tarjetas pueden reconstruirse sin perder eventos.
    page.addEventListener('click', (event) => {
      const reactionButton = event.target.closest('[data-reaction]');
      if (reactionButton) {
        const article = reactionButton.closest('.publicacion');
        const postId = article?.id;
        const kind = reactionButton.dataset.reaction;
        const post = publications.find((item) => item.id === postId);
        if (!post || !['like', 'heart'].includes(kind)) return;

        reactionMap[postId] = Object.assign({ like: false, heart: false }, reactionMap[postId] || {});
        const wasActive = Boolean(reactionMap[postId][kind]);
        reactionMap[postId][kind] = !wasActive;
        const countField = kind === 'like' ? 'likes' : 'corazones';
        const previousCount = Number(post[countField] || 0);
        post[countField] = Math.max(0, previousCount + (wasActive ? -1 : 1));

        // El número se actualiza en el mismo objeto del arreglo y se persiste.
        if (!guardarPublicaciones(publications)) {
          post[countField] = previousCount;
          reactionMap[postId][kind] = wasActive;
          return;
        }
        if (!safeWrite(localStorage, STORAGE.reactions, reactionMap)) {
          post[countField] = previousCount;
          reactionMap[postId][kind] = wasActive;
          guardarPublicaciones(publications);
          return;
        }
        actualizarContadores(article, post, reactionMap[postId]);
        return;
      }

      const deleteButton = event.target.closest('[data-delete-post]');
      if (deleteButton) {
        const postId = deleteButton.dataset.deletePost;
        const post = publications.find((item) => item.id === postId);
        const session = getSession();
        if (!post || !session?.email || post.correoAutor !== session.email) return;
        if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;

        publications = publications.filter((item) => item.id !== postId);
        delete reactionMap[postId];
        guardarPublicaciones(publications);
        safeWrite(localStorage, STORAGE.reactions, reactionMap);
        renderPublications();
      }
    });

    // Valida, agrega y guarda los comentarios del arreglo de publicaciones.
    page.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-comment-form]');
      if (!form) return;
      event.preventDefault();

      const article = form.closest('.publicacion');
      const post = publications.find((item) => item.id === article?.id);
      const field = form.querySelector('[name="comentario"]');
      const text = String(field?.value || '').trim();
      if (!post || !field || !text) {
        field?.setCustomValidity('Escribe un comentario antes de enviarlo.');
        field?.reportValidity();
        return;
      }
      field.setCustomValidity('');
      if (!Array.isArray(post.comentarios)) post.comentarios = [];
      const session = getSession();
      post.comentarios.push({
        usuario: getCurrentUserProfile().name || session?.name || 'Daniel Rodríguez',
        texto: text.slice(0, 500),
        fecha: formatTime()
      });

      if (!guardarPublicaciones(publications)) {
        post.comentarios.pop();
        let notice = form.querySelector('[data-comment-error]');
        if (!notice) {
          notice = crearElemento('p', 'estado estado-error');
          notice.dataset.commentError = '';
          notice.setAttribute('role', 'alert');
          form.appendChild(notice);
        }
        notice.textContent = 'No se pudo guardar el comentario. Revisa el almacenamiento del navegador.';
        return;
      }
      renderPublications();
      const updatedArticle = document.getElementById(post.id);
      const updatedScroll = updatedArticle?.querySelector('.comentarios-scroll');
      if (updatedScroll) updatedScroll.scrollTop = updatedScroll.scrollHeight;
      updatedArticle?.querySelector('textarea[name="comentario"]')?.focus();
    });

    renderPublications();
    if (window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Crea una publicación nueva desde el formulario y la agrega al arreglo.
  // initCreatePublication
  function initCreatePublication() {
    const form = document.querySelector('.formulario-publicacion');
    if (!form) return;

    const session = getSession();
    const nameField = form.elements.namedItem('nombre');
    const status = document.getElementById('estado-publicacion');
    if (nameField && (session?.name || getCurrentUserProfile().name)) {
      nameField.value = getCurrentUserProfile().name || session.name;
      nameField.readOnly = true;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const user = String(getCurrentUserProfile().name || session?.name || formData.get('nombre') || '').trim();
      const content = String(formData.get('contenido') || '').trim();
      const category = String(formData.get('categoria') || '').trim();
      const typeValue = String(formData.get('tipo') || '').trim();
      const imageFile = form.elements.namedItem('imagen')?.files?.[0];

      if (!user || content.length < 10 || !category || !['ocio', 'academico'].includes(typeValue)) {
        showStatus(status, 'Revisa los datos: escribe al menos diez caracteres y selecciona categoría y tipo.', 'error');
        return;
      }
      if (content.length > 2000) {
        showStatus(status, 'La publicación no puede superar los 2000 caracteres.', 'error');
        return;
      }

      // La imagen es opcional; el límite ayuda a evitar llenar el almacenamiento local.
      let imageData = '';
      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) {
          showStatus(status, 'El archivo seleccionado debe ser una imagen.', 'error');
          return;
        }
        if (imageFile.size > 1024 * 1024) {
          showStatus(status, 'La imagen supera 1 MB. Selecciona una versión más liviana.', 'error');
          return;
        }
        try {
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            reader.readAsDataURL(imageFile);
          });
        } catch (error) {
          showStatus(status, 'No se pudo leer la imagen seleccionada.', 'error');
          return;
        }
      }

      const newPost = {
        id: `publicacion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, 
        usuario: user,
        correoAutor: session?.email || '',
        perfil: 'perfil.html',
        avatar: getCurrentUserProfile().avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=84',
        contenido: content,
        categoria: category,
        tipo: typeValue === 'ocio' ? 'ocio' : 'academicas',
        likes: 0,
        corazones: 0,
        fecha: formatDate(),
        imagen: imageData,
        comentarios: []
      };

      const publications = obtenerPublicaciones();
      publications.unshift(newPost);
      if (!guardarPublicaciones(publications)) {
        showStatus(status, 'No se pudo guardar la publicación. Libera espacio del navegador e inténtalo otra vez.', 'error');
        return;
      }
      window.location.href = `publicaciones.html#${newPost.id}`;
    });

    form.querySelector('[data-cancelar-publicacion]')?.addEventListener('click', () => {
      window.location.href = 'publicaciones.html';
    });
  }

  // ETAPA 5 DE 6: PERFIL PERSONAL Y EDICIÓN DE DATOS Permite modificar los datos visibles del perfil de Daniel, guardar los cambios en localStorage y reutilizarlos en publicaciones nuevas.

  const PERFIL_PREDETERMINADO = {
    name: 'Daniel Rodríguez',
    headline: 'Estudiante y desarrollador interesado en proyectos web',
    bio: 'Me gusta construir la parte lógica de las aplicaciones y busco compañeros para crear proyectos web.',
    institution: 'Colegio técnico de ejemplo',
    activity: 'Desarrollo web y programación',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=84'
  };

  // getCurrentUserProfile
  function getCurrentUserProfile() {
    const session = getSession();
    const saved = safeRead(localStorage, STORAGE.profile, {});
    const profile = saved && typeof saved === 'object' && (!saved.email || saved.email === session?.email) ? saved : {};
    return {
      ...PERFIL_PREDETERMINADO,
      name: session?.name || PERFIL_PREDETERMINADO.name,
      ...profile
    };
  }

  // applyProfileData
  function applyProfileData(profile = getCurrentUserProfile()) {
    document.querySelectorAll('[data-profile-name]').forEach((node) => { node.textContent = profile.name; });
    document.querySelectorAll('[data-profile-headline]').forEach((node) => { node.textContent = profile.headline; });
    document.querySelectorAll('[data-profile-bio]').forEach((node) => { node.textContent = profile.bio; });
    document.querySelectorAll('[data-profile-institution]').forEach((node) => { node.textContent = profile.institution; });
    document.querySelectorAll('[data-profile-activity]').forEach((node) => { node.textContent = profile.activity; });
    document.querySelectorAll('[data-profile-avatar]').forEach((node) => {
      node.src = profile.avatar || PERFIL_PREDETERMINADO.avatar;
      node.alt = `Fotografía de perfil de ${profile.name}`;
    });
  }

  // Muestra en cada perfil las publicaciones que pertenecen a esa persona.
  // El perfil propio utiliza el correo de la sesión para distinguir cuentas.
  // initProfilePosts
  function initProfilePosts() {
    const containers = document.querySelectorAll('[data-profile-posts]');
    if (!containers.length) return;
    const allPosts = obtenerPublicaciones();
    const session = getSession();

    containers.forEach((container) => {
      const owner = container.dataset.profilePosts;
      const ownedPosts = allPosts.filter((post) => owner === '__current__'
        ? Boolean(session?.email) && post.correoAutor === session.email
        : post.usuario === owner);
      container.replaceChildren();

      if (!ownedPosts.length) {
        const empty = document.createElement('p');
        empty.className = 'estado-publicaciones-vacio';
        empty.textContent = 'Todavía no ha compartido publicaciones. Cuando publique algo, aparecerá aquí.';
        container.appendChild(empty);
        return;
      }

      ownedPosts.forEach((post) => {
        const article = document.createElement('article');
        article.className = 'tarjeta publicacion tarjeta-publicacion-perfil';
        const header = document.createElement('header');
        header.className = 'publicacion-cabecera';
        const photo = document.createElement('img');
        photo.className = 'foto-perfil foto-pequena';
        photo.src = post.avatar;
        photo.alt = `Fotografía de perfil de ${post.usuario}`;
        photo.loading = 'lazy';
        const author = document.createElement('h3');
        author.textContent = post.usuario;
        const date = document.createElement('p');
        const time = document.createElement('time');
        time.textContent = post.fecha || 'Publicación reciente';
        date.appendChild(time);
        header.append(photo, author, date);

        const content = document.createElement('p');
        content.className = 'publicacion-contenido';
        content.textContent = post.contenido;
        article.append(header, content);

        if (post.imagen) {
          const figure = document.createElement('figure');
          figure.className = 'publicacion-media';
          const image = document.createElement('img');
          image.src = post.imagen;
          image.alt = post.textoAlternativo || `Imagen relacionada con la publicación de ${post.usuario}`;
          image.loading = 'lazy';
          figure.appendChild(image);
          article.appendChild(figure);
        }

        const category = document.createElement('p');
        category.className = 'publicacion-categoria';
        category.textContent = `Categoría: ${post.categoria}`;
        const footer = document.createElement('footer');
        footer.className = 'publicacion-pie';
        const summary = document.createElement('p');
        summary.className = 'contador-me-gusta';
        const comments = Array.isArray(post.comentarios) ? post.comentarios.length : 0;
        summary.textContent = `${Number(post.likes || 0)} Me gusta · ${Number(post.corazones || 0)} corazones · ${comments} comentarios`;
        const link = document.createElement('a');
        link.className = 'boton boton-perfil-disponible';
        link.href = `publicaciones.html#${encodeURIComponent(post.id)}`;
        link.textContent = 'Ver publicación';
        footer.append(summary, link);
        article.append(category, footer);
        container.appendChild(article);
      });
    });
  }

  // initManualLocation
  function initManualLocation() {
    const form = document.querySelector('[data-manual-location-form]');
    if (!form) return;
    const select = form.querySelector('#zona-manual');
    const status = form.querySelector('[data-location-status]');
    const cards = Array.from(document.querySelectorAll('.pantalla-cercanas .tarjeta-persona'));
    const saved = safeRead(localStorage, STORAGE.manualLocation, '');
    if (saved && select) select.value = saved;

    // applyLocation
    function applyLocation(value, announce = false) {
      let visible = 0;
      cards.forEach((card) => {
        const text = `${card.querySelector('h3')?.textContent || ''} ${card.querySelector('.zona-publica')?.textContent || ''}`.toLocaleLowerCase('es');
        const match = !value
          || (value === 'san-jose' && /san jos[eé]|san jos[eé]/i.test(text))
          || (value === 'heredia' && /heredia/i.test(text))
          || (value === 'cartago' && /cartago/i.test(text))
          || (value === 'institucion-ejemplo' && /instituto|universidad|colegio/i.test(text));
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (status) {
        status.hidden = !announce;
        status.textContent = value
          ? `Ubicación manual aplicada. Se muestran ${visible} perfiles que coinciden con la zona seleccionada.`
          : `Mostrando todos los perfiles disponibles (${visible}).`;
      }
    }

    if (saved) applyLocation(saved, false);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = String(select?.value || '');
      safeWrite(localStorage, STORAGE.manualLocation, value);
      applyLocation(value, true);
    });
  }

  // initGlobalSearch
  function initGlobalSearch() {
    const topics = ['Programación', 'Matemáticas', 'Desarrollo de aplicaciones', 'Diseño', 'Idiomas', 'Frontend', 'UI/UX', 'Inteligencia artificial', 'Bases de datos', 'Fotografía', 'Música', 'Deportes'];
    document.querySelectorAll('form.buscador').forEach((form) => {
      const input = form.querySelector('input[type="search"]');
      if (!input || form.dataset.searchReady === 'true') return;
      form.dataset.searchReady = 'true';
      input.setAttribute('list', 'sinergia-temas-sugeridos');
      input.setAttribute('autocomplete', 'off');
      input.placeholder = 'Buscar temas, habilidades o publicaciones';
      let suggestions = document.getElementById('sinergia-temas-sugeridos');
      if (!suggestions) {
        suggestions = document.createElement('datalist');
        suggestions.id = 'sinergia-temas-sugeridos';
        topics.forEach((topic) => {
          const option = document.createElement('option');
          option.value = topic;
          suggestions.appendChild(option);
        });
        document.body.appendChild(suggestions);
      }
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = String(input.value || '').trim();
        if (!query) { input.focus(); return; }
        window.location.href = `${isNestedPage() ? '' : 'sinergia/'}publicaciones.html?busqueda=${encodeURIComponent(query)}#publicaciones`;
      });
    });
  }

  // initNotificationPanels
  function initNotificationPanels() {
    const notificationItems = [
      { id: 'collaboration', type: 'collaboration', icon: '👥', title: 'Solicitud de colaboración', description: 'Valeria Chaves quiere conectar contigo.', time: 'Hace 20 minutos', href: 'amigos.html#amigos-recibidas' },
      { id: 'message', type: 'message', icon: '💬', title: 'Nuevo mensaje', description: 'Tienes una conversación pendiente por revisar.', time: 'Hace 1 hora', href: 'mensajes.html' },
      { id: 'community', type: 'community', icon: '✨', title: 'Actividad de la comunidad', description: 'Hay nuevas publicaciones en tus intereses.', time: 'Hoy', href: 'publicaciones.html#publicaciones-ocio' }
    ];
    const stored = safeRead(localStorage, STORAGE.notifications, {});
    const state = stored && typeof stored === 'object' ? stored : {};
    notificationItems.forEach((item) => { if (typeof state[item.id] !== 'boolean') state[item.id] = false; });

    // persist
    function persist() { safeWrite(localStorage, STORAGE.notifications, state); }
    // updateBadges
    function updateBadges() {
      const unread = notificationItems.filter((item) => !state[item.id]).length;
      document.querySelectorAll('.boton-notificaciones .insignia').forEach((badge) => {
        badge.textContent = String(unread);
        badge.hidden = unread === 0;
      });
      document.querySelectorAll('.boton-notificaciones').forEach((button) => {
        button.setAttribute('aria-label', unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones, todas leídas');
      });
      document.querySelectorAll('.panel-notificaciones [data-notification-id]').forEach((node) => {
        const read = Boolean(state[node.dataset.notificationId]);
        node.classList.toggle('notificacion-leida', read);
        node.classList.toggle('notificacion-no-leida', !read);
      });
      document.querySelectorAll('.panel-notificaciones .notificaciones-contador').forEach((node) => {
        node.textContent = unread ? `${unread} nuevas` : 'Todo al día';
        node.classList.toggle('sin-pendientes', unread === 0);
      });
    }

    document.querySelectorAll('.boton-notificaciones').forEach((trigger) => {
      if (trigger.dataset.notificationReady === 'true') return;
      trigger.dataset.notificationReady = 'true';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      const panel = document.createElement('section');
      panel.className = 'panel-notificaciones';
      panel.hidden = true;
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Notificaciones recientes');
      const list = document.createElement('ul');
      list.className = 'lista-notificaciones';
      notificationItems.forEach((item) => {
        const li = document.createElement('li');
        li.dataset.notificationId = item.id;
        li.className = `notificacion-tarjeta notificacion-${item.type}`;
        const link = document.createElement('a');
        link.className = 'notificacion-enlace';
        link.href = item.href;
        const icon = document.createElement('span');
        icon.className = 'notificacion-icono';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = item.icon;
        const content = document.createElement('span');
        content.className = 'notificacion-contenido';
        const title = document.createElement('strong');
        title.textContent = item.title;
        const description = document.createElement('span');
        description.textContent = item.description;
        const meta = document.createElement('span');
        meta.className = 'notificacion-meta';
        const time = document.createElement('small');
        time.textContent = item.time;
        const dot = document.createElement('i');
        dot.className = 'notificacion-punto';
        dot.setAttribute('aria-label', 'Sin leer');
        meta.append(time, dot);
        content.append(title, description, meta);
        link.append(icon, content);
        li.appendChild(link);
        list.appendChild(li);
        link.addEventListener('click', () => {
          state[item.id] = true;
          persist();
          updateBadges();
        });
      });
      const header = document.createElement('div');
      header.className = 'panel-notificaciones-cabecera';
      const heading = document.createElement('div');
      heading.className = 'notificaciones-titulo';
      const eyebrow = document.createElement('span');
      eyebrow.textContent = 'CENTRO DE ACTIVIDAD';
      const title = document.createElement('strong');
      title.textContent = 'Notificaciones';
      const subtitle = document.createElement('p');
      subtitle.textContent = 'Lo que sucede en tu comunidad';
      const count = document.createElement('span');
      count.className = 'notificaciones-contador';
      heading.append(eyebrow, title, subtitle);
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'cerrar-notificaciones';
      closeButton.setAttribute('aria-label', 'Cerrar notificaciones');
      closeButton.textContent = '×';
      header.append(heading, count, closeButton);
      panel.append(header, list);
      const footer = document.createElement('div');
      footer.className = 'panel-notificaciones-pie';
      footer.textContent = 'Sinergia · Mantente al día';
      panel.appendChild(footer);
      const wrapper = document.createElement('div');
      wrapper.className = 'contenedor-notificaciones';
      trigger.parentNode.insertBefore(wrapper, trigger);
      wrapper.append(trigger, panel);
      const close = () => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const opening = panel.hidden;
        document.querySelectorAll('.panel-notificaciones').forEach((other) => { other.hidden = true; });
        panel.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
      });
      closeButton.addEventListener('click', close);
      document.addEventListener('click', (event) => { if (!wrapper.contains(event.target)) close(); });
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    });
    document.querySelectorAll('.panel-notificaciones').forEach((panel) => {
      const list = panel.querySelector('.lista-notificaciones');
      if (!list) return;
      list.querySelectorAll('[data-notification-id]').forEach((item) => {
        if (state[item.dataset.notificationId]) item.remove();
      });
      if (!list.children.length) {
        const empty = document.createElement('li');
        empty.className = 'notificaciones-vacias';
        empty.innerHTML = '<span aria-hidden="true">✓</span><strong>Estás al día</strong><small>No tienes notificaciones pendientes.</small>';
        list.appendChild(empty);
      }
    });
    updateBadges();
  }

  // initEvaluations
  function initEvaluations() {
    const form = document.querySelector('.formulario-evaluacion');
    const savedValue = safeRead(localStorage, STORAGE.evaluations, []);
    const evaluations = Array.isArray(savedValue) ? savedValue : [];
    const session = getSession() || {};
    const evaluator = String(session.email || session.name || 'demo-evaluator').trim().toLowerCase();
    const evaluatorKey = evaluator.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9@.-]+/g, '-');
    const ratedByMe = (person) => evaluations.some((item) => item && (item.evaluator === evaluatorKey || !item.evaluator) && item.person === person);
    const ownKey = String(getCurrentUserProfile()?.name || session.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // updateSummary
    function updateSummary() {
      const valid = evaluations.filter((item) => item && item.ratings && typeof item.ratings === 'object');
      const summary = document.querySelector('.resumen-reputacion');
      const averageNode = summary?.querySelector('[data-rating-average]');
      const countNode = summary?.querySelector('[data-rating-count]');
      const scoreOf = (item) => {
        const values = Object.values(item.ratings || {}).map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
      };
      const scores = valid.map(scoreOf).filter((n) => n !== null);
      const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      if (averageNode) averageNode.textContent = scores.length ? `${average.toFixed(1)} / 5 ★` : 'Sin calificaciones';
      if (countNode) countNode.textContent = String(valid.length);

      const profileSections = [...document.querySelectorAll('[data-profile-key]')];
      const sessionName = String(getCurrentUserProfile()?.name || getSession()?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const currentProfileKey = profileSections.find((section) => section.closest('.pantalla-perfil'))?.getAttribute('data-profile-key') || sessionName;
      const ownEvaluations = valid.filter((item) => item.person === currentProfileKey);
      const ownScores = ownEvaluations.map(scoreOf).filter((n) => n !== null);
      const ownAverage = ownScores.length ? ownScores.reduce((a, b) => a + b, 0) / ownScores.length : null;
      const profileAverage = document.querySelector('[data-profile-rating]');
      const profileCount = document.querySelector('[data-profile-rating-count]');
      if (profileAverage) profileAverage.textContent = ownAverage === null ? (profileAverage.dataset.baseRating || 'Sin calificaciones') : `${ownAverage.toFixed(1)} / 5 ★`;
      if (profileCount) profileCount.textContent = `${ownEvaluations.length + Number(profileCount.dataset.baseCount || 0)} evaluaciones recibidas`;

      const normalizeSkill = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const aliases = {
        'frontend': ['frontend', 'programacion', 'html y css', 'html css'],
        'ui ux': ['ui ux', 'diseno ux ui', 'diseno', 'experiencia de usuario'],
        'html y css': ['html y css', 'html css', 'frontend', 'programacion'],
        'programacion': ['programacion', 'frontend'],
        'comunicacion': ['comunicacion'],
        'trabajo en equipo': ['trabajo en equipo', 'equipo'],
        'organizacion': ['organizacion'],
        'investigacion': ['investigacion'],
        'creatividad': ['creatividad'],
        'resolucion de problemas': ['resolucion de problemas']
      };
      profileSections.forEach((section) => {
        const key = section.getAttribute('data-profile-key');
        const related = valid.filter((item) => item.person === key);
        const list = section.querySelector('[data-endorsed-skills]');
        const empty = section.querySelector('[data-endorsed-empty]');
        const declared = section.closest('.pantalla-perfil')?.querySelector('.estadisticas-declaradas');
        const totals = new Map();
        related.forEach((item) => {
          const score = scoreOf(item);
          if (score === null) return;
          (Array.isArray(item.skills) ? item.skills : []).forEach((skill) => {
            const normalized = normalizeSkill(skill);
            const current = totals.get(normalized) || { total: 0, count: 0, label: String(skill) };
            current.total += score;
            current.count += 1;
            totals.set(normalized, current);
          });
        });
        if (list) {
          list.replaceChildren();
          totals.forEach((data) => {
            const li = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = data.label;
            const score = document.createElement('strong');
            const mean = data.total / data.count;
            score.textContent = `${mean.toFixed(1)} ★ · ${data.count} reseña${data.count === 1 ? '' : 's'}`;
            score.className = mean >= 3.6 ? 'habilidad-positiva' : mean < 2.5 ? 'habilidad-negativa' : 'habilidad-neutral';
            li.append(label, score);
            list.appendChild(li);
          });
          if (empty) empty.hidden = totals.size > 0;
        }
        if (declared) {
          declared.querySelectorAll('meter').forEach((meter) => {
            const label = declared.querySelector(`label[for="${meter.id}"]`);
            if (!meter.dataset.baseValue) meter.dataset.baseValue = String(Number(meter.value) || 0);
            const base = Number(meter.dataset.baseValue);
            const labelText = label?.textContent || '';
            const declaredName = normalizeSkill(labelText.split(':')[0]);
            const matching = [...totals.entries()].filter(([skill]) => {
              const mapped = aliases[declaredName] || [declaredName];
              return mapped.some((alias) => skill === normalizeSkill(alias) || skill.includes(normalizeSkill(alias)) || normalizeSkill(alias).includes(skill));
            });
            const reviewCount = matching.reduce((sum, [, value]) => sum + value.count, 0);
            const reviewAverage = matching.length ? matching.reduce((sum, [, value]) => sum + value.total, 0) / reviewCount : null;
            const adjusted = reviewAverage === null ? base : Math.max(0, Math.min(100, Math.round(base + (reviewAverage - 3) * 8)));
            meter.value = adjusted;
            if (label) {
              const name = labelText.split(':')[0];
              label.textContent = `${name}: ${adjusted}%${reviewAverage === null ? '' : reviewAverage >= 3.6 ? ' · respaldada' : reviewAverage < 2.5 ? ' · por mejorar' : ' · en evaluación'}`;
            }
            meter.classList.toggle('meter-mejora', reviewAverage !== null && reviewAverage >= 3.6);
            meter.classList.toggle('meter-alerta', reviewAverage !== null && reviewAverage < 2.5);
            meter.title = reviewAverage === null ? 'Porcentaje declarado por el usuario; aún sin reseñas' : `Ajustado con ${reviewCount} reseña(s), promedio ${reviewAverage.toFixed(1)} de 5`;
          });
        }
        const reputation = section.closest('.pantalla-perfil')?.querySelector('[data-profile-rating]');
        const reputationCount = section.closest('.pantalla-perfil')?.querySelector('[data-profile-rating-count]');
        if (reputation) {
          const base = Number(reputation.dataset.baseRating || String(reputation.textContent).replace(',', '.').match(/[0-5](?:\.[0-9])?/)?.[0] || 0);
          const received = related.map(scoreOf).filter((n) => n !== null);
          const combined = received.length ? Math.max(1, Math.min(5, base + ((received.reduce((a, b) => a + b, 0) / received.length) - 3) * 0.35)) : base;
          reputation.textContent = `${combined.toFixed(1).replace('.', ',')} de 5 estrellas`;
          reputation.classList.toggle('reputacion-alta', received.length > 0 && combined >= base + .05);
          reputation.classList.toggle('reputacion-baja', received.length > 0 && combined <= base - .05);
        }
        if (reputationCount) reputationCount.textContent = `${Number(reputationCount.dataset.baseCount || 0) + related.length} colaboraciones evaluadas`;
      });
    }

    // Cada perfil ajeno ofrece acceso directo a su evaluación de un solo uso.
    document.querySelectorAll('[data-profile-key]').forEach((section) => {
      const personKey = section.getAttribute('data-profile-key');
      const card = section.closest('.pantalla-perfil')?.querySelector('.perfil-cabecera')
        || document.querySelector('.perfil-cabecera');
      if (!card || !personKey || personKey === ownKey || card.querySelector('[data-rate-person]')) return;
      const action = document.createElement('a');
      action.className = 'boton boton-principal boton-calificar-perfil';
      action.dataset.ratePerson = personKey;
      action.href = `evaluaciones.html?persona=${encodeURIComponent(personKey)}`;
      action.textContent = ratedByMe(personKey) ? 'Ya calificaste a esta persona' : 'Calificar a esta persona ★';
      if (ratedByMe(personKey)) {
        action.setAttribute('aria-disabled', 'true');
        action.classList.add('calificacion-realizada');
        action.href = '#';
        action.addEventListener('click', (event) => event.preventDefault());
      }
      card.appendChild(action);
    });

    if (form) {
      const status = document.createElement('p');
      status.className = 'estado';
      status.setAttribute('role', 'status');
      status.hidden = true;
      form.appendChild(status);
      const personSelect = form.elements.namedItem('companero');
      const requestedPerson = new URLSearchParams(window.location.search).get('persona');
      if (requestedPerson && personSelect) personSelect.value = requestedPerson;
      // refreshRatedOptions
      function refreshRatedOptions() {
        if (!personSelect) return;
        [...personSelect.options].forEach((option) => {
          if (!option.value) return;
          option.disabled = ratedByMe(option.value);
          if (option.disabled) option.textContent = `${option.textContent.replace(/ \(ya calificada\)$/i, '')} (ya calificada)`;
        });
      }
      refreshRatedOptions();
      if (requestedPerson && ratedByMe(requestedPerson)) {
        showStatus(status, 'Ya calificaste a esta persona desde esta cuenta. Cada persona solo puede enviar una evaluación.', 'info');
      }
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const criteria = ['dominio', 'calidad', 'responsabilidad', 'comunicacion', 'equipo'];
        const ratings = {};
        for (const key of criteria) {
          const value = Number(data.get(key));
          if (!Number.isInteger(value) || value < 1 || value > 5) {
            showStatus(status, 'Selecciona una calificación de 1 a 5 estrellas en cada criterio.', 'error');
            return;
          }
          ratings[key] = value;
        }
        const person = String(data.get('companero') || '');
        if (!person) {
          showStatus(status, 'Selecciona a la persona que deseas evaluar.', 'error');
          return;
        }
        if (person === ownKey) {
          showStatus(status, 'No puedes calificar tu propio perfil.', 'error');
          return;
        }
        if (ratedByMe(person)) {
          showStatus(status, 'Esta persona ya fue calificada por tu cuenta. La evaluación es de un solo uso.', 'error');
          refreshRatedOptions();
          return;
        }
        const skills = data.getAll('habilidades').map((value) => String(value).trim()).filter(Boolean).slice(0, 8);
        const collaboration = {
          wouldWorkAgain: String(data.get('volveria') || ''),
          contribution: String(data.get('aporte') || ''),
          communication: String(data.get('experiencia-comunicacion') || ''),
          completedTasks: String(data.get('cumplimiento') || '')
        };
        if (!collaboration.wouldWorkAgain || !collaboration.contribution || !collaboration.communication || !collaboration.completedTasks) {
          showStatus(status, 'Completa las preguntas sobre la experiencia de colaboración.', 'error');
          return;
        }
        evaluations.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          evaluator: evaluatorKey,
          person,
          ratings,
          skills,
          collaboration,
          comments: String(data.get('comentarios') || '').trim().slice(0, 1000),
          createdAt: new Date().toISOString()
        });
        if (!safeWrite(localStorage, STORAGE.evaluations, evaluations)) {
          evaluations.pop();
          showStatus(status, 'No se pudo guardar la evaluación en este navegador.', 'error');
          return;
        }
        form.reset();
        showStatus(status, 'Evaluación guardada correctamente en este navegador. Ya no podrás volver a calificar a esta persona desde esta cuenta.', 'success');
        refreshRatedOptions();
        document.querySelectorAll('[data-rate-person]').forEach((button) => {
          if (button.dataset.ratePerson !== person) return;
          button.textContent = 'Ya calificaste a esta persona';
          button.setAttribute('aria-disabled', 'true');
          button.classList.add('calificacion-realizada');
          button.href = '#';
        });
        updateSummary();
      });
    }

    updateSummary();
  }

  // initProfileEditor
  function initProfileEditor() {
    const root = document.getElementById('perfil');
    const form = root?.querySelector('#formulario-editar-perfil');
    if (!root || !form) return;

    const editor = root.querySelector('#editar-perfil');
    const openButton = root.querySelector('[data-open-profile-editor]');
    const cancelButton = root.querySelector('[data-cancel-profile-editor]');
    const status = root.querySelector('[data-profile-status]');

    // fillForm
    function fillForm(profile) {
      form.elements.namedItem('nombre_perfil').value = profile.name;
      form.elements.namedItem('titular_perfil').value = profile.headline;
      form.elements.namedItem('biografia_perfil').value = profile.bio;
      form.elements.namedItem('institucion_perfil').value = profile.institution;
      form.elements.namedItem('actividad_perfil').value = profile.activity;
      form.elements.namedItem('avatar_perfil').value = profile.avatar;
    }

    openButton?.addEventListener('click', () => {
      const showing = editor.hidden;
      fillForm(getCurrentUserProfile());
      editor.hidden = !showing;
      document.body.classList.toggle('perfil-editando', showing);
      openButton.setAttribute('aria-expanded', String(showing));
      if (showing) form.elements.namedItem('nombre_perfil')?.focus();
    });

    // closeEditor
    function closeEditor() {
      editor.hidden = true;
      document.body.classList.remove('perfil-editando');
      openButton?.setAttribute('aria-expanded', 'false');
      if (status) status.hidden = true;
      openButton?.focus();
    }

    cancelButton?.addEventListener('click', closeEditor);
    editor?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
        return;
      }
      if (event.key === 'Tab') {
        const focusable = [...editor.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const updated = {
        email: getSession()?.email || '',
        name: String(data.get('nombre_perfil') || '').trim().slice(0, 70),
        headline: String(data.get('titular_perfil') || '').trim().slice(0, 120),
        bio: String(data.get('biografia_perfil') || '').trim().slice(0, 500),
        institution: String(data.get('institucion_perfil') || '').trim().slice(0, 100),
        activity: String(data.get('actividad_perfil') || '').trim().slice(0, 100),
        avatar: String(data.get('avatar_perfil') || '').trim().slice(0, 500)
      };
      if (!updated.name || !updated.bio || !updated.headline) {
        showStatus(status, 'Completa el nombre, el titular y la biografía antes de guardar.', 'error');
        return;
      }
      if (updated.avatar && !/^https?:\/\//i.test(updated.avatar)) {
        showStatus(status, 'La fotografía debe utilizar una dirección web que comience con http:// o https://.', 'error');
        return;
      }
      if (!updated.avatar) updated.avatar = PERFIL_PREDETERMINADO.avatar;
      if (!safeWrite(localStorage, STORAGE.profile, updated)) {
        showStatus(status, 'No se pudieron guardar los cambios. Revisa el almacenamiento del navegador.', 'error');
        return;
      }
      applyProfileData(updated);
      showStatus(status, 'Tu perfil se actualizó correctamente en este navegador.', 'success');
      editor.hidden = true;
      document.body.classList.remove('perfil-editando');
      openButton?.setAttribute('aria-expanded', 'false');
    });

    applyProfileData();
    const requestedEdit = new URLSearchParams(window.location.search).get('editar') === '1';
    if (requestedEdit && editor) {
      fillForm(getCurrentUserProfile());
      editor.hidden = false;
      document.body.classList.add('perfil-editando');
      openButton?.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(() => {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        form.elements.namedItem('nombre_perfil')?.focus({ preventScroll: true });
      });
    }
  }

  // ETAPA 6 DE 6: VISTA PREVIA, FORMULARIOS GENERALES E INICIALIZACIÓN La vista previa refleja el contenido del formulario. Los formularios sin servidor muestran un aviso y no intentan enviar datos a un HTML.

  // initPublicationPreview
  function initPublicationPreview() {
    const form = document.querySelector('.formulario-publicacion');
    const preview = document.querySelector('#vista-previa-publicacion .publicacion-ejemplo');
    if (!form || !preview) return;

    const nameField = form.elements.namedItem('nombre');
    const contentField = form.elements.namedItem('contenido');
    const categoryField = form.elements.namedItem('categoria');
    const author = preview.querySelector('h3');
    const content = preview.querySelector('.publicacion-contenido');
    const category = preview.querySelector('.publicacion-categoria');
    const note = document.querySelector('.nota-vista-previa');

    // updatePreview
    function updatePreview() {
      if (author) author.textContent = nameField?.value.trim() || 'Tu nombre';
      if (content) content.textContent = contentField?.value.trim() || 'Aquí aparecerá el contenido de tu publicación.';
      if (category) category.textContent = `Categoría: ${categoryField?.value || 'Sin seleccionar'}`;
      if (note) note.textContent = 'Vista previa actualizada automáticamente. La publicación se mostrará en el apartado Publicaciones al enviarla.';
    }

    [nameField, contentField, categoryField].forEach((field) => {
      field?.addEventListener('input', updatePreview);
      field?.addEventListener('change', updatePreview);
    });
    updatePreview();
  }

  // initDemoForms
  function initDemoForms() {
    // Los formularios que ya tienen una función propia quedan excluidos.
    document.querySelectorAll('form[method="post"]:not(#formulario-registro):not(#formulario-inicio-sesion):not(#formulario-recuperacion):not(#formulario-mensaje):not(.formulario-preferencias):not(.formulario-comentario):not(.formulario-publicacion):not(.formulario-evaluacion)')
      .forEach((form) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          let notice = form.querySelector('[data-demo-form-notice]');
          if (!notice) {
            notice = crearElemento('p', 'estado');
            notice.dataset.demoFormNotice = '';
            notice.setAttribute('role', 'status');
            form.appendChild(notice);
          }
          notice.textContent = 'Acción de demostración: para guardar o enviar estos datos se necesita conectar un backend.';
        });
      });
  }

  // Punto de entrada: primero valida el acceso, después conecta las funciones.
  // init
  function init() {
    const session = getSession();
    const fileName = window.location.pathname.split('/').pop().toLowerCase();
    const publicFile = ['index.html', 'acceso.html', 'acerca-de.html', 'terminos.html', 'privacidad.html', ''].includes(fileName);
    const appPage = document.querySelector('.barra-lateral') && !publicFile;

    if (appPage && !session) {
      window.location.href = 'acceso.html#inicio-sesion';
      return;
    }
    if (fileName === 'acceso.html' && session) {
      window.location.href = 'inicio.html';
      return;
    }

    initTheme();
    updatePublicHeader(session);
    initLogout();
    initAccess();
    initSettings();
    initManualLocation();
    initNotificationPanels();
    initGlobalSearch();
    initEvaluations();
    initPlaceholderProfiles();
    initFriendRequests();
    initMessages();
    initProfileEditor();
    initProfilePosts();
    initCreatePublication();
    initPublicationPreview();
    initPublications();
    initDemoForms();
  }

  init();
})();
