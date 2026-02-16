# CLAUDE.md — Manifiesto Técnico de CargaCompartida

> **Documento normativo.** Todo código generado para este proyecto DEBE cumplir las reglas aquí definidas.
> Última actualización: 2026-02-16

---

## 1. Visión del Producto

**CargaCompartida** es una plataforma logística P2P/B2B para la provincia de Mendoza, Argentina.
Conecta vehículos livianos (< 3.5 t) que regresan vacíos de viajes de larga distancia (*backhaul*)
con PyMEs que necesitan envíos económicos.

**Modelo de negocio:** Marketplace comisionado sobre el precio del flete.

---

## 2. Stack Tecnológico (Obligatorio)

| Capa              | Tecnología                                          | Versión mínima |
| ----------------- | --------------------------------------------------- | -------------- |
| **Mobile**        | React Native + Expo (Managed Workflow)              | SDK 52         |
| **Navegación**    | Expo Router (file-based routing)                    | v4             |
| **Estilos**       | NativeWind (Tailwind CSS para RN)                   | v4             |
| **Estado global** | Zustand                                             | v5             |
| **Server state**  | TanStack Query (React Query)                        | v5             |
| **Validación**    | Zod                                                 | v3             |
| **Backend**       | Supabase (PostgreSQL 15 + PostGIS 3.4)              | —              |
| **Edge Functions**| Supabase Edge Functions (Deno runtime)              | —              |
| **Auth**          | Supabase Auth (magic link + OTP telefónico)         | —              |
| **Storage**       | Supabase Storage (fotos de vehículos, DNI, seguros) | —              |
| **Mapas**         | react-native-maps + Mapbox Directions API           | —              |
| **Offline**       | MMKV (persistencia local) + TanStack Query persist  | —              |
| **Notificaciones**| Expo Notifications + Supabase Realtime              | —              |
| **Testing**       | Jest + React Native Testing Library                 | —              |
| **CI/CD**         | EAS Build + EAS Submit                              | —              |

### Prohibiciones explícitas

- ❌ NO usar Redux, MobX ni Context API para estado global.
- ❌ NO usar Axios; usar el cliente nativo de Supabase + `fetch` para Edge Functions.
- ❌ NO usar `@react-navigation` directamente; toda navegación vía Expo Router.
- ❌ NO usar Bare Workflow de React Native.
- ❌ NO usar ORMs en Edge Functions; usar SQL directo con `supabase-js`.

---

## 3. Reglas de Negocio Críticas (Hard Constraints)

### 3.1 Restricción Anti-Sindicato (OBLIGATORIA)

```
Los vehículos registrados NO pueden tener capacidad > 3500 kg.
```

- **Base de datos:** `CHECK (capacity_kg <= 3500)` en la tabla `vehicles`.
- **Frontend:** Validación Zod con `.max(3500)` en formulario de registro de vehículo.
- **Edge Function:** Validación server-side antes de INSERT. Rechazar con HTTP 422.
- **Motivo legal:** Evitar conflicto con gremios de transporte de carga pesada (Ley 24.653).

### 3.2 Prioridad Backhaul

```
El algoritmo de matching DEBE priorizar viajes de RETORNO sobre viajes de IDA.
```

- Cada viaje (`trips`) tiene un campo `direction: 'outbound' | 'return'`.
- El scoring de matching aplica un **multiplicador ×1.5** a viajes de retorno.
- La búsqueda por defecto ordena: `return` primero, luego `outbound`.
- KPI objetivo: ≥ 60% de los matches deben ser viajes de retorno.

### 3.3 Tolerancia Offline (Rutas de Montaña)

```
La app DEBE funcionar sin señal en Ruta 7, Ruta 40 y zonas cordilleranas.
```

- **Tracking:** El GPS sigue registrando posiciones en MMKV cuando no hay conexión.
- **Sync:** Al recuperar señal, se envía el batch de posiciones al backend con timestamps.
- **Datos offline:** Detalle del viaje activo, datos del contacto, ruta guardada en cache.
- **UI:** Indicador visual claro de "modo offline" con ícono de montaña.
- **Prueba obligatoria:** Simular 30 min sin conexión y validar que no se pierden datos.

