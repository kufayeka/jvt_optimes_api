# Lookup Service FRD

## 1. Overview
Service ini menangani REST API untuk master data lookup yang dipakai lintas modul.

## 2. Functional Requirements

### FR-LKP-001: List Lookup
- Mengembalikan semua lookup.
- Mendukung filter opsional query `type` (`lookup_type`).

### FR-LKP-002: Get Lookup By ID
- Mengembalikan detail lookup berdasarkan `id`.
- `id` harus integer positif.
- Return `404` jika data tidak ditemukan.

### FR-LKP-003: Create Lookup
- Membuat lookup baru.
- Field wajib: `lookup_type`, `code`, `label`.
- Validasi panjang field:
  - `lookup_type` max 100
  - `code` max 50
  - `label` max 100

### FR-LKP-004: Update Lookup
- Mengubah data lookup berdasarkan `id`.
- Body minimal harus berisi satu field.
- `id` harus integer positif.
- Return `404` jika data tidak ditemukan.

### FR-LKP-005: Activate/Deactivate Lookup
- Mengubah status aktif lookup lewat `is_active` (boolean).
- `id` harus integer positif.
- Return `404` jika data tidak ditemukan.

### FR-LKP-006: Delete Lookup By ID
- Menghapus lookup berdasarkan `id`.
- `id` harus integer positif.
- Return `404` jika data tidak ditemukan.

## 3. Endpoints
Base path: `/api/lookups`

- `GET /` : List lookup (`?type=ACCOUNT_LIFECYCLE`)
- `GET /:id` : Get lookup by id
- `POST /` : Create lookup
- `PUT /:id` : Update lookup
- `PATCH /:id/activate` : Activate/deactivate lookup
- `DELETE /:id` : Delete lookup by id

## 4. Data Model
Entity disimpan di table `Lookup` dengan kolom utama:
- `id` (integer, primary key)
- `lookup_type` (varchar(100))
- `code` (varchar(50))
- `label` (varchar(100))
- `description` (text, nullable)
- `sort_order` (integer, nullable)
- `is_active` (boolean)
- `attribute` (jsonb, nullable)

## 5. Validation Rules
- `id` harus integer positif.
- `lookup_type`, `code`, `label` mengikuti batas panjang field.
- `is_active` wajib boolean untuk endpoint activate/deactivate.
- Update tidak boleh body kosong.

## 6. Error Handling
- `200`: Success
- `201`: Created
- `400`: Validation failed
- `404`: Lookup not found
