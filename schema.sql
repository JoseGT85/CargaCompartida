-- ============================================================================
-- CargaCompartida — Schema Inicial
-- Target: Supabase (PostgreSQL 15 + PostGIS 3.4)
-- Fecha: 2026-02-16
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0. Extensiones
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda fuzzy de ciudades

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Enums
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('client', 'driver', 'admin');
CREATE TYPE kyc_status      AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE trip_direction   AS ENUM ('outbound', 'return');
CREATE TYPE trip_status      AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status   AS ENUM ('requested', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed');
CREATE TYPE payment_status   AS ENUM ('pending', 'escrow', 'released', 'refunded', 'failed');
CREATE TYPE vehicle_type     AS ENUM ('sedan', 'pickup', 'van', 'suv', 'utilitario');

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Profiles (extiende auth.users de Supabase)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role            user_role       NOT NULL DEFAULT 'client',
    full_name       TEXT            NOT NULL,
    phone           TEXT            NOT NULL,
    cuit_cuil       TEXT,                          -- Identificación fiscal argentina
    avatar_url      TEXT,
    kyc_status      kyc_status      NOT NULL DEFAULT 'pending',
    kyc_submitted_at TIMESTAMPTZ,
    rating_avg      NUMERIC(3,2)    DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count    INTEGER         DEFAULT 0     CHECK (rating_count >= 0),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_kyc  ON profiles(kyc_status);

COMMENT ON TABLE profiles IS 'Perfil extendido de usuario. Roles: client (PyME que envía), driver (transportista), admin.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Vehicles
--    HARD CONSTRAINT: capacity_kg <= 3500 (Restricción Anti-Sindicato)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plate           TEXT            NOT NULL UNIQUE,
    brand           TEXT            NOT NULL,
    model           TEXT            NOT NULL,
    year            INTEGER         NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM now()) + 1),
    vehicle_type    vehicle_type    NOT NULL,
    capacity_kg     INTEGER         NOT NULL CHECK (capacity_kg > 0 AND capacity_kg <= 3500),
    volume_m3       NUMERIC(5,2),                  -- Volumen de carga en m³
    photo_url       TEXT,
    insurance_url   TEXT,                           -- Foto de póliza de seguro
    vtv_expiry      DATE,                           -- Vencimiento Verificación Técnica
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_driver   ON vehicles(driver_id);
CREATE INDEX idx_vehicles_capacity ON vehicles(capacity_kg);

COMMENT ON COLUMN vehicles.capacity_kg IS
    'Capacidad máxima en kg. HARD LIMIT: 3500 kg. Vehículos mayores están prohibidos (Ley 24.653 / conflicto sindical).';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Trips (Viajes publicados por drivers)
--    Usa PostGIS GEOGRAPHY para rutas y puntos
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id      UUID            NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,

    -- Origen y Destino
    origin_name     TEXT            NOT NULL,       -- "Mendoza Capital"
    origin_point    GEOGRAPHY(POINT, 4326) NOT NULL,
    dest_name       TEXT            NOT NULL,       -- "Buenos Aires (CABA)"
    dest_point      GEOGRAPHY(POINT, 4326) NOT NULL,

    -- Ruta completa (linestring) para visualización en mapa
    route_line      GEOGRAPHY(LINESTRING, 4326),

    -- Metadata del viaje
    direction       trip_direction  NOT NULL,       -- 'outbound' o 'return'
    departure_at    TIMESTAMPTZ     NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    distance_km     INTEGER,                        -- Distancia estimada
    available_kg    INTEGER         NOT NULL CHECK (available_kg > 0),
    available_m3    NUMERIC(5,2),
    price_per_kg    NUMERIC(10,2)   NOT NULL CHECK (price_per_kg > 0),
    notes           TEXT,
    status          trip_status     NOT NULL DEFAULT 'draft',

    -- Waypoints opcionales (paradas intermedias como San Luis, Junín)
    waypoints       JSONB           DEFAULT '[]',

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Un driver no puede tener dos viajes activos solapados
    CONSTRAINT chk_dates CHECK (estimated_arrival IS NULL OR estimated_arrival > departure_at)
);

