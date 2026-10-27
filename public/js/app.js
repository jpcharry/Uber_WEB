/* RUTA · Interfaz web (sin compilador ni dependencias npm). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const cop = value => new Intl.NumberFormat('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(value || 0));
  const fmt = value => value ? new Date(value).toLocaleString('es-CO', {dateStyle:'medium',timeStyle:'short'}) : '—';
  const badge = value => `<span class="badge ${esc(value)}">${esc(({requested:'Solicitado',assigned:'Asignado',driver_arrived:'En punto de recogida',in_progress:'En recorrido',completed:'Completado',cancelled:'Cancelado',approved:'Aprobado',pending:'Pendiente',suspended:'Suspendido',rejected:'Rechazado',available:'Disponible',unavailable:'Desconectado',busy:'Ocupado',open:'Abierta',reviewing:'En revisión',resolved:'Resuelta'})[value] || value)}</span>`;
  const empty = message => `<div class="empty-state">${esc(message)}</div>`;
  const table = (titles, rows) => `<table class="table"><thead><tr>${titles.map(v=>`<th>${v}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${titles.length}" class="no-data">Sin registros todavía.</td></tr>`}</tbody></table>`;
  const formObject = form => Object.fromEntries(new FormData(form).entries());
  let token = sessionStorage.getItem('ruta_token') || '', user = null, map = null, markers = {}, routeLine = null, toastTimer = null;
  let poller = null, busyRefresh = false, driverTrip = null, clientActive = null;
  let driverRequests = [], sessionTrips = [], driverAvailability = 'unavailable', driverApproval = null;
  const API_BASE = '/api'; // Laravel o servidor_demo.py reenvía peticiones a 20.20.1.157:8000
  const menus = {
    client:[['⌖','Solicitar viaje','solicitar'],['◈','Mi viaje','mi-viaje'],['▤','Historial','historial']],
    driver:[['◉','Disponibilidad','mi-disponibilidad'],['▣','Servicio actual','viaje-conductor'],['↗','Solicitudes','solicitudes'],['▤','Recorridos','recorridos']],
    admin:[['▦','Resumen','admin-stats'],['♙','Conductores','gestion-conductores'],['◈','Tarifas','tarifas'],['▤','Reportes','reporte'],['↗','Viajes','viajes-admin'],['!','Incidencias','incidencias'],['▥','Auditoría','auditoria']],
  };
  const roleLabel = {client:'Pasajero',driver:'Conductor',admin:'Administrador'};
  function toast(message, bad=false) {
    const node = $('toast'); node.textContent = message; node.className = (bad ? 'visible error' : 'visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.className = '', 4200);
  }
  async function api(path, method='GET', data=null, useToken=true) {
    const headers = {'Accept':'application/json'};
    if(data !== null) headers['Content-Type'] = 'application/json';
    if(useToken && token) headers['Authorization'] = 'Bearer ' + token;
    let resp;
    try {resp = await fetch(API_BASE+path, {method, headers, body:data === null ? undefined : JSON.stringify(data), cache:'no-store'});}
    catch {throw new Error('No fue posible consultar la API del profesor. Verifica la red de la universidad.');}
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // PostgreSQL del profesor está caído: Laravel devuelve SQLSTATE[08006] y HTTP 500.
      const dbError = /SQLSTATE\[08006\]|port 5432 failed|Connection refused/i.test(payload.message || '');
      if(dbError) throw new Error('El backend del profesor funciona, pero PostgreSQL no responde (127.0.0.1:5432). Debe corregirse en su servidor.');
      const validation = payload.errors && Object.values(payload.errors).flat().join(' · ');
      if(resp.status === 401 && useToken && path !== '/auth/login') signout(false);
      throw new Error(validation || payload.message || `Error HTTP ${resp.status}`);
    }
    return payload;
  }
  function authView(view) {
    ['login','register'].forEach(v => $('auth-'+v).hidden = view !== v);
  }
  function saveLogin(json) {
    token = json.access_token; sessionStorage.setItem('ruta_token', token);
    startApp(json.user);
  }
  function signout(show=true) {
    clearInterval(poller); poller = null; token = ''; user = null; driverTrip=null; sessionTrips=[];
    sessionStorage.removeItem('ruta_token'); $('app-shell').hidden = true; $('auth-shell').hidden = false;
    authView('login'); if(show) toast('Sesión cerrada.');
  }
  function startApp(profile) {
    user = profile;
    if(user.role === 'driver') {
      try {
        const saved = JSON.parse(sessionStorage.getItem('ruta_driver_' + user.id) || '{}');
        driverTrip = saved.current || null;
        sessionTrips = saved.finished || [];
        driverAvailability = saved.availability || 'unavailable';
        driverApproval = saved.approval || null;
      } catch {driverTrip=null;sessionTrips=[];}
    }
    $('auth-shell').hidden = true; $('app-shell').hidden = false;
    const role = user.role;
    ['client','driver','admin'].forEach(r => $('panel-'+r).hidden = r !== role);
    $('top-role').textContent = roleLabel[role]; $('top-user').textContent = user.name; $('avatar').textContent = (user.name||'U')[0].toUpperCase();
    $('page-title').textContent = role === 'client' ? 'Viaja con tranquilidad.' : role === 'driver' ? 'Tu próxima ruta comienza aquí.' : 'Centro de control.';
    $('page-subtitle').textContent = role === 'client' ? 'Solicita y sigue tus viajes desde un solo lugar.' : role === 'driver' ? 'Gestiona tus servicios, tu posición y tus ingresos.' : 'Supervisa la operación de RUTA desde tu panel.';
    $('side-nav').innerHTML = (menus[role] || []).map((v,i)=>`<a href="#${v[2]}" class="${i===0?'active':''}"><span class="nav-icon">${v[0]}</span> ${v[1]}</a>`).join('');
    $('side-nav').querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      $('side-nav').querySelectorAll('a').forEach(x=>x.classList.remove('active')); a.classList.add('active');
    }));
    clearInterval(poller); refresh();
    if(role === 'client' || role === 'driver') poller = setInterval(() => document.visibilityState === 'visible' && refreshActiveOnly(), role === 'client' ? 5000 : 12000);
    if(role === 'client') setTimeout(createMap, 100);
  }
  async function refresh() {
    if(!user || busyRefresh) return;
    busyRefresh = true;
    try {
      if(user.role==='client') await refreshClient();
      if(user.role==='driver') await refreshDriver();
      if(user.role==='admin') await refreshAdmin();
    } catch(e) {toast(e.message,true);}
    finally {busyRefresh = false;}
  }
  async function refreshActiveOnly() {
    if(!user || busyRefresh) return;
    try {
      if(user.role==='client') await getClientActive();
      if(user.role==='driver') await getDriverRequests();
    } catch(e) {if(user) console.warn(e.message);}
  }

  async function refreshClient() {
    const [f, trips] = await Promise.all([api('/fares/active', 'GET', null, false).catch(()=>null), api('/client/trips')]);
    $('c-fare').textContent = f?.fare ? cop(f.fare.minimum_fare) : 'No configurada';
    const items = trips.trips?.data || [];
    $('c-count').textContent = trips.trips?.total ?? items.length;
    $('client-trips').innerHTML = table(['ID','Fecha','Conductor','Estado','Valor','Calificación'], items.map(t => `<tr><td><strong>#${t.id}</strong></td><td>${fmt(t.created_at)}</td><td>${esc(t.driver?.user?.name || '—')}</td><td>${badge(t.status)}</td><td>${cop(t.final_fare ?? t.estimated_fare)}</td><td>${t.rating ? `${t.rating.score} / 5 ★` : t.status==='completed' ? `<button class="small-btn primary" data-rate="${t.id}">Calificar</button>`:'—'}</td></tr>`));
    await getClientActive();
  }
  async function getClientActive() {
    const a = await api('/client/active'); clientActive = a;
    if(!a.has_active) {$('c-status').textContent='Sin viaje activo'; $('client-active').innerHTML=empty('No tienes un viaje activo. Crea una solicitud para comenzar.'); return;}
    const d = a.data;
    $('c-status').textContent = a.type === 'request' ? 'Buscando conductor' : badgeText(d.status);
    if(a.type === 'request') {
      $('client-active').innerHTML = `<div class="active-ride"><div><div class="heading-row">${badge('requested')} <span class="muted">SOLICITUD #${d.id}</span></div><h3>${esc(d.origin_name)} → ${esc(d.destination_name)}</h3><p>Buscando conductor disponible. La pantalla se actualiza automáticamente.</p><div class="details">${cop(d.estimated_fare)} · ${esc(d.estimated_distance_km)} km · ${esc(d.estimated_duration_min)} min</div></div><button class="small-btn danger" data-cancel="${d.id}">Cancelar solicitud</button></div>`;
    } else {
      const ride = d.ride_request || {}, person = d.driver?.user || {}, loc = d.driver?.latest_location;
      $('client-active').innerHTML = `<div class="active-ride"><div><div class="heading-row">${badge(d.status)} <span class="muted">VIAJE #${d.id}</span></div><h3>${esc(ride.origin_name)} → ${esc(ride.destination_name)}</h3><p>Conductor: <strong>${esc(person.name||'—')}</strong> · Tel. ${esc(person.phone||'—')}<br>Vehículo: ${esc(d.vehicle?.brand||'')} ${esc(d.vehicle?.model||'')} · Placa <strong>${esc(d.vehicle?.plate||'—')}</strong></p><div class="details"><span>Estimado: ${cop(d.estimated_fare)}</span><span>GPS: ${loc ? `${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)} (${fmt(loc.recorded_at)})` : 'Sin posición reportada'}</span></div></div><div>${['assigned','driver_arrived'].includes(d.status) ? `<button class="small-btn danger" data-cancel="${ride.id}">Cancelar</button>`:''}</div></div>`;
      if(map && loc) {if(markers.driver) map.removeLayer(markers.driver); markers.driver = L.marker([loc.latitude,loc.longitude]).addTo(map).bindPopup('Conductor');}
    }
  }
  function badgeText(v) {return ({assigned:'Conductor asignado',driver_arrived:'Conductor en origen',in_progress:'Viaje en curso'})[v]||v;}
  function rideForm() {
    const data = formObject($('request-form'));
    for(const p of ['origin_latitude','origin_longitude','destination_latitude','destination_longitude']) data[p] = Number(data[p]);
    return data;
  }
  function coords(data) {return {origin_latitude:data.origin_latitude,origin_longitude:data.origin_longitude,destination_latitude:data.destination_latitude,destination_longitude:data.destination_longitude};}
  async function estimate() {
    try {
      const res = await api('/client/estimate-fare','POST',coords(rideForm()));
      const e = res.estimate;
      $('fare-estimate').innerHTML = `<span>Tarifa estimada</span><strong>${cop(e.estimated_fare)}</strong><small>${e.distance_km} km · ${e.duration_min} min aproximados · No incluye ruta vial real</small>`;
    } catch(e) {toast(e.message,true);}
  }
  function createMap() {
    if(!user || user.role!=='client' || map || typeof L === 'undefined') return;
    map = L.map('map',{zoomControl:true}).setView([2.9386,-75.2819], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    map.on('click',e => {
      const target = document.querySelector('input[name="map-point"]:checked').value;
      $(target==='origin'?'origin-lat':'dest-lat').value = e.latlng.lat.toFixed(7);
      $(target==='origin'?'origin-lng':'dest-lng').value = e.latlng.lng.toFixed(7);
      updateMarkers();
    });
    updateMarkers(); setTimeout(()=>map.invalidateSize(), 250);
  }
  function updateMarkers() {
    if(!map) return;
    for(const [key,prefix] of [['origin','origin'],['destination','dest']]) {
      const lat = Number($(prefix+'-lat').value), lng = Number($(prefix+'-lng').value);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) continue;
      if(markers[key]) markers[key].setLatLng([lat,lng]); else markers[key] = L.marker([lat,lng]).addTo(map).bindPopup(key==='origin'?'Origen':'Destino');
    }
    if(routeLine) map.removeLayer(routeLine);
    if(markers.origin && markers.destination) routeLine = L.polyline([markers.origin.getLatLng(),markers.destination.getLatLng()],{color:'#1bad80',weight:4,dashArray:'9 8'}).addTo(map);
  }

  function saveDriverState() {
    if(!user || user.role!=='driver') return;
    sessionStorage.setItem('ruta_driver_' + user.id, JSON.stringify({
      current:driverTrip, finished:sessionTrips.slice(0,20), availability:driverAvailability, approval:driverApproval
    }));
  }
  function renderDriverTrip() {
    if(driverTrip && ['assigned','driver_arrived','in_progress'].includes(driverTrip.status)) {
      const t = driverTrip, r = t.ride_request || {}, passenger=t.client || {};
      $('driver-active').innerHTML = `<div class="active-ride"><div><div class="heading-row">${badge(t.status)} <span class="muted">VIAJE #${t.id}</span></div><h3>${esc(r.origin_name||'Origen no informado')} → ${esc(r.destination_name||'Destino no informado')}</h3><p>Pasajero: <strong>${esc(passenger.name||'—')}</strong> · Tel. ${esc(passenger.phone||'—')}<br>Tarifa estimada: ${cop(t.estimated_fare)}</p></div><div class="btn-row">${t.status==='assigned'?`<button class="btn btn-dark" data-transition="arrive" data-trip="${t.id}">Llegué al origen</button>`:''}${t.status==='driver_arrived'?`<button class="btn btn-dark" data-transition="start" data-trip="${t.id}">Iniciar viaje</button>`:''}${t.status==='in_progress'?`<button class="btn btn-dark" data-transition="complete" data-trip="${t.id}">Finalizar viaje</button>`:''}</div></div>`;
    } else {
      $('driver-active').innerHTML = empty('No hay un viaje activo registrado en este navegador. La API suministrada no incluye GET /driver/trips para recuperar viajes antiguos.');
    }
    $('driver-trips').innerHTML = table(['ID','Pasajero','Estado','Tarifa'],sessionTrips.map(t=>`<tr><td>#${t.id}</td><td>${esc(t.client?.name||'—')}</td><td>${badge(t.status)}</td><td>${cop(t.final_fare??t.estimated_fare)}</td></tr>`));
    $('d-count').textContent = sessionTrips.filter(t=>t.status==='completed').length;
    $('d-income').textContent = cop(sessionTrips.filter(t=>t.status==='completed').reduce((n,t)=>n+Number(t.final_fare||0),0));
  }
  async function getDriverRequests() {
    try {
      const res = await api('/driver/ride-requests');
      driverRequests = Array.isArray(res.requests) ? res.requests : (res.requests?.data || []);
      $('driver-requests').innerHTML = driverRequests.length ? driverRequests.map(x => `<div class="request-item"><div class="req-top"><span class="card-kicker">SERVICIO #${x.id}</span>${badge('requested')}</div><div class="req-route">● ${esc(x.origin_name)}<span>↓ &nbsp; Tu destino</span>● ${esc(x.destination_name)}</div><div class="muted">Pasajero: ${esc(x.client?.name||'—')} · ${esc(x.client?.phone||'—')}</div><div class="req-bottom"><strong>${cop(x.estimated_fare)}</strong><button class="btn btn-dark" data-accept="${x.id}">Aceptar ↗</button></div></div>`).join('') : empty('No hay nuevas solicitudes en este momento.');
    } catch (e) {
      if(/403|aprob|pendiente|suspend/i.test(e.message)) {
        driverApproval = 'pending'; saveDriverState();
        $('driver-requests').innerHTML = empty('La API todavía no autoriza a este conductor. Solicita aprobación a un administrador.');
      } else throw e;
    }
  }
  async function refreshDriver() {
    const me = await api('/auth/me');
    user = me.user;
    driverApproval = me.user.driver?.approval_status || driverApproval;
    driverAvailability = me.user.driver?.availability_status || driverAvailability;
    $('d-approval').textContent = driverApproval || 'Por verificar';
    $('d-status').innerHTML = badge(driverAvailability);
    renderDriverTrip();
    await getDriverRequests();
  }

  const records = value => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
  async function refreshAdmin() {
    const [dashboard, drivers, fares, trips, reports, audit] = await Promise.all([
      api('/admin/dashboard'),api('/admin/drivers'),api('/admin/fares'),api('/admin/trips'),api('/admin/reports'),api('/admin/audit-logs')
    ]);
    const s = dashboard.stats || {};
    const stat = (label,value,sub,dark=false) => `<div class="stat-tile ${dark?'dark-tile':''}"><span class="stat-label">${label}</span><strong>${value??'—'}</strong><span class="stat-extra">${sub}</span></div>`;
    $('admin-stats').innerHTML = stat('PASAJEROS',s.total_clients,'Cuentas registradas') + stat('CONDUCTORES',s.total_drivers,`${s.pending_drivers??0} esperando aprobación`) + stat('VIAJES FINALIZADOS',s.completed_trips,`${s.active_trips??0} en ejecución`) + stat('INGRESOS',cop(s.total_revenue),'Recaudo acumulado',true);
    $('admin-drivers').innerHTML = table(['Conductor','Licencia / Placa','Aprobación','Disponible','Acciones'],records(drivers.drivers).map(d=>`<tr><td><strong>${esc(d.user?.name)}</strong><br>${esc(d.user?.email)}</td><td>${esc(d.license_number)} / ${esc(d.vehicles?.[0]?.plate||'—')}</td><td>${badge(d.approval_status)}</td><td>${badge(d.availability_status)}</td><td><button class="small-btn primary" data-approve="${d.id}" data-status="approved">Aprobar</button><button class="small-btn" data-approve="${d.id}" data-status="suspended">Suspender</button><button class="small-btn danger" data-approve="${d.id}" data-status="rejected">Rechazar</button></td></tr>`));
    $('admin-fares').innerHTML = `<div class="card-kicker">TARIFAS CONFIGURADAS</div><h3 style="margin:9px 0 15px">Historial de tarifas</h3>` + (records(fares.fares).map(f=>`<div class="fare-list-item"><h4>${esc(f.name)} &nbsp; ${f.active?badge('approved'):badge('unavailable')}</h4><p>Base: ${cop(f.base_fare)} · Km: ${cop(f.price_per_km)} · Min: ${cop(f.price_per_minute)}<br>Mínima: ${cop(f.minimum_fare)} · Multiplicador: ${esc(f.surge_multiplier)}x</p></div>`).join('')||empty('Sin tarifas creadas.'));
    const rep=reports.report || reports;
    if(Array.isArray(rep.drivers)) {
      $('admin-reports').innerHTML = `<div class="report-grid"><div class="report-card"><span>INGRESOS TOTALES</span><strong>${cop(rep.total_revenue_cop??s.total_revenue)}</strong></div><div class="report-card"><span>TARIFA PROMEDIO</span><strong>${cop(rep.average_fare_cop)}</strong></div><div class="report-card"><span>CANCELACIONES</span><strong>${rep.cancelled_requests??0}</strong></div></div>`+table(['Conductor','Viajes','Ingresos','Calificación'],rep.drivers.map(d=>`<tr><td>${esc(d.name)}</td><td>${d.completed_trips??0}</td><td>${cop(d.earnings_cop)}</td><td>${Number(d.rating_average||0).toFixed(2)} ★</td></tr>`));
    } else {
      $('admin-reports').innerHTML = `<div class="muted">Respuesta del reporte proporcionada por el backend:</div><pre class="raw-report">${esc(JSON.stringify(rep,null,2))}</pre>`;
    }
    $('admin-trips').innerHTML=table(['Viaje','Pasajero','Conductor','Estado','Valor'],records(trips.trips).map(t=>`<tr><td><strong>#${t.id}</strong></td><td>${esc(t.client?.name)}</td><td>${esc(t.driver?.user?.name)}</td><td>${badge(t.status)}</td><td>${cop(t.final_fare??t.estimated_fare)}</td></tr>`));
    const incidents=records(dashboard.recent_incidents);
    $('admin-incidents').innerHTML=table(['Incidencia','Viaje','Estado','Detalle'],incidents.map(i=>`<tr><td>#${i.id}</td><td>#${i.trip_id??'—'}</td><td>${badge(i.status)}</td><td>${esc((i.description||i.comment||'Sin descripción').slice(0,140))}</td></tr>`));
    $('admin-audit').innerHTML=table(['Fecha','Acción','Tipo','ID'],records(audit.logs).map(a=>`<tr><td>${fmt(a.created_at)}</td><td><strong>${esc(a.action)}</strong></td><td>${esc(a.entity_type||'—')}</td><td>${esc(a.entity_id||'—')}</td></tr>`));
  }

  // Formularios de autenticación
  document.querySelectorAll('[data-auth-view]').forEach(el=>el.addEventListener('click',()=>authView(el.dataset.authView)));
  document.querySelectorAll('input[name="role"]').forEach(el=>el.addEventListener('change',()=>{
    const show=document.querySelector('input[name="role"]:checked').value==='driver';
    $('driver-register-fields').hidden=!show;
    $('driver-register-fields').querySelectorAll('input').forEach(x => x.required=show);
  }));
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault(); try{saveLogin(await api('/auth/login','POST',formObject(e.currentTarget),false)); toast('Bienvenido a RUTA.');}
    catch(err){toast(err.message,true);}
  });
  $('register-form').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,data=formObject(form);
    if(data.role==='driver') for(const name of ['year','capacity']) data[name]=Number(data[name]);
    try{saveLogin(await api('/auth/register','POST',data,false));toast('Cuenta creada correctamente.');}
    catch(err){toast(err.message,true);}
  });
  ['logout-btn','logout-mobile'].forEach(id=>$(id).addEventListener('click',async()=>{
    try{await api('/auth/logout','POST');}catch{}signout();
  }));
  ['refresh-btn','requests-refresh','drivers-refresh'].forEach(id=>$(id).addEventListener('click',refresh));
  $('estimate-btn').addEventListener('click',estimate);
  $('request-form').addEventListener('submit',async e=>{
    e.preventDefault();try{const res=await api('/client/ride-requests','POST',rideForm());toast(`Solicitud #${res.ride_request.id} creada.`);await refreshClient();}
    catch(err){toast(err.message,true);}
  });
  ['origin-lat','origin-lng','dest-lat','dest-lng'].forEach(id=>$(id).addEventListener('change',updateMarkers));
  $('use-gps').addEventListener('click',()=>{
    if(!navigator.geolocation){toast('El navegador no soporta GPS.',true);return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      $('origin-lat').value=pos.coords.latitude.toFixed(7);$('origin-lng').value=pos.coords.longitude.toFixed(7);
      updateMarkers(); if(map)map.setView([pos.coords.latitude,pos.coords.longitude],15);toast('Origen actualizado con tu ubicación.');
    },()=>toast('No se pudo obtener la ubicación. Revisa el permiso del navegador.',true),{enableHighAccuracy:true,timeout:10000});
  });
  $('go-online').addEventListener('click',()=>availability('available'));
  $('go-offline').addEventListener('click',()=>availability('unavailable'));
  async function availability(status){try{
    const res = await api('/driver/availability','PUT',{status});
    driverAvailability = res.availability_status || status;
    if(status==='available') driverApproval='approved';
    saveDriverState();toast('Disponibilidad actualizada.');await refreshDriver();
  }catch(e){if(/aprobad|pendiente|403/i.test(e.message))driverApproval='pending';saveDriverState();toast(e.message,true);}}
  $('send-gps').addEventListener('click',()=>{
    if(!navigator.geolocation){toast('GPS no disponible.',true);return;}
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{const obj={latitude:pos.coords.latitude,longitude:pos.coords.longitude,heading:Number.isFinite(pos.coords.heading)?pos.coords.heading:null,speed:pos.coords.speed===null?null:Math.max(0,pos.coords.speed*3.6)};
        if(driverTrip)obj.trip_id=driverTrip.id;
        await api('/driver/location','POST',obj);toast('Posición GPS publicada correctamente.');
      }catch(e){toast(e.message,true);}
    },()=>toast('No se pudo acceder al GPS. En producción requiere HTTPS.',true),{enableHighAccuracy:true,timeout:12000});
  });
  $('fare-form').addEventListener('submit',async e=>{
    e.preventDefault();const data=formObject(e.currentTarget);for(const k of ['base_fare','price_per_km','price_per_minute','minimum_fare','surge_multiplier'])data[k]=Number(data[k]);data.active=data.active==='true';
    try{await api('/admin/fares','POST',data);toast('Tarifa guardada.');await refreshAdmin();}
    catch(err){toast(err.message,true);}
  });
  // Acciones de las tablas y tarjetas; delegación de eventos.
  document.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-cancel],[data-rate],[data-accept],[data-transition],[data-approve]');
    if(!btn||!user)return;
    if(btn.dataset.cancel){
      if(!confirm('¿Seguro que deseas cancelar la solicitud?'))return;
      const reason=prompt('Motivo de cancelación (opcional):')||'';
      try{await api('/client/cancel/'+btn.dataset.cancel,'POST',{reason});toast('Solicitud cancelada.');await refreshClient();}catch(err){toast(err.message,true);}
    }else if(btn.dataset.rate){
      const score=prompt('Calificación del conductor (1 a 5 estrellas):','5');if(score===null)return;
      if(!/^[1-5]$/.test(score)){toast('Selecciona de 1 a 5.',true);return;}
      const comment=prompt('Comentario del viaje (opcional):','')||'';
      const hasIncident=confirm('¿Deseas reportar una incidencia relacionada con el viaje?');
      try{await api(`/client/trips/${btn.dataset.rate}/rating`,'POST',{score:Number(score),comment,has_incident:hasIncident});toast('Gracias por tu calificación.');await refreshClient();}catch(err){toast(err.message,true);}
    }else if(btn.dataset.accept){
      try{
        const request = driverRequests.find(x=>String(x.id)===String(btn.dataset.accept)) || {};
        const res = await api(`/driver/ride-requests/${btn.dataset.accept}/accept`,'POST');
        driverTrip = {...res.trip,ride_request:request,client:request.client||{}};
        saveDriverState();toast('Servicio asignado a tu cuenta.');await refreshDriver();
      }catch(err){toast(err.message,true);}
    }else if(btn.dataset.transition){
      const action=btn.dataset.transition, id=btn.dataset.trip;let data=null;
      if(action==='complete'){
        const distance=prompt('Distancia realmente recorrida en km (ej. 2.5):',String(driverTrip?.ride_request?.estimated_distance_km||'2'));
        if(distance===null)return;
        const minutes=prompt('Duración real en minutos (ej. 8):',String(driverTrip?.ride_request?.estimated_duration_min||'8'));
        if(minutes===null)return;
        data={actual_distance_km:Number(distance),actual_duration_min:Number(minutes)};
      }
      try{
        const res = await api(`/driver/trips/${id}/${action}`,'POST',data);
        driverTrip={...driverTrip,...res.trip,ride_request:driverTrip?.ride_request||{},client:driverTrip?.client||{}};
        if(action==='complete'){sessionTrips.unshift(driverTrip);driverTrip=null;}
        saveDriverState();toast('Estado del viaje actualizado.');await refreshDriver();
      }catch(err){toast(err.message,true);}
    }else if(btn.dataset.approve){
      const state=btn.dataset.status;
      const notes=prompt(`Notas administrativas para ${state} al conductor (opcional):`,'');if(notes===null)return;
      try{await api(`/admin/drivers/${btn.dataset.approve}/approval`,'PATCH',{approval_status:state,admin_notes:notes});toast('Estado del conductor modificado.');await refreshAdmin();}catch(err){toast(err.message,true);}
    }
  });
  // Comprobación de conectividad: este fallo actualmente ocurre en el servidor del profesor.
  async function checkBackend() {
    const banner = $('api-status');
    try {
      await api('/fares/active','GET',null,false);
      banner.hidden=true;
    } catch(e) {
      banner.textContent = 'Conexión a API: ' + e.message;
      banner.hidden=false;
    }
  }
  checkBackend();
  if(token) api('/auth/me').then(res=>startApp(res.user)).catch(()=>signout(false));
})();
