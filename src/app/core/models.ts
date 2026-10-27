export type Role = 'client' | 'driver' | 'admin';
export type RideStatus = 'requested' | 'assigned' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status?: string;
  driver?: { approval_status?: string; availability_status?: string; id?: number };
}
export interface AuthResponse { success: boolean; message: string; access_token: string; token_type: string; expires_in: number; user: User }
export interface Fare { id: number; name: string; base_fare: number; price_per_km: number; price_per_minute: number; minimum_fare: number; surge_multiplier: number; active: boolean }
export interface FareEstimate { distance_km: number; duration_min: number; estimated_fare: number; currency: string; fare_breakdown?: Partial<Fare> }
export interface Coordinates { latitude: number; longitude: number }
export interface RideCoordinates {
  origin_latitude: number; origin_longitude: number;
  destination_latitude: number; destination_longitude: number;
}
export interface RideRequest extends RideCoordinates {
  id: number; client_id?: number; origin_name: string; destination_name: string;
  estimated_distance_km?: number; estimated_duration_min?: number; estimated_fare?: number;
  status: RideStatus; client?: Partial<User>; created_at?: string;
}
export interface Trip {
  id: number; request_id?: number; client_id?: number; driver_id?: number;
  status: RideStatus; estimated_fare?: number; final_fare?: number;
  created_at?: string; completed_at?: string;
  ride_request?: Partial<RideRequest>;
  client?: Partial<User>;
  driver?: { id?: number; user?: Partial<User>; latest_location?: Coordinates & { recorded_at?: string } };
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
  rating?: { score: number };
}
export interface Driver {
  id: number; license_number: string; approval_status: string;
  availability_status?: string; rating_average?: number;
  user?: Partial<User>; vehicles?: { plate: string; brand: string; model: string; year?: number }[];
}
export interface DashboardStats {
  total_clients?: number; total_drivers?: number; pending_drivers?: number; approved_drivers?: number;
  active_trips?: number; completed_trips?: number; cancelled_trips?: number;
  pending_requests?: number; total_revenue?: number;
}
export interface PageResponse<T> { data: T[]; current_page?: number; last_page?: number; total?: number }
export type Collection<T> = T[] | PageResponse<T>;
export function rows<T>(value: Collection<T> | null | undefined): T[] {
  return Array.isArray(value) ? value : (value?.data || []);
}
export const money = (value: number | string | undefined | null): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value ?? 0));
export const dateTime = (value?: string): string => value ? new Date(value).toLocaleString('es-CO') : '—';
export const statusLabel = (status?: string): string => ({
  requested: 'Solicitado', assigned: 'Asignado', driver_arrived: 'Conductor llegó',
  in_progress: 'En recorrido', completed: 'Finalizado', cancelled: 'Cancelado',
  available: 'Disponible', unavailable: 'Desconectado', pending: 'Pendiente',
  approved: 'Aprobado', suspended: 'Suspendido', rejected: 'Rechazado',
  active: 'Activo'
} as Record<string,string>)[status || ''] || status || '—';
