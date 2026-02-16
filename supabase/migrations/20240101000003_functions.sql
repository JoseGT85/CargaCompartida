-- 03_triggers_functions.sql
-- Triggers y Funciones RPC

-- 1. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated     BEFORE UPDATE ON trips    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Create Profile on User SignUp
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Search Trips Nearby (Backhaul Priority)
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
    distance_origin DOUBLE PRECISION,
    distance_dest   DOUBLE PRECISION,
    match_score     DOUBLE PRECISION
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