### 3.4 Zona Geográfica

- **Cobertura inicial:** Provincia de Mendoza + rutas interprovinciales frecuentes.
- **Rutas prioritarias:** Mendoza ↔ Buenos Aires (Ruta 7), Mendoza ↔ San Rafael (Ruta 40/143), Mendoza ↔ San Juan (Ruta 40 Norte), Mendoza ↔ Chile (Ruta 7 / Paso Los Libertadores).

---

## 4. Estructura de Proyecto (Vertical Slices)

```
/src
├── app/                    # Expo Router — file-based routing
│   ├── (auth)/             # Grupo de rutas: login, register, kyc
│   ├── (tabs)/             # Grupo de rutas: pantallas principales con tab bar
│   ├── trip/[id].tsx       # Ruta dinámica: detalle de viaje
│   └── _layout.tsx         # Root layout
│
├── features/               # Vertical Slices (núcleo de la app)
│   ├── auth/               # Autenticación y KYC
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   │
│   ├── trips/              # Publicar viaje, buscar carga
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   │
│   ├── matching/           # Algoritmo de matching carga ↔ viaje
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── tracking/           # Geolocalización background + offline sync
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   │
│   ├── bookings/           # Reservas, contratos, estados de pago
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── payments/           # Integración pasarela de pago
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── shared/                 # Código compartido entre features
│   ├── components/         # UI kit reutilizable (Button, Input, Card, etc.)
│   ├── hooks/              # useOfflineStatus, useLocation, etc.
│   ├── utils/              # Formatters, helpers, constants
│   └── types/              # Tipos globales (Database types, enums)
│
├── lib/                    # Configuración de servicios externos
│   ├── supabase.ts         # Cliente Supabase + config offline
│   ├── queryClient.ts      # TanStack Query + persist config
│   ├── mmkv.ts             # Storage MMKV
│   └── mapbox.ts           # Config Mapbox
│
└── config/                 # Variables de entorno y feature flags
    ├── env.ts
    └── constants.ts
```

### Reglas de importación

- ✅ `features/X` puede importar de `shared/` y `lib/`.
- ✅ `features/X` puede importar tipos de `features/Y/types/`.
- ❌ `features/X` NO puede importar componentes, hooks o services de `features/Y`.
- ❌ `shared/` NUNCA importa de `features/`.

---

## 5. Convenciones de Código

### Naming

| Elemento        | Convención        | Ejemplo                      |
| --------------- | ----------------- | ---------------------------- |
| Componentes     | PascalCase        | `TripCard.tsx`               |
| Hooks           | camelCase, `use`  | `usePublishTrip.ts`          |
| Services        | camelCase         | `tripService.ts`             |
| Types/Interfaces| PascalCase, `I`/` | `Trip`, `IBookingStatus`     |
| Stores (Zustand)| camelCase, `Store`| `useAuthStore.ts`            |
| Archivos SQL    | snake_case        | `create_trips.sql`           |

### TypeScript

- `strict: true` obligatorio en `tsconfig.json`.
- Todo endpoint y formulario validado con schema Zod.
- Tipos de DB generados con `supabase gen types`.

### Git

- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Branches: `feature/CC-{n}-descripcion`, `fix/CC-{n}-descripcion`.
- PR obligatorio con al menos 1 review para merge a `main`.

---

## 6. Entornos

| Entorno      | Supabase Project | Expo Channel |
| ------------ | ---------------- | ------------ |
| Development  | `carga-dev`      | `development`|
| Staging      | `carga-staging`  | `preview`    |
| Production   | `carga-prod`     | `production` |

---

## 7. Checklist Pre-Deploy

- [ ] Todas las validaciones Zod coinciden con los CHECK constraints de la DB.
- [ ] Modo offline testeado con avión mode durante 30 min.
- [ ] Ningún vehículo con capacity > 3500 kg puede completar registro.
- [ ] Edge Functions tienen rate limiting y validación de JWT.
- [ ] RLS (Row Level Security) activo en TODAS las tablas.

---

*Este documento es la fuente de verdad. Ante cualquier duda, CLAUDE.md manda.*
