# RUTA · Plataforma de movilidad

Aplicación web/móvil realizada con **Ionic 9, Angular 21 y TypeScript**. Permite administrar una plataforma de viajes para **pasajeros, conductores y administradores** mediante el consumo de una API REST externa desarrollada en Laravel 12.

## Requisitos

- Node.js 22.12+ o 20.19+ (recomendado Node.js 22 LTS compatible con Angular 21).
- npm y acceso a internet para instalar dependencias y teselas de OpenStreetMap.
- Conectividad con la API REST de la institución.

## Inicio rápido (Windows, PowerShell o terminal de VS Code)

```bash
npm install
npm start
```

Abrir **http://127.0.0.1:8100**. Alternativamente: `npx ionic serve` después de instalar la CLI con `npm install -g @ionic/cli`.

Para compilar: `npm run build`. El resultado aparece en `www/`.

## Configuración de API

La aplicación envía sus solicitudes a `/api/...` por medio de `ApiService`. Durante `ng serve`, el archivo `proxy.conf.json` redirige esas llamadas a la URL suministrada por la institución, evitando problemas CORS.

Si cambia la dirección IP o el puerto del backend, modifica **solo `proxy.conf.json`** (`target`) y **reinicia `npm start`**. No se necesita base de datos local ni un segundo backend. La versión compilada en `www/` necesita un proxy equivalente en su servidor web o una configuración CORS permitida por la API; el proxy de Angular opera **solo durante el desarrollo**. Para ejecutar en Android con Capacitor es necesario configurar un backend HTTPS accesible y CORS, o proporcionar una capa de red segura; una IP HTTP local no garantiza conectividad en el dispositivo.

## Roles

| Rol | Funciones |
|---|---|
| Pasajero | registro y login, consulta de tarifa, mapa, estimación, solicitud, seguimiento, cancelación, historial, calificación |
| Conductor | registro de vehículo, disponibilidad, solicitudes, aceptación, llegada, inicio, finalización y actualización GPS manual |
| Administrador | tablero de indicadores, aprobación de conductores, tarifas, viajes, reportes y auditoría |

Todas las operaciones reales utilizan los endpoints documentados; **no hay respuestas simuladas ni credenciales integradas**. El administrador debe ser creado o provisto en el backend.

## Limitaciones conocidas del contrato API

- La API documentada no ofrece `GET /driver/trips` para recuperar viajes de un conductor. Se conserva su viaje actual **temporalmente en `sessionStorage`** tras aceptarlo; si se borra la sesión no se puede recuperar desde el frontend hasta que se añada ese endpoint.
- El mapa usa OpenStreetMap. La ruta visual es una **línea recta**; la distancia y el importe los calcula el backend según la especificación, no un proveedor de rutas por calles.
- El servidor remoto requiere PostgreSQL en funcionamiento. Si devuelve `SQLSTATE[08006]` / `127.0.0.1:5432`, debe resolverse en el propio servidor; **no se arregla instalando PostgreSQL en el equipo cliente**.
- Geolocalización: necesita autorización del usuario y origen seguro (HTTPS o localhost). Se envía la ubicación cuando el conductor presiona el botón, no se rastrea en segundo plano.
- El método `forgot-password` que incluye la documentación acepta email y contraseña nueva sin verificación previa; **no se ha expuesto en la interfaz por razones de seguridad** hasta disponer de un flujo de recuperación seguro en el servidor.
- La API no documenta facturación/pagos, mensajería ni navegación vial, por lo que no se han añadido servicios ficticios.

## Estructura

```
src/app/
  core/
    api.service.ts          Cliente HTTP centralizado
    auth.interceptor.ts     JWT Bearer automático
    auth.service.ts         Sesión y autenticación
    auth.guard.ts           Acceso protegido
    models.ts               Tipos de la documentación API
  pages/auth/               Login y registro por rol
  pages/dashboard/          Funciones de los 3 perfiles
  shared/map-picker.component.ts   Mapa interactivo
proxy.conf.json             Proxy de desarrollo a backend Laravel
```

## Seguridad y GitHub

No publiques tokens JWT, contraseñas, archivos `.env` reales ni claves de administrador. Los JWT se guardan en `sessionStorage` durante la sesión del navegador; para producción se requiere auditoría adicional de autenticación, CSP, manejo de XSS y HTTPS. El `.gitignore` excluye `node_modules`, `www`, `.angular` y archivos de entorno.

## Verificación

Con el backend activo: registrar pasajero → iniciar sesión → estimar → solicitar → iniciar sesión como conductor aprobado en otro navegador → activar disponibilidad → aceptar → marcar llegada → iniciar → finalizar → regresar al cliente → calificar. El rol administrador puede aprobar al conductor y configurar tarifas. Si PostgreSQL está caído, se visualiza el mensaje, pero las operaciones de datos reales no se completarán.
