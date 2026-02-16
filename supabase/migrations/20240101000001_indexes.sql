-- 01_indexes.sql
-- Índices para optimizar consultas

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_kyc  ON profiles(kyc_status);

-- Vehicles
CREATE INDEX idx_vehicles_driver   ON vehicles(driver_id);
CREATE INDEX idx_vehicles_capacity ON vehicles(capacity_kg);

-- Trips
CREATE INDEX idx_trips_origin_geo  ON trips USING GIST (origin_point);
CREATE INDEX idx_trips_dest_geo    ON trips USING GIST (dest_point);
CREATE INDEX idx_trips_route_geo   ON trips USING GIST (route_line);
CREATE INDEX idx_trips_status      ON trips(status);
CREATE INDEX idx_trips_direction   ON trips(direction);
CREATE INDEX idx_trips_departure   ON trips(departure_at);
CREATE INDEX idx_trips_driver      ON trips(driver_id);

-- Bookings
CREATE INDEX idx_bookings_trip     ON bookings(trip_id);
CREATE INDEX idx_bookings_client   ON bookings(client_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_payment  ON bookings(payment_status);

-- Tracking
CREATE INDEX idx_tracking_trip_time ON tracking_points(trip_id, recorded_at);
CREATE INDEX idx_tracking_geo       ON tracking_points USING GIST (point);