-- Índice espacial para búsqueda por proximidad geográfica
CREATE INDEX idx_trips_origin_geo  ON trips USING GIST (origin_point);
CREATE INDEX idx_trips_dest_geo    ON trips USING GIST (dest_point);
CREATE INDEX idx_trips_route_geo   ON trips USING GIST (route_line);

-- Índices de filtrado
CREATE INDEX idx_trips_status      ON trips(status);
CREATE INDEX idx_trips_direction   ON trips(direction);
CREATE INDEX idx_trips_departure   ON trips(departure_at);
CREATE INDEX idx_trips_driver      ON trips(driver_id);

COMMENT ON COLUMN trips.direction IS
    'BACKHAUL PRIORITY: El matching multiplica ×1.5 el score de viajes con direction = return.';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Bookings (Reservas de carga en un viaje)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID            NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    client_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Detalle de la carga
    description     TEXT            NOT NULL,
    weight_kg       INTEGER         NOT NULL CHECK (weight_kg > 0),
    volume_m3       NUMERIC(5,2),
    pickup_point    GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address  TEXT            NOT NULL,
    dropoff_point   GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_address TEXT            NOT NULL,

    -- Estado del booking
    status          booking_status  NOT NULL DEFAULT 'requested',
    status_history  JSONB           NOT NULL DEFAULT '[]',  -- [{status, timestamp, note}]

    -- Pago
    agreed_price    NUMERIC(10,2)   NOT NULL CHECK (agreed_price > 0),
    platform_fee    NUMERIC(10,2)   NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
    payment_status  payment_status  NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,

    -- Confirmaciones
    picked_up_at    TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    driver_confirmed BOOLEAN        DEFAULT FALSE,
    client_confirmed BOOLEAN        DEFAULT FALSE,

    -- Ratings post-entrega
    driver_rating   SMALLINT        CHECK (driver_rating IS NULL OR (driver_rating >= 1 AND driver_rating <= 5)),
    client_rating   SMALLINT        CHECK (client_rating IS NULL OR (client_rating >= 1 AND client_rating <= 5)),

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Un cliente no puede reservar dos veces en el mismo viaje
    CONSTRAINT uq_booking_client_trip UNIQUE (trip_id, client_id)
);

