import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel, IonInput, IonTextarea, IonSelect,
  IonSelectOption, IonChip
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiError } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  User, Role, Fare, FareEstimate, RideRequest, RideStatus, Trip, Driver,
  DashboardStats, Coordinates, RideCoordinates, Collection, PageResponse,
  rows, money, dateTime, statusLabel
} from '../../core/models';
import { MapPickerComponent } from '../../shared/map-picker.component';

interface ActiveRide { success: boolean; has_active: boolean; type?: 'request' | 'trip'; data?: RideRequest | Trip }
interface DriverRequestResponse { success: boolean; requests: Collection<RideRequest> }
interface TripsResponse { success: boolean; trips: PageResponse<Trip> }
interface DriverTripResponse { success: boolean; trip: Trip; message?: string }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonChip, MapPickerComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit, OnDestroy {
  readonly money = money;
  readonly dateTime = dateTime;
  readonly statusLabel = statusLabel;
  user: User | null = null;
  role: Role = 'client';
  section = 'solicitar';
  busy = false;
  loading = false;
  error = '';
  notice = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly nav = {
    client: [
      { id: 'solicitar', title: 'Solicitar viaje', icon: 'navigate-outline' },
      { id: 'activo', title: 'Mi viaje', icon: 'location-outline' },
      { id: 'historial', title: 'Historial', icon: 'receipt-outline' }
    ],
    driver: [
      { id: 'disponibilidad', title: 'Disponibilidad', icon: 'car-sport-outline' },
      { id: 'solicitudes', title: 'Solicitudes', icon: 'list-outline' },
      { id: 'viaje', title: 'Servicio actual', icon: 'navigate-outline' },
      { id: 'ubicacion', title: 'Mi ubicación', icon: 'pin-outline' },
      { id: 'resumen', title: 'Mis recorridos', icon: 'cash-outline' }
    ],
    admin: [
      { id: 'resumen', title: 'Panel', icon: 'analytics-outline' },
      { id: 'conductores', title: 'Conductores', icon: 'people-outline' },
      { id: 'tarifas', title: 'Tarifas', icon: 'cash-outline' },
      { id: 'viajes', title: 'Viajes', icon: 'car-sport-outline' },
      { id: 'reportes', title: 'Reportes', icon: 'document-text-outline' },
      { id: 'auditoria', title: 'Auditoría', icon: 'shield-checkmark-outline' }
    ]
  };

  // Cliente
  activeFare: Fare | null = null;
  estimate: FareEstimate | null = null;
  origin: Coordinates = { latitude: 2.9386, longitude: -75.2819 };
  destination: Coordinates = { latitude: 2.944, longitude: -75.29 };
  originName = 'Centro de Neiva';
  destinationName = 'Destino en Neiva';
  clientActive: ActiveRide | null = null;
  clientTrips: Trip[] = [];
  clientTripsPage = 1;
  clientTripsLastPage = 1;
  cancelReason = 'Cambio de planes';
  ratingTripId: number | null = null;
  ratingScore = 5;
  ratingComment = '';
  ratingIncident = false;

  // Conductor; solo los viajes recogidos en esta sesión pueden reconstruirse localmente.
  driverRequests: RideRequest[] = [];
  availability = 'unavailable';
  approvalStatus = 'No informado';
  driverTrip: Trip | null = null;
  completedLocalTrips: Trip[] = [];
  actualKm = 0;
  actualMin = 0;
  gpsInfo = '';

  // Administrador
  adminStats: DashboardStats = {};
  adminDrivers: Driver[] = [];
  adminFares: Fare[] = [];
  adminTrips: Trip[] = [];
  adminTripStatus = '';
  adminReports: unknown = null;
  adminAudit: Record<string, unknown>[] = [];
  adminIncidents: Record<string, unknown>[] = [];
  fareForm = { name: 'Tarifa urbana', base_fare: 3800, price_per_km: 1250,
    price_per_minute: 250, minimum_fare: 6500, surge_multiplier: 1, active: true };

  constructor(readonly auth: AuthService, private readonly api: ApiService) {}

