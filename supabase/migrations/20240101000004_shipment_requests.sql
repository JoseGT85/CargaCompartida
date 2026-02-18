-- 04_shipment_requests.sql
-- Pedidos de envío creados por clientes (sistema bidireccional)

-- Enum para estado de pedido
DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('open', 'assigned', 'in_transit', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabla de pedidos de envío
CREATE TABLE IF NOT EXISTS shipment_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description     TEXT            NOT NULL,
    weight_kg       INTEGER         NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 3500),
    origin_name     TEXT            NOT NULL,
    origin_point    GEOGRAPHY(POINT, 4326),
    dest_name       TEXT            NOT NULL,
    dest_point      GEOGRAPHY(POINT, 4326),
    budget          NUMERIC(10,2)   CHECK (budget IS NULL OR budget > 0),
    notes           TEXT,
    needed_by       TIMESTAMPTZ,
    status          shipment_status NOT NULL DEFAULT 'open',
    assigned_driver_id UUID         REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shipment_requests_client   ON shipment_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_status   ON shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_driver   ON shipment_requests(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_origin   ON shipment_requests USING GIST(origin_point);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_dest     ON shipment_requests USING GIST(dest_point);

-- Trigger updated_at
CREATE TRIGGER trg_shipment_requests_updated
    BEFORE UPDATE ON shipment_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver pedidos abiertos
CREATE POLICY "Anyone can view open shipments"
    ON shipment_requests FOR SELECT
    USING (status = 'open' OR client_id = auth.uid() OR assigned_driver_id = auth.uid());

-- Solo el cliente dueño puede crear pedidos
CREATE POLICY "Clients can create shipments"
    ON shipment_requests FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Solo el cliente dueño o el chofer asignado pueden actualizar
CREATE POLICY "Owner or assigned driver can update"
    ON shipment_requests FOR UPDATE
    USING (client_id = auth.uid() OR assigned_driver_id = auth.uid());

-- Solo el cliente dueño puede borrar (antes de asignar)
CREATE POLICY "Owner can delete open shipments"
    ON shipment_requests FOR DELETE
    USING (client_id = auth.uid() AND status = 'open');

-- Agregar columnas de documentación a profiles (idempotente)
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dni_front_url TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dni_back_url TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_url TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_insurance_url TEXT;
END $$;
