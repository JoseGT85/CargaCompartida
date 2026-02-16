-- 00_init.sql
-- Extensiones, Enums, Tablas Base

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role       AS ENUM ('client', 'driver', 'admin');
CREATE TYPE kyc_status      AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE trip_direction   AS ENUM ('outbound', 'return');
CREATE TYPE trip_status      AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status   AS ENUM ('requested', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed');
CREATE TYPE payment_status   AS ENUM ('pending', 'escrow', 'released', 'refunded', 'failed');
CREATE TYPE vehicle_type     AS ENUM ('sedan', 'pickup', 'van', 'suv', 'utilitario');

-- Tables
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role            user_role       NOT NULL DEFAULT 'client',
    full_name       TEXT            NOT NULL,
    phone           TEXT            NOT NULL,
    cuit_cuil       TEXT,
    avatar_url      TEXT,
    kyc_status      kyc_status      NOT NULL DEFAULT 'pending',
    kyc_submitted_at TIMESTAMPTZ,
    rating_avg      NUMERIC(3,2)    DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count    INTEGER         DEFAULT 0     CHECK (rating_count >= 0),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plate           TEXT            NOT NULL UNIQUE,
    brand           TEXT            NOT NULL,
    model           TEXT            NOT NULL,
    year            INTEGER         NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM now()) + 1),
    vehicle_type    vehicle_type    NOT NULL,
    capacity_kg     INTEGER         NOT NULL CHECK (capacity_kg > 0 AND capacity_kg <= 3500),
    volume_m3       NUMERIC(5,2),
    photo_url       TEXT,
    insurance_url   TEXT,
    vtv_expiry      DATE,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id      UUID            NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    origin_name     TEXT            NOT NULL,
    origin_point    GEOGRAPHY(POINT, 4326) NOT NULL,
    dest_name       TEXT            NOT NULL,
    dest_point      GEOGRAPHY(POINT, 4326) NOT NULL,
    route_line      GEOGRAPHY(LINESTRING, 4326),
    direction       trip_direction  NOT NULL,
    departure_at    TIMESTAMPTZ     NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    distance_km     INTEGER,
    available_kg    INTEGER         NOT NULL CHECK (available_kg > 0),
    available_m3    NUMERIC(5,2),
    price_per_kg    NUMERIC(10,2)   NOT NULL CHECK (price_per_kg > 0),
    notes           TEXT,
    status          trip_status     NOT NULL DEFAULT 'draft',
    waypoints       JSONB           DEFAULT '[]',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT chk_dates CHECK (estimated_arrival IS NULL OR estimated_arrival > departure_at)
);

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID            NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    client_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description     TEXT            NOT NULL,
    weight_kg       INTEGER         NOT NULL CHECK (weight_kg > 0),
    volume_m3       NUMERIC(5,2),
    pickup_point    GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address  TEXT            NOT NULL,
    dropoff_point   GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_address TEXT            NOT NULL,
    status          booking_status  NOT NULL DEFAULT 'requested',
    status_history  JSONB           NOT NULL DEFAULT '[]',
    agreed_price    NUMERIC(10,2)   NOT NULL CHECK (agreed_price > 0),
    platform_fee    NUMERIC(10,2)   NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
    payment_status  payment_status  NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,
    picked_up_at    TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    driver_confirmed BOOLEAN        DEFAULT FALSE,
    client_confirmed BOOLEAN        DEFAULT FALSE,
    driver_rating   SMALLINT        CHECK (driver_rating IS NULL OR (driver_rating >= 1 AND driver_rating <= 5)),
    client_rating   SMALLINT        CHECK (client_rating IS NULL OR (client_rating >= 1 AND client_rating <= 5)),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_booking_client_trip UNIQUE (trip_id, client_id)
);

CREATE TABLE tracking_points (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID            NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    point           GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh       NUMERIC(5,1),
    heading         NUMERIC(5,1),
    accuracy_m      NUMERIC(6,1),
    recorded_at     TIMESTAMPTZ     NOT NULL,
    synced_at       TIMESTAMPTZ     DEFAULT now(),
    is_offline      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);
