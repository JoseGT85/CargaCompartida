-- 02_rls.sql
-- Row Level Security (Políticas de seguridad)

-- Habilitar RLS
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_points  ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles: lectura pública" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: editar propio" ON profiles FOR UPDATE USING (auth.uid() = id);

-- VEHICLES
CREATE POLICY "Vehicles: lectura verificados" ON vehicles FOR SELECT USING (is_verified = true OR driver_id = auth.uid());
CREATE POLICY "Vehicles: insertar propio" ON vehicles FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Vehicles: editar propio" ON vehicles FOR UPDATE USING (driver_id = auth.uid());

-- TRIPS
CREATE POLICY "Trips: lectura publicados" ON trips FOR SELECT USING (status IN ('published', 'in_progress', 'completed') OR driver_id = auth.uid());
CREATE POLICY "Trips: insertar propio" ON trips FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Trips: editar propio" ON trips FOR UPDATE USING (driver_id = auth.uid());

-- BOOKINGS
CREATE POLICY "Bookings: ver propios" ON bookings FOR SELECT USING (client_id = auth.uid() OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid()));
CREATE POLICY "Bookings: crear como cliente" ON bookings FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Bookings: actualizar involucrados" ON bookings FOR UPDATE USING (client_id = auth.uid() OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid()));

-- TRACKING
CREATE POLICY "Tracking: insertar propio" ON tracking_points FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Tracking: ver involucrados" ON tracking_points FOR SELECT USING (driver_id = auth.uid() OR trip_id IN (SELECT b.trip_id FROM bookings b WHERE b.client_id = auth.uid()));
