-- ============================================================
-- 05_reputation_system.sql
-- Sistema de Reputación y Priority Dispatch
--
-- 1. Enum driver_tier
-- 2. Columnas nuevas en profiles
-- 3. Tabla reviews
-- 4. Trigger: recalcular tier al insertar review
-- 5. Función search_trips_nearby con ventana de prioridad
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUM: driver_tier
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE driver_tier AS ENUM ('bronze', 'silver', 'gold');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. COLUMNAS NUEVAS en profiles
-- ────────────────────────────────────────────────────────────
--    rating_avg y rating_count ya existen en init.sql.
--    Agregamos trips_completed y driver_tier.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS trips_completed INTEGER NOT NULL DEFAULT 0
        CHECK (trips_completed >= 0);

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS driver_tier driver_tier NOT NULL DEFAULT 'bronze';

-- Renombrar rating_avg default de 0.00 → 5.00 para nuevos choferes
-- (No rompe filas existentes; solo cambia el default)
ALTER TABLE profiles
    ALTER COLUMN rating_avg SET DEFAULT 5.00;

-- ────────────────────────────────────────────────────────────
-- 3. TABLA: reviews
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID            NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    reviewer_id     UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_id     UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating          SMALLINT        NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Un usuario solo puede dejar una review por viaje
    CONSTRAINT uq_review_per_trip UNIQUE (trip_id, reviewer_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id  ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id       ON reviews(trip_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at    ON reviews(created_at DESC);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Cualquiera autenticado puede ver reviews
CREATE POLICY reviews_select ON reviews
    FOR SELECT TO authenticated
    USING (true);

-- Solo el reviewer puede insertar su propia review
CREATE POLICY reviews_insert ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

-- No se pueden editar ni borrar reviews
-- (inmutabilidad para confianza)

-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER: Recalcular rating + tier al insertar review
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_driver_reputation()
RETURNS TRIGGER AS $$
DECLARE
    v_avg       NUMERIC(3,2);
    v_count     INTEGER;
    v_completed INTEGER;
    v_new_tier  driver_tier;
BEGIN
    -- Calcular promedio y cantidad de reviews del conductor evaluado
    SELECT
        ROUND(AVG(r.rating)::NUMERIC, 2),
        COUNT(r.id)
    INTO v_avg, v_count
    FROM reviews r
    WHERE r.reviewed_id = NEW.reviewed_id;

    -- Obtener viajes completados
    SELECT trips_completed
    INTO v_completed
    FROM profiles
    WHERE id = NEW.reviewed_id;

    -- Determinar tier
    IF v_avg > 4.8 AND v_completed > 50 THEN
        v_new_tier := 'gold';
    ELSIF v_avg > 4.5 AND v_completed > 10 THEN
        v_new_tier := 'silver';
    ELSE
        v_new_tier := 'bronze';
    END IF;

    -- Actualizar perfil del conductor
    UPDATE profiles
    SET rating_avg    = v_avg,
        rating_count  = v_count,
        driver_tier   = v_new_tier
    WHERE id = NEW.reviewed_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: se ejecuta DESPUÉS de cada INSERT en reviews
DROP TRIGGER IF EXISTS trg_recalc_reputation ON reviews;
CREATE TRIGGER trg_recalc_reputation
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_driver_reputation();

-- ────────────────────────────────────────────────────────────
-- 5. FUNCIÓN: search_trips_nearby con Priority Dispatch
-- ────────────────────────────────────────────────────────────
--    Ventana de tiempo:
--      < 5 min  → Solo gold
--      < 15 min → gold + silver
--      > 15 min → todos
--
--    p_caller_tier se pasa desde la app para filtrar.

CREATE OR REPLACE FUNCTION search_trips_nearby(
    p_origin        GEOGRAPHY,
    p_dest          GEOGRAPHY,
    p_radius_km     INTEGER DEFAULT 50,
    p_limit         INTEGER DEFAULT 20,
    p_caller_tier   TEXT    DEFAULT 'bronze'
)
RETURNS TABLE (
    trip_id         UUID,
    driver_id       UUID,
    driver_name     TEXT,
    driver_tier     driver_tier,
    driver_rating   NUMERIC,
    origin_name     TEXT,
    dest_name       TEXT,
    direction       trip_direction,
    departure_at    TIMESTAMPTZ,
    available_kg    INTEGER,
    price_per_kg    NUMERIC,
    distance_origin DOUBLE PRECISION,
    distance_dest   DOUBLE PRECISION,
    match_score     DOUBLE PRECISION,
    minutes_since   DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id                                            AS trip_id,
        t.driver_id,
        p.full_name                                     AS driver_name,
        p.driver_tier,
        p.rating_avg                                    AS driver_rating,
        t.origin_name,
        t.dest_name,
        t.direction,
        t.departure_at,
        t.available_kg,
        t.price_per_kg,
        ST_Distance(t.origin_point, p_origin)           AS distance_origin,
        ST_Distance(t.dest_point, p_dest)               AS distance_dest,
        -- Score: proximidad × backhaul bonus × tier bonus
        (
            1.0 / (1.0
                + ST_Distance(t.origin_point, p_origin) / 1000.0
                + ST_Distance(t.dest_point, p_dest) / 1000.0)
        )
        * CASE WHEN t.direction = 'return' THEN 1.5 ELSE 1.0 END
        * CASE p.driver_tier
            WHEN 'gold'   THEN 1.3
            WHEN 'silver' THEN 1.1
            ELSE 1.0
          END                                           AS match_score,
        EXTRACT(EPOCH FROM (now() - t.created_at)) / 60.0  AS minutes_since
    FROM trips t
    JOIN profiles p ON p.id = t.driver_id
    WHERE t.status = 'published'
      AND t.departure_at > now()
      AND ST_DWithin(t.origin_point, p_origin, p_radius_km * 1000)
      AND ST_DWithin(t.dest_point,   p_dest,   p_radius_km * 1000)
      -- ── Priority Dispatch Window ──
      AND (
          -- Viajes con > 15 min: visibles para todos
          EXTRACT(EPOCH FROM (now() - t.created_at)) / 60.0 >= 15
          -- Viajes con 5-15 min: solo gold y silver
          OR (
              EXTRACT(EPOCH FROM (now() - t.created_at)) / 60.0 >= 5
              AND p_caller_tier IN ('gold', 'silver')
          )
          -- Viajes con < 5 min: solo gold
          OR (
              EXTRACT(EPOCH FROM (now() - t.created_at)) / 60.0 < 5
              AND p_caller_tier = 'gold'
          )
      )
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ────────────────────────────────────────────────────────────
-- 6. HELPER: Incrementar trips_completed al completar viaje
-- ────────────────────────────────────────────────────────────
-- Se dispara cuando un trip pasa a status='completed'

CREATE OR REPLACE FUNCTION increment_trips_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        UPDATE profiles
        SET trips_completed = trips_completed + 1
        WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_completed ON trips;
CREATE TRIGGER trg_trip_completed
    AFTER UPDATE OF status ON trips
    FOR EACH ROW
    EXECUTE FUNCTION increment_trips_completed();
