<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101827">
  <title>RUTA · Plataforma de movilidad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzT6fZmGOHlDE0w+q3q9S+qXlHw==" crossorigin="">
  <link rel="stylesheet" href="css/app.css">
</head>
<body>
  <div id="toast" role="status" aria-live="polite"></div>
  <div id="api-status" role="status" aria-live="polite" hidden></div>
  <div id="auth-shell" class="auth-layout">
    <div class="auth-feature">
      <div class="brand brand-light"><span class="brand-icon">↗</span><span>RUTA<span class="brand-dot">.</span></span></div>
      <div class="auth-feature-content">
        <span class="eyebrow light">CONECTADO A LA API DEL PROFESOR</span>
        <h1>Tu ciudad.<br>Tu camino.<br><em>Tu ritmo.</em></h1>
        <p>Una plataforma para conectar pasajeros y conductores con seguridad, transparencia y control.</p>
        <div class="auth-stats"><div><strong>03</strong><span>Roles conectados</span></div><div><strong>24/7</strong><span>Gestión de viajes</span></div></div>
      </div>
      <div class="feature-orbit orbit-one"></div><div class="feature-orbit orbit-two"></div>
      <div class="auth-feature-foot">RUTA / PROYECTO ACADÉMICO · CONSUMO API REST</div>
    </div>
    <div class="auth-card-wrap">
      <div class="auth-card">
        <div class="auth-mobile-brand brand"><span class="brand-icon">↗</span> RUTA.</div>
        <div id="auth-login">
          <div class="eyebrow">BIENVENIDO DE NUEVO</div>
          <h2>Iniciar sesión</h2>
          <p class="muted intro">Ingresa a tu espacio de movilidad.</p>
          <form id="login-form" class="stack">
            <label>Correo o teléfono<input name="login" type="text" autocomplete="username" required placeholder="tu@correo.com"></label>
            <label>Contraseña<input name="password" type="password" autocomplete="current-password" required placeholder="••••••••"></label>
            <button class="btn btn-dark btn-wide" type="submit">Entrar a RUTA <span>↗</span></button>
          </form>
          <div class="auth-links"><span class="muted">Para recuperar el acceso, contacta al administrador.</span><span>¿No tienes cuenta? <button class="link-btn strong" data-auth-view="register">Regístrate</button></span></div>
        </div>
        <div id="auth-register" hidden>
          <span class="eyebrow">NUEVA CUENTA</span><h2>Crear cuenta</h2>
          <p class="muted intro">Regístrate como pasajero o conductor.</p>
          <form id="register-form" class="stack">
            <div class="segmented"><label><input type="radio" name="role" value="client" checked><span>Pasajero</span></label><label><input type="radio" name="role" value="driver"><span>Conductor</span></label></div>
            <label>Nombre completo<input name="name" required maxlength="150" placeholder="Tu nombre"></label>
            <div class="two-cols"><label>Correo electrónico<input name="email" type="email" required placeholder="correo@ejemplo.com"></label><label>Teléfono<input name="phone" required placeholder="3101234567"></label></div>
            <label>Contraseña (mín. 8 caracteres)<input name="password" type="password" required minlength="8"></label>
            <div id="driver-register-fields" class="stack inset" hidden>
              <div class="small-section-title">Datos del conductor y vehículo</div>
              <label>Número de licencia<input name="license_number"></label>
              <div class="two-cols"><label>Placa<input name="plate"></label><label>Marca<input name="brand"></label></div>
              <div class="two-cols"><label>Modelo<input name="model"></label><label>Año<input name="year" type="number" min="1990" max="2100"></label></div>
              <div class="two-cols"><label>Capacidad<input name="capacity" type="number" min="1" max="12" value="4"></label><label>Color<input name="color"></label></div>
              <small>Los conductores deben ser aprobados por un administrador antes de operar.</small>
            </div>
            <button class="btn btn-dark btn-wide">Crear cuenta <span>↗</span></button>
          </form>
          <p class="foot-link">¿Ya tienes cuenta? <button class="link-btn strong" data-auth-view="login">Inicia sesión</button></p>
        </div>
      </div>
      <div class="auth-bottom">Proyecto académico · Plataforma RUTA · API REST + JWT</div>
    </div>
  </div>

  <div id="app-shell" hidden>
    <aside class="sidebar">
      <div class="brand"><span class="brand-icon">↗</span><span>RUTA<span class="brand-dot">.</span></span></div>
      <div class="side-caption">PLATAFORMA</div>
      <nav id="side-nav" class="side-nav"></nav>
      <div class="side-bottom"><div class="secure-pill"><i></i> Sesión autenticada</div><button id="logout-btn" class="logout">↪ &nbsp; Cerrar sesión</button></div>
    </aside>
    <div class="app-content">
      <header class="topbar"><div class="topbar-mobile-brand brand"><span class="brand-icon">↗</span>RUTA.</div><div class="breadcrumbs">Plataforma / <span id="top-role">Panel</span></div><div class="topbar-right"><span class="live-badge"><span class="pulse"></span> OPERATIVO</span><span id="top-user" class="top-user">Usuario</span><span id="avatar" class="avatar">R</span><button class="mobile-logout" id="logout-mobile" title="Salir">↪</button></div></header>
      <main>
        <div class="page-top"><div><div class="eyebrow">CENTRO DE OPERACIONES</div><h1 id="page-title">Tu panel</h1><p id="page-subtitle" class="muted"></p></div><button class="btn btn-outline" id="refresh-btn">↻ &nbsp; Actualizar</button></div>

        <div id="panel-client" hidden>
          <div class="mini-stats"><div class="stat-tile"><span class="stat-label">ESTADO ACTUAL</span><strong id="c-status">Consultando…</strong><span class="stat-extra">Mi servicio en curso</span></div><div class="stat-tile"><span class="stat-label">VIAJES REALIZADOS</span><strong id="c-count">—</strong><span class="stat-extra">Historial personal</span></div><div class="stat-tile dark-tile"><span class="stat-label">TARIFA ESTÁNDAR</span><strong id="c-fare">—</strong><span class="stat-extra">Pesos colombianos</span></div></div>
          <div class="section-heading" id="solicitar"><div><h2>Solicitar un viaje</h2><p>Selecciona tu punto de origen y destino en el mapa.</p></div><span class="step-pill">01 / CREAR SOLICITUD</span></div>
          <div class="client-grid">
            <div class="card map-card"><div class="map-toolbar"><span><span class="map-dot"></span> MAPA DE LA CIUDAD</span><div class="map-switch"><label><input type="radio" name="map-point" value="origin" checked> <span>Origen</span></label><label><input type="radio" name="map-point" value="destination"> <span>Destino</span></label></div></div><div id="map"></div><p class="map-hint">Haz clic en el mapa para marcar el punto seleccionado. Si no carga, introduce las coordenadas manualmente.</p></div>
            <div class="card request-card"><div class="card-kicker">TU RUTA</div><h3>¿A dónde vamos?</h3><form id="request-form" class="stack"><label><span class="location-label green">● &nbsp; Punto de partida</span><input id="origin-name" name="origin_name" required value="Centro de Neiva" maxlength="255"></label><div class="two-cols"><label class="small-label">Latitud<input id="origin-lat" name="origin_latitude" type="number" step="any" required value="2.9386"></label><label class="small-label">Longitud<input id="origin-lng" name="origin_longitude" type="number" step="any" required value="-75.2819"></label></div><div class="route-divider"></div><label><span class="location-label orange">● &nbsp; Tu destino</span><input id="dest-name" name="destination_name" required value="Terminal de transportes de Neiva" maxlength="255"></label><div class="two-cols"><label class="small-label">Latitud<input id="dest-lat" name="destination_latitude" type="number" step="any" required value="2.9245"></label><label class="small-label">Longitud<input id="dest-lng" name="destination_longitude" type="number" step="any" required value="-75.2930"></label></div><button type="button" id="use-gps" class="btn btn-subtle">◎ &nbsp; Usar mi ubicación actual como origen</button><div id="fare-estimate" class="price-preview"><span>Tarifa estimada</span><strong>—</strong><small>Precio final según distancia y tiempo reales</small></div><button type="button" id="estimate-btn" class="btn btn-outline btn-wide">Calcular tarifa</button><button type="submit" class="btn btn-dark btn-wide">Solicitar conductor &nbsp; ↗</button></form></div>
          </div>
          <div class="section-heading" id="mi-viaje"><div><h2>Mi viaje actual</h2><p>Actualización automática cada 5 segundos mientras haya conexión.</p></div><span class="step-pill">02 / SEGUIMIENTO</span></div><div id="client-active" class="card content-pad empty-state">Consultando viajes...</div>
          <div class="section-heading" id="historial"><div><h2>Historial de viajes</h2><p>Consulta tus recorridos y califica el servicio.</p></div></div><div id="client-trips" class="card table-wrap"></div>
        </div>

        <div id="panel-driver" hidden>
          <div class="mini-stats"><div class="stat-tile"><span class="stat-label">ESTADO DE APROBACIÓN</span><strong id="d-approval">—</strong><span class="stat-extra">Verificación del administrador</span></div><div class="stat-tile"><span class="stat-label">VIAJES (SESIÓN)</span><strong id="d-count">—</strong><span class="stat-extra">Solo este navegador · sesión actual</span></div><div class="stat-tile dark-tile"><span class="stat-label">INGRESOS (SESIÓN)</span><strong id="d-income">—</strong><span class="stat-extra">Solo viajes terminados desde este navegador</span></div></div>
          <div class="section-heading" id="mi-disponibilidad"><div><h2>Disponibilidad</h2><p>Activa tu estado para recibir solicitudes.</p></div></div><div class="card content-pad driver-status-row"><div><div class="status-big"><span class="pulse"></span><strong id="d-status">Consultando…</strong></div><p class="muted">Debes estar aprobado para conectarte.</p></div><div class="btn-row"><button class="btn btn-dark" id="go-online">Ponerme disponible</button><button class="btn btn-outline" id="go-offline">Desconectarme</button><button class="btn btn-subtle" id="send-gps">◎ Actualizar GPS</button></div></div>
          <div class="section-heading" id="viaje-conductor"><div><h2>Mi servicio actual</h2><p>Registra cada etapa del recorrido.</p></div></div><div id="driver-active" class="card content-pad empty-state">Consultando...</div>
          <div class="section-heading" id="solicitudes"><div><h2>Solicitudes abiertas</h2><p>Acepta un servicio disponible antes que otro conductor.</p></div><button class="btn btn-outline" id="requests-refresh">↻ Actualizar</button></div><div id="driver-requests" class="request-list"></div>
          <div class="section-heading" id="recorridos"><div><h2>Mis recorridos</h2><p>Historial local de esta sesión. El backend no documenta consulta de viajes del conductor.</p></div></div><div id="driver-trips" class="card table-wrap"></div>
        </div>

        <div id="panel-admin" hidden>
          <div id="admin-stats" class="mini-stats four"></div>
          <div class="section-heading" id="gestion-conductores"><div><h2>Conductores registrados</h2><p>Aprueba, suspende o rechaza cuentas.</p></div><button class="btn btn-outline" id="drivers-refresh">↻ Actualizar</button></div><div id="admin-drivers" class="card table-wrap"></div>
          <div class="section-heading" id="tarifas"><div><h2>Gestión de tarifas</h2><p>La tarifa activa se aplica a las nuevas solicitudes.</p></div></div><div class="admin-grid"><div class="card content-pad"><div class="card-kicker">NUEVA CONFIGURACIÓN</div><h3>Crear tarifa</h3><form id="fare-form" class="stack"><label>Nombre<input name="name" value="Tarifa Especial" required></label><div class="two-cols"><label>Tarifa base<input name="base_fare" type="number" min="0" value="3800" required></label><label>Por kilómetro<input name="price_per_km" type="number" min="0" value="1250" required></label></div><div class="two-cols"><label>Por minuto<input name="price_per_minute" type="number" min="0" value="250" required></label><label>Mínima<input name="minimum_fare" type="number" min="0" value="6500" required></label></div><div class="two-cols"><label>Multiplicador<input name="surge_multiplier" type="number" step="0.1" min="0.1" max="10" value="1.0" required></label><label>Activar ahora<select name="active"><option value="true">Sí</option><option value="false">No</option></select></label></div><button class="btn btn-dark btn-wide">Guardar tarifa ↗</button></form></div><div id="admin-fares" class="card content-pad"></div></div>
          <div class="section-heading" id="reporte"><div><h2>Reporte operativo</h2><p>Recaudo total y desempeño de conductores.</p></div></div><div id="admin-reports" class="card content-pad"></div>
          <div class="section-heading" id="viajes-admin"><div><h2>Viajes recientes</h2><p>Monitoreo centralizado de operaciones.</p></div></div><div id="admin-trips" class="card table-wrap"></div>
          <div class="section-heading" id="incidencias"><div><h2>Incidencias</h2><p>Incidencias recientes del dashboard. La API no documenta gestión individual.</p></div></div><div id="admin-incidents" class="card table-wrap"></div>
          <div class="section-heading" id="auditoria"><div><h2>Auditoría</h2><p>Últimas acciones de seguridad y administración.</p></div></div><div id="admin-audit" class="card table-wrap"></div>
        </div>
        <footer class="app-footer"><span>© 2026 RUTA · Proyecto demostrativo</span><span>Frontend Laravel 12 · API del profesor · JWT</span></footer>
      </main>
    </div>
  </div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script src="js/app.js" defer></script>
</body>
</html>