  async ngOnInit(): Promise<void> {
    this.user = this.auth.user();
    if (this.user) this.setRole(this.user);
    this.restoreDriverState();
    try {
      const profile = await firstValueFrom(this.auth.profile());
      this.user = profile.user;
      this.setRole(profile.user);
    } catch (err) { this.error = apiError(err); }
    await this.refresh();
    this.refreshTimer = setInterval(() => {
      if (!document.hidden && !this.busy && this.role === 'client') void this.pollActive();
      if (!document.hidden && !this.busy && this.role === 'driver') void this.pollRequests();
    }, 12000);
  }
  ngOnDestroy(): void { if (this.refreshTimer) clearInterval(this.refreshTimer); }
  private setRole(user: User): void {
    if (user.role !== this.role) {
      this.role = user.role;
      this.section = this.nav[user.role][0].id;
    }
    if (user.driver?.approval_status) this.approvalStatus = user.driver.approval_status;
    if (user.driver?.availability_status) this.availability = user.driver.availability_status;
  }
  roleName(): string { return ({client: 'Pasajero', driver: 'Conductor', admin: 'Administrador'})[this.role]; }
  sectionName(): string { return this.nav[this.role].find(n => n.id === this.section)?.title || 'RUTA'; }
  navigate(section: string): void {
    this.section = section;
    this.error = ''; this.notice = '';
    if (section === 'historial') void this.loadClientTrips();
    if (section === 'activo') void this.pollActive();
    if (section === 'solicitudes') void this.pollRequests();
    if (section === 'conductores') void this.loadDrivers();
    if (section === 'tarifas') void this.loadFares();
    if (section === 'viajes') void this.loadAdminTrips();
  }
  onSectionChange(event: CustomEvent): void {
    const section = event.detail.value;
    if (typeof section === 'string') this.navigate(section);
  }
  logout(): void { this.auth.logout(); }
  dismissMessage(): void { this.notice = ''; this.error = ''; }

