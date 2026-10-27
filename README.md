# RUTA · Consumo de la API del profesor

**Objetivo:** interfaz web tipo Uber para tres perfiles (cliente, conductor, administrador), conectada exclusivamente a la **API REST Laravel 12 del profesor** publicada en `http://20.20.1.157:8000/api`.

No hay base de datos ni API de viajes local. La API del profesor autentica JWT, guarda viajes y calcula tarifas. El Laravel de este proyecto solo sirve la interfaz y actúa como *proxy* para evitar errores de CORS.

## Ruta rápida SIN instalar Laravel (recomendada para probar)

En Windows, dentro de esta carpeta:

```bat
python servidor_demo.py
```

Si Windows usa `py`:

```bat
py servidor_demo.py
```

Abrir **http://127.0.0.1:5500**. La interfaz web se encuentra en `public/index.html` y llama a `http://127.0.0.1:5500/api/...`; el proxy traduce esas llamadas a `http://20.20.1.157:8000/api/...`.

Se requiere Python 3.8+ (biblioteca estándar, sin `pip install`). El servidor de Python es **solo desarrollo**, se limita a `127.0.0.1`.

## Ejecutar como proyecto Laravel 12

Requisitos: PHP 8.2+, Composer y acceso de red al backend del profesor. **No necesitas PostgreSQL local**.

1. `composer install`
2. Windows: `copy .env.example .env` · macOS/Linux: `cp .env.example .env`
3. `php artisan key:generate`
4. `php artisan serve --host=127.0.0.1 --port=8000`
5. Abre **http://127.0.0.1:8000**.

La ruta `/` muestra `resources/views/app.blade.php`; todas las peticiones `/api/*` son reenviadas mediante `app/Http/Controllers/Api/ProxyController.php`, usando `API_PROFESOR_URL` de `.env`. No ejecutes `migrate`, `db:seed` ni crees un PostgreSQL local.

Si cambias `API_PROFESOR_URL`, ejecuta `php artisan config:clear`.

## Importante: falla actual DEL BACKEND DEL PROFESOR

Al visitar `http://20.20.1.157:8000/api/fares/active`, el servidor contesta con una excepción que incluye:

```
SQLSTATE[08006] [7] connection to server at "127.0.0.1", port 5432 failed: Connection refused
Database: uber_db
```

Esto confirma que la API Laravel de la IP responde, pero **su PostgreSQL NO está aceptando conexiones**. Tu computadora no puede resolver ese error con JavaScript, Docker o la base de datos propia. La persona que administra el backend debe levantar/configurar PostgreSQL, comprobar `DB_HOST`, `DB_PORT`, `DB_DATABASE=uber_db`, luego ejecutar `php artisan config:clear` si aplica. Recomendar también desactivar `APP_DEBUG` al exponer la API.

Una vez resuelto, prueba en el navegador del equipo:

`http://20.20.1.157:8000/api/fares/active`

Debe retornar un JSON con `success: true` y `fare`, no SQLSTATE.

## Flujo para demostración

1. Un administrador ya existente en el servidor del profesor ingresa (las cuentas demo del proyecto anterior **NO** existen necesariamente allí).
2. Registra un conductor y un cliente desde los formularios.
3. El administrador aprueba al conductor en el panel.
4. El conductor activa la disponibilidad.
5. El cliente estima y solicita un viaje.
6. El conductor acepta, llega, inicia y finaliza el viaje.
7. El cliente consulta el estado, ve su historial y califica el viaje.

## Endpoints usados: TODOS documentados

Autenticación: `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout`.

Público: `/fares/active`.

Cliente: `/client/estimate-fare`, `/client/ride-requests`, `/client/active`, `/client/cancel/{id}`, `/client/trips`, `/client/trips/{id}/rating`.

Conductor: `/driver/availability`, `/driver/ride-requests`, `/driver/ride-requests/{id}/accept`, `/driver/trips/{id}/arrive`, `/driver/trips/{id}/start`, `/driver/trips/{id}/complete`, `/driver/location`.

Administrador: `/admin/dashboard`, `/admin/drivers`, `/admin/drivers/{id}/approval`, `/admin/fares`, `/admin/trips`, `/admin/reports`, `/admin/audit-logs`.

## Límites de la documentación entregada

- No se describe `GET /driver/trips` ni `GET /driver/earnings`. Para una demostración básica, el frontend guarda localmente el viaje aceptado y finalizado **solo durante la sesión en el navegador**. No son datos históricos confiables ni reemplazan una consulta real al backend.
- No se describen `/admin/incidents` ni actualización de incidencias. El panel solo muestra `recent_incidents` que puedan venir en el dashboard.
- El modelo `GET /auth/me` documentado no garantiza incluir `driver.approval_status`. Se muestra por defecto `Por verificar` y el API valida si el conductor puede acceder.
- `POST /auth/forgot-password` permite cambiar una clave con `email` y `new_password` sin explicar una verificación de identidad; por seguridad esta función **no se expone en la interfaz**, hasta que el profesor confirme un procedimiento seguro.
- La API no especifica una ruta de inicio de sesión para nuevos administradores. Debe suministrar la cuenta el profesor.
- El seguimiento GPS requiere permiso del navegador y, salvo localhost, normalmente HTTPS. El mapa Leaflet usa recursos públicos que requieren internet.
- El frontend no elude los roles JWT: el backend debe aplicar la autorización.

## Estructura

- `resources/views/app.blade.php`: interfaz servida por Laravel.
- `public/index.html`: misma interfaz en versión estática para el servidor Python.
- `public/js/app.js`: lógica de consumo de API, login, mapas, roles y viajes.
- `public/css/app.css`: estilos.
- `routes/api.php` y `ProxyController.php`: proxy Laravel para la API del profesor.
- `servidor_demo.py`: proxy Python opcional sin dependencias, solo local.
- `API_DOCUMENTATION.md`: especificación del profesor, sin modificaciones.

> Este paquete no permite comprobar en vivo el flujo hasta que PostgreSQL funcione en el servidor del profesor. No se incluyen contraseñas del administrador ni se inventan datos de prueba.