CREATE INDEX idx_bookings_trip     ON bookings(trip_id);
CREATE INDEX idx_bookings_client   ON bookings(client_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_payment  ON bookings(payment_status);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Tracking Points (Posiciones GPS, incluyendo modo offline)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE tracking_points (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID            NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    point           GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh       NUMERIC(5,1),
    heading         NUMERIC(5,1),                  -- Dirección en grados (0-360)
    accuracy_m      NUMERIC(6,1),                  -- Precisión GPS en metros
    recorded_at     TIMESTAMPTZ     NOT NULL,       -- Timestamp del dispositivo (puede ser offline)
    synced_at       TIMESTAMPTZ     DEFAULT now(),  -- Cuándo llegó al server
    is_offline      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índice para consultas de ruta por viaje
CREATE INDEX idx_tracking_trip_time ON tracking_points(trip_id, recorded_at);
CREATE INDEX idx_tracking_geo       ON tracking_points USING GIST (point);

COMMENT ON COLUMN tracking_points.is_offline IS
    'TRUE si el punto fue registrado offline (Ruta 7/40, zonas de montaña) y synced después.';

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Row Level Security (RLS) — Políticas básicas
-- ────────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_points  ENABLE ROW LEVEL SECURITY;

-- PROFILES: Lectura pública, edición propia
CREATE POLICY "Profiles: lectura pública"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Profiles: editar propio"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- VEHICLES: Lectura pública de vehículos verificados, CRUD propio
CREATE POLICY "Vehicles: lectura verificados"
    ON vehicles FOR SELECT
    USING (is_verified = true OR driver_id = auth.uid());

CREATE POLICY "Vehicles: insertar propio"
    ON vehicles FOR INSERT
    WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Vehicles: editar propio"
    ON vehicles FOR UPDATE
    USING (driver_id = auth.uid());

-- TRIPS: Lectura de viajes publicados, CRUD propio
CREATE POLICY "Trips: lectura publicados"
    ON trips FOR SELECT
    USING (status IN ('published', 'in_progress', 'completed') OR driver_id = auth.uid());

CREATE POLICY "Trips: insertar propio"
    ON trips FOR INSERT
    WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Trips: editar propio"
    ON trips FOR UPDATE
    USING (driver_id = auth.uid());

-- BOOKINGS: Ver propios (como client o como driver del trip)
CREATE POLICY "Bookings: ver propios"
    ON bookings FOR SELECT
    USING (
        client_id = auth.uid()
        OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
    );

CREATE POLICY "Bookings: crear como cliente"
    ON bookings FOR INSERT
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "Bookings: actualizar involucrados"
    ON bookings FOR UPDATE
    USING (
        client_id = auth.uid()
        OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
    );

-- TRACKING: Solo driver del viaje puede insertar, driver y cliente del booking pueden ver
CREATE POLICY "Tracking: insertar propio"
    ON tracking_points FOR INSERT
    WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Tracking: ver involucrados"
    ON tracking_points FOR SELECT
    USING (
        driver_id = auth.uid()
        OR trip_id IN (
            SELECT b.trip_id FROM bookings b WHERE b.client_id = auth.uid()
        )
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Funciones auxiliares
-- ────────────────────────────────────────────────────────────────────────────

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated  BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated  BEFORE UPDATE ON vehicles         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated     BEFORE UPDATE ON trips            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated  BEFORE UPDATE ON bookings         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función de búsqueda de viajes por proximidad (backhaul priority)
CREATE OR REPLACE FUNCTION search_trips_nearby(
    p_origin    GEOGRAPHY,
    p_dest      GEOGRAPHY,
    p_radius_km INTEGER DEFAULT 50,
    p_limit     INTEGER DEFAULT 20
)
RETURNS TABLE (
    trip_id         UUID,
    driver_id       UUID,
    origin_name     TEXT,
    dest_name       TEXT,
    direction       trip_direction,
    departure_at    TIMESTAMPTZ,
    available_kg    INTEGER,
    price_per_kg    NUMERIC,
    distance_origin DOUBLE PRECISION,   -- metros desde el origen buscado
    distance_dest   DOUBLE PRECISION,   -- metros desde el destino buscado
    match_score     DOUBLE PRECISION    -- Score con backhaul priority
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.driver_id,
        t.origin_name,
        t.dest_name,
        t.direction,
        t.departure_at,
        t.available_kg,
        t.price_per_kg,
        ST_Distance(t.origin_point, p_origin)  AS distance_origin,
        ST_Distance(t.dest_point, p_dest)      AS distance_dest,
        -- BACKHAUL PRIORITY: viajes de retorno reciben ×1.5 en score
        (
            1.0 / (1.0 + ST_Distance(t.origin_point, p_origin) / 1000.0 + ST_Distance(t.dest_point, p_dest) / 1000.0)
        ) * CASE WHEN t.direction = 'return' THEN 1.5 ELSE 1.0 END
        AS match_score
    FROM trips t
    WHERE t.status = 'published'
      AND t.departure_at > now()
      AND ST_DWithin(t.origin_point, p_origin, p_radius_km * 1000)
      AND ST_DWithin(t.dest_point, p_dest, p_radius_km * 1000)
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_trips_nearby IS
    'Busca viajes cercanos al origen/destino deseado. Aplica multiplicador ×1.5 a viajes de retorno (backhaul priority).';

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Crear perfil automáticamente al registrarse en Supabase Auth
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
