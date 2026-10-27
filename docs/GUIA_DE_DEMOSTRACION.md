# Guía de demostración del proyecto RUTA

## Componentes

- **Frontend:** Ionic 9 + Angular 21 + TypeScript (este repositorio).
- **Backend:** API REST externa Laravel 12 en la IP asignada por la institución.
- **Persistencia:** PostgreSQL del backend externo.
- **Integración:** servicios HTTP Angular que envían JWT en `Authorization: Bearer <token>`.

## Antes de iniciar

1. Conéctate a una red con acceso al servidor de la institución.
2. Abre en el navegador `http://20.20.1.157:8000/api/fares/active`. Si muestra `SQLSTATE[08006]` el problema está en el servidor de PostgreSQL y las pruebas reales deben aplazarse.
3. Ejecuta `npm install` y `npm start` en la raíz del proyecto.
4. Entra a `http://127.0.0.1:8100`.

## Demostración cuando PostgreSQL funcione

1. **Administrador**: se necesita la cuenta administrativa creada desde el backend. Inicia sesión, aprueba al conductor y verifica la tarifa activa.
2. **Conductor**: regístrate incluyendo licencia, placa, marca, modelo, año, capacidad y color. Inicia sesión y marca estado disponible.
3. **Cliente**: regístrate, inicia sesión, selecciona origen y destino en el mapa, consulta tarifa y solicita un viaje.
4. **Conductor**: consulta solicitudes abiertas, acepta, marca llegada, inicia viaje y finalmente lo completa indicando distancia y duración.
5. **Cliente**: ve el viaje activo, consulta historial y califica el viaje terminado.
6. **Administrador**: revisa resultados del panel, viajes, reportes y logs.

## Endpoints utilizados

| Acción de interfaz | Método | Endpoint |
|---|---|---|
| Registro | POST | `/api/auth/register` |
| Inicio de sesión | POST | `/api/auth/login` |
| Perfil | GET | `/api/auth/me` |
| Cerrar sesión | POST | `/api/auth/logout` |
| Tarifa pública | GET | `/api/fares/active` |
| Calcular tarifa | POST | `/api/client/estimate-fare` |
| Crear solicitud | POST | `/api/client/ride-requests` |
| Viaje activo | GET | `/api/client/active` |
| Cancelar | POST | `/api/client/cancel/{id}` |
| Historial del cliente | GET | `/api/client/trips` |
| Calificar | POST | `/api/client/trips/{id}/rating` |
| Disponibilidad conductor | PUT | `/api/driver/availability` |
| Buscar solicitudes | GET | `/api/driver/ride-requests` |
| Aceptar solicitud | POST | `/api/driver/ride-requests/{id}/accept` |
| Llegada | POST | `/api/driver/trips/{id}/arrive` |
| Inicio | POST | `/api/driver/trips/{id}/start` |
| Finalización | POST | `/api/driver/trips/{id}/complete` |
| Posición GPS | POST | `/api/driver/location` |
| KPIs | GET | `/api/admin/dashboard` |
| Lista de conductores | GET | `/api/admin/drivers` |
| Aprobar | PATCH | `/api/admin/drivers/{id}/approval` |
| Tarifas del admin | GET/POST | `/api/admin/fares` |
| Viajes del admin | GET | `/api/admin/trips` |
| Reportes | GET | `/api/admin/reports` |
| Auditoría | GET | `/api/admin/audit-logs` |

## Puntos para exponer al profesor

- Ionic genera la interfaz de la app y Angular implementa componentes, navegación y formularios.
- `ApiService` centraliza peticiones HTTP; `auth.interceptor.ts` añade JWT automáticamente.
- El proxy de desarrollo apunta al backend remoto y elimina CORS al usar rutas `/api` locales.
- No se modifica el backend ni se instala PostgreSQL local.
- La autorización real se aplica en Laravel. El frontend oculta módulos por rol pero no reemplaza las validaciones de seguridad del backend.
- La aceptación concurrente de viajes la protege el backend con una transacción; el frontend únicamente invoca el endpoint y muestra el error 409 si ocurre.
- OpenStreetMap muestra un mapa; la estimación real es responsabilidad del backend.
- No se incluye recuperación de contraseña insegura desde la interfaz.