  async refresh(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      if (this.role === 'client') {
        await Promise.all([this.loadFare(), this.pollActive(), this.loadClientTrips()]);
      } else if (this.role === 'driver') {
        await this.pollRequests();
      } else {
        await Promise.all([this.loadAdminDashboard(), this.loadDrivers(), this.loadFares(), this.loadAdminTrips(), this.loadReports(), this.loadAudit()]);
      }
    } finally { this.loading = false; }
  }
  private async withAction(callback: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.notice = '';
    try { await callback(); }
    catch (error) { this.error = apiError(error); }
    finally { this.busy = false; }
  }
  private async query<T>(url: string): Promise<T> { return firstValueFrom(this.api.get<T>(url)); }

  // ============= CLIENTE =============
  private async loadFare(): Promise<void> {
    try { const res = await this.query<{ fare: Fare }>('/fares/active'); this.activeFare = res.fare; }
    catch (error) { this.error = apiError(error); }
  }
  rideCoords(): RideCoordinates {
    return { origin_latitude: +this.origin.latitude, origin_longitude: +this.origin.longitude,
      destination_latitude: +this.destination.latitude, destination_longitude: +this.destination.longitude };
  }
  onCoordsChanged(): void {
    this.origin = { ...this.origin, latitude: Number(this.origin.latitude), longitude: Number(this.origin.longitude) };
    this.destination = { ...this.destination, latitude: Number(this.destination.latitude), longitude: Number(this.destination.longitude) };
    this.estimate = null;
  }
  pointPicked(event: { point: 'origin' | 'destination'; coords: Coordinates }): void {
    if (event.point === 'origin') this.origin = event.coords;
    else this.destination = event.coords;
    this.estimate = null;
  }
  validateCoords(): boolean {
    const c = this.rideCoords();
    return Number.isFinite(c.origin_latitude) && Number.isFinite(c.origin_longitude) &&
      Number.isFinite(c.destination_latitude) && Number.isFinite(c.destination_longitude) &&
      Math.abs(c.origin_latitude) <= 90 && Math.abs(c.destination_latitude) <= 90 &&
      Math.abs(c.origin_longitude) <= 180 && Math.abs(c.destination_longitude) <= 180;
  }
  estimateFare(): void {
    if (!this.validateCoords()) { this.error = 'Las coordenadas deben ser válidas (latitud ±90, longitud ±180).'; return; }
    void this.withAction(async () => {
      const res = await firstValueFrom(this.api.post<{ estimate: FareEstimate }>('/client/estimate-fare', this.rideCoords()));
      this.estimate = res.estimate;
      this.notice = 'Tarifa estimada por la API.';
    });
  }
  requestRide(): void {
    if (!this.originName.trim() || !this.destinationName.trim() || !this.validateCoords()) {
      this.error = 'Indica origen, destino y coordenadas válidas.'; return;
    }
    void this.withAction(async () => {
      await firstValueFrom(this.api.post('/client/ride-requests', {
        origin_name: this.originName.trim(), destination_name: this.destinationName.trim(), ...this.rideCoords()
      }));
      this.notice = 'Solicitud enviada. Buscando un conductor disponible.';
      this.section = 'activo';
      await this.pollActive();
    });
  }
  async pollActive(): Promise<void> {
    try { this.clientActive = await this.query<ActiveRide>('/client/active'); }
    catch (error) { this.error = apiError(error); }
  }
  get activeRequest(): RideRequest | null {
    return this.clientActive?.has_active && this.clientActive.type === 'request' ? this.clientActive.data as RideRequest : null;
  }
  get activeTrip(): Trip | null {
    return this.clientActive?.has_active && this.clientActive.type === 'trip' ? this.clientActive.data as Trip : null;
  }
  cancelRide(): void {
    const id = this.activeRequest?.id ?? this.activeTrip?.id;
    if (!id || this.activeTrip?.status === 'in_progress') { this.error = 'No se puede cancelar un viaje en progreso.'; return; }
    void this.withAction(async () => {
      await firstValueFrom(this.api.post(`/client/cancel/${id}`, { reason: this.cancelReason || 'Cancelación solicitada' }));
      this.notice = 'Solicitud cancelada.';
      await this.pollActive();
    });
  }
  async loadClientTrips(): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.get<TripsResponse>('/client/trips', { page: this.clientTripsPage }));
      this.clientTrips = rows(result.trips);
      this.clientTripsLastPage = result.trips.last_page ?? 1;
    } catch (error) { this.error = apiError(error); }
  }
  changePage(delta: number): void {
    this.clientTripsPage = Math.max(1, Math.min(this.clientTripsLastPage, this.clientTripsPage + delta));
    void this.loadClientTrips();
  }
  rateTrip(id: number): void {
    void this.withAction(async () => {
      await firstValueFrom(this.api.post(`/client/trips/${id}/rating`, {
        score: Number(this.ratingScore), comment: this.ratingComment.trim(), has_incident: this.ratingIncident
      }));
      this.ratingTripId = null;
      this.ratingComment = '';
      this.ratingIncident = false;
      this.notice = 'Tu calificación fue registrada.';
      await this.loadClientTrips();
    });
  }

  // ============= CONDUCTOR =============
  private restoreDriverState(): void {
    try {
      const state = JSON.parse(sessionStorage.getItem('ruta_driver_trip') || 'null') as { current: Trip | null; finished: Trip[] } | null;
      this.driverTrip = state?.current ?? null;
      this.completedLocalTrips = state?.finished ?? [];
    } catch { this.driverTrip = null; this.completedLocalTrips = []; }
  }
  private saveDriverState(): void {
    sessionStorage.setItem('ruta_driver_trip', JSON.stringify({ current: this.driverTrip, finished: this.completedLocalTrips.slice(0, 50) }));
  }
  async pollRequests(): Promise<void> {
    try {
      const res = await this.query<DriverRequestResponse>('/driver/ride-requests');
      this.driverRequests = rows(res.requests);
    } catch (error) { this.error = apiError(error); }
  }
  setAvailability(status: 'available' | 'unavailable'): void {
    void this.withAction(async () => {
      const res = await firstValueFrom(this.api.put<{ availability_status: string }>('/driver/availability', { status }));
      this.availability = res.availability_status;
      this.notice = `Disponibilidad actualizada: ${statusLabel(this.availability)}.`;
    });
  }
  acceptRide(ride: RideRequest): void {
    if (this.driverTrip && this.driverTrip.status !== 'completed') {
      this.error = 'Ya tienes un viaje activo en esta sesión.'; return;
    }
    void this.withAction(async () => {
      const result = await firstValueFrom(this.api.post<DriverTripResponse>(`/driver/ride-requests/${ride.id}/accept`, {}));
      this.driverTrip = { ...result.trip, ride_request: ride, client: ride.client };
      this.actualKm = Number(ride.estimated_distance_km || 0);
      this.actualMin = Number(ride.estimated_duration_min || 0);
      this.saveDriverState();
      this.section = 'viaje';
      this.notice = 'Servicio aceptado exitosamente.';
    });
  }
  advanceTrip(action: 'arrive' | 'start' | 'complete'): void {
    if (!this.driverTrip) return;
    const id = this.driverTrip.id;
    if (action === 'complete' && (!(this.actualKm > 0) || !(this.actualMin > 0))) {
      this.error = 'La distancia y duración reales deben ser mayores que cero.'; return;
    }
    void this.withAction(async () => {
      const body = action === 'complete' ? { actual_distance_km: +this.actualKm, actual_duration_min: +this.actualMin } : {};
      const result = await firstValueFrom(this.api.post<DriverTripResponse>(`/driver/trips/${id}/${action}`, body));
      this.driverTrip = { ...this.driverTrip!, ...result.trip };
      if (action === 'complete') {
        this.completedLocalTrips.unshift(this.driverTrip);
        this.driverTrip = null;
        this.section = 'resumen';
      }
      this.saveDriverState();
      this.notice = result.message || 'Estado del viaje actualizado.';
    });
  }
  sendLocation(): void {
    if (!navigator.geolocation) { this.error = 'Este navegador no ofrece geolocalización.'; return; }
    this.busy = true; this.error = ''; this.notice = '';
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude, heading, speed } = position.coords;
      const body: Record<string, number> = { latitude, longitude, heading: heading ?? 0, speed: speed == null ? 0 : speed * 3.6 };
      if (this.driverTrip) body['trip_id'] = this.driverTrip.id;
      firstValueFrom(this.api.post('/driver/location', body)).then(() => {
        this.gpsInfo = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        this.notice = 'Ubicación compartida con el backend.';
      }).catch(error => this.error = apiError(error)).finally(() => this.busy = false);
    }, err => { this.busy = false; this.error = `No se pudo obtener el GPS: ${err.message}`; },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  }
  get earningsLocal(): number {
    return this.completedLocalTrips.reduce((sum, trip) => sum + Number(trip.final_fare || 0), 0);
  }

  // ============= ADMINISTRADOR =============
  async loadAdminDashboard(): Promise<void> {
    try {
      const res = await this.query<{ stats: DashboardStats; recent_incidents?: Collection<Record<string, unknown>> }>('/admin/dashboard');
      this.adminStats = res.stats;
      this.adminIncidents = rows(res.recent_incidents);
    } catch (error) { this.error = apiError(error); }
  }
  async loadDrivers(): Promise<void> {
    try {
      const res = await this.query<{ drivers: Collection<Driver> }>('/admin/drivers');
      this.adminDrivers = rows(res.drivers);
    } catch (error) { this.error = apiError(error); }
  }
  approveDriver(id: number, status: 'approved' | 'rejected' | 'suspended'): void {
    void this.withAction(async () => {
      await firstValueFrom(this.api.patch(`/admin/drivers/${id}/approval`, {
        approval_status: status, admin_notes: `Estado actualizado desde RUTA: ${status}`
      }));
      this.notice = 'Estado de aprobación actualizado.';
      await this.loadDrivers();
      await this.loadAdminDashboard();
    });
  }
  async loadFares(): Promise<void> {
    try {
      const res = await this.query<{ fares: Collection<Fare> }>('/admin/fares');
      this.adminFares = rows(res.fares);
    } catch (error) { this.error = apiError(error); }
  }
  createFare(): void {
    if (!this.fareForm.name.trim()) { this.error = 'La tarifa necesita un nombre.'; return; }
    void this.withAction(async () => {
      await firstValueFrom(this.api.post('/admin/fares', { ...this.fareForm }));
      this.notice = 'Nueva tarifa registrada.';
      await this.loadFares();
    });
  }
  async loadAdminTrips(): Promise<void> {
    try {
      const query = this.adminTripStatus ? { status: this.adminTripStatus } : undefined;
      const res = await firstValueFrom(this.api.get<{ trips: Collection<Trip> }>('/admin/trips', query));
      this.adminTrips = rows(res.trips);
    } catch (error) { this.error = apiError(error); }
  }
  async loadReports(): Promise<void> {
    try { this.adminReports = await this.query<unknown>('/admin/reports'); }
    catch (error) { this.error = apiError(error); }
  }
  async loadAudit(): Promise<void> {
    try {
      const data = await this.query<{ logs?: Collection<Record<string, unknown>>; audit_logs?: Collection<Record<string, unknown>> }>('/admin/audit-logs');
      this.adminAudit = rows(data.logs || data.audit_logs);
    } catch (error) { this.error = apiError(error); }
  }
  prettyReport(): string { return JSON.stringify(this.adminReports, null, 2); }
  recordText(record: Record<string, unknown>, key: string): string { return String(record[key] ?? '—'); }
}
