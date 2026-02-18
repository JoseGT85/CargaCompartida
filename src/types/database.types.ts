/**
 * Tipos TypeScript generados manualmente a partir de schema.sql.
 * CargaCompartida — Base de datos PostgreSQL (Supabase).
 *
 * IMPORTANTE: Estos tipos deben mantenerse sincronizados con schema.sql.
 * En producción, usar `supabase gen types typescript` para regenerarlos.
 */

// ────────────────────────────────────────────────────────────────
// Enums (corresponden a los CREATE TYPE del schema.sql)
// ────────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'driver' | 'admin';
export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type TripDirection = 'outbound' | 'return';
export type TripStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
export type BookingStatus = 'requested' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'escrow' | 'released' | 'refunded' | 'failed';
export type VehicleType = 'sedan' | 'pickup' | 'van' | 'suv' | 'utilitario';
export type ShipmentStatus = 'open' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';

// ────────────────────────────────────────────────────────────────
// Interfaces de tablas
// ────────────────────────────────────────────────────────────────

/** Perfil extendido de usuario (extiende auth.users de Supabase) */
export interface Profile {
    id: string;
    role: UserRole;
    full_name: string;
    phone: string;
    cuit_cuil: string | null;
    avatar_url: string | null;
    /** URL del frente del DNI (solo choferes) */
    dni_front_url: string | null;
    /** URL del dorso del DNI (solo choferes) */
    dni_back_url: string | null;
    /** URL de la licencia de conducir (solo choferes) */
    license_url: string | null;
    /** URL del seguro del vehículo (solo choferes) */
    vehicle_insurance_url: string | null;
    kyc_status: KycStatus;
    kyc_submitted_at: string | null;
    rating_avg: number;
    rating_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Vehículo registrado por un chofer.
 * HARD CONSTRAINT: capacity_kg <= 3500 (Restricción Anti-Sindicato, Ley 24.653)
 */
export interface Vehicle {
    id: string;
    driver_id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    vehicle_type: VehicleType;
    /** Capacidad máxima en kg. NUNCA puede superar 3500. */
    capacity_kg: number;
    volume_m3: number | null;
    photo_url: string | null;
    insurance_url: string | null;
    vtv_expiry: string | null;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Punto geográfico PostGIS serializado */
export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

/** Viaje publicado por un chofer */
export interface Trip {
    id: string;
    driver_id: string;
    vehicle_id: string;
    origin_name: string;
    origin_point: string; // PostGIS GEOGRAPHY serializado
    dest_name: string;
    dest_point: string;
    route_line: string | null;
    /** 'outbound' o 'return' — backhaul priority aplica ×1.5 a 'return' */
    direction: TripDirection;
    departure_at: string;
    estimated_arrival: string | null;
    distance_km: number | null;
    available_kg: number;
    available_m3: number | null;
    price_per_kg: number;
    notes: string | null;
    status: TripStatus;
    waypoints: Record<string, unknown>[];
    created_at: string;
    updated_at: string;
}

/** Reserva de carga en un viaje */
export interface Booking {
    id: string;
    trip_id: string;
    client_id: string;
    description: string;
    weight_kg: number;
    volume_m3: number | null;
    pickup_point: string;
    pickup_address: string;
    dropoff_point: string;
    dropoff_address: string;
    status: BookingStatus;
    status_history: { status: string; timestamp: string; note?: string }[];
    agreed_price: number;
    platform_fee: number;
    payment_status: PaymentStatus;
    paid_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    driver_confirmed: boolean;
    client_confirmed: boolean;
    driver_rating: number | null;
    client_rating: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Punto de tracking GPS.
 * Soporta modo offline: cuando is_offline = true, el punto fue
 * registrado sin conexión (zonas de montaña) y sincronizado después.
 */
export interface TrackingPoint {
    id: string;
    trip_id: string;
    driver_id: string;
    point: string;
    speed_kmh: number | null;
    heading: number | null;
    accuracy_m: number | null;
    /** Timestamp del dispositivo (puede ser offline) */
    recorded_at: string;
    /** Cuándo llegó al server */
    synced_at: string;
    /** TRUE si fue registrado offline (Ruta 7/40, zonas de montaña) */
    is_offline: boolean;
    created_at: string;
}

/** Pedido de envío creado por un cliente */
export interface ShipmentRequest {
    id: string;
    client_id: string;
    description: string;
    weight_kg: number;
    origin_name: string;
    origin_point: string | null;
    dest_name: string;
    dest_point: string | null;
    budget: number | null;
    notes: string | null;
    needed_by: string | null;
    status: ShipmentStatus;
    assigned_driver_id: string | null;
    created_at: string;
    updated_at: string;
}

// ────────────────────────────────────────────────────────────────
// Tipo Database para Supabase Client
// ────────────────────────────────────────────────────────────────

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at' | 'rating_avg' | 'rating_count'> & {
                    rating_avg?: number;
                    rating_count?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            vehicles: {
                Row: Vehicle;
                Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'is_verified'> & {
                    id?: string;
                    is_verified?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Vehicle, 'id' | 'created_at'>>;
            };
            trips: {
                Row: Trip;
                Insert: Omit<Trip, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Trip, 'id' | 'created_at'>>;
            };
            bookings: {
                Row: Booking;
                Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
            };
            tracking_points: {
                Row: TrackingPoint;
                Insert: Omit<TrackingPoint, 'id' | 'created_at' | 'synced_at'> & {
                    id?: string;
                    synced_at?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<TrackingPoint, 'id' | 'created_at'>>;
            };
            shipment_requests: {
                Row: ShipmentRequest;
                Insert: Omit<ShipmentRequest, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<ShipmentRequest, 'id' | 'created_at'>>;
            };
        };
        Enums: {
            user_role: UserRole;
            kyc_status: KycStatus;
            trip_direction: TripDirection;
            trip_status: TripStatus;
            booking_status: BookingStatus;
            payment_status: PaymentStatus;
            vehicle_type: VehicleType;
            shipment_status: ShipmentStatus;
        };
    };
}
