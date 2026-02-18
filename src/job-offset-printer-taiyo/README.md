# Job Offset Printer Taiyo Service FRD

## 1. Overview
Service ini menangani REST API untuk job produksi mesin offset printer Taiyo.

## 2. Job Lifecycle
State yang digunakan:
- SCHEDULED
- RELEASED
- RUNNING
- SUSPENDED
- COMPLETED
- CLOSED

Lookup yang juga disediakan: CANCELLED (untuk kebutuhan ke depan).

## 3. Business Rules
- Add job:
  - `work_order` wajib unik.
  - Kombinasi `work_center + planned_start_time` tidak boleh duplikat.
  - `job_lifecycle_state` selalu di-set ke `SCHEDULED` saat create.
- Edit job:
  - Hanya boleh jika state saat ini `SCHEDULED`.
- Delete job:
  - Hanya boleh jika state saat ini `SCHEDULED`.
- Release job:
  - Hanya dari `SCHEDULED` -> `RELEASED`.
- Run job:
  - Hanya dari `RELEASED` -> `RUNNING`.
- Suspend job:
  - Hanya dari `RELEASED` atau `RUNNING` -> `SUSPENDED`.
- Complete job:
  - Hanya dari `RUNNING` atau `SUSPENDED` -> `COMPLETED`.
- Close job:
  - Hanya dari `RELEASED` atau `COMPLETED` -> `CLOSED`.

## 4. Endpoints
Base path: `/api/jobs/offset-printer-taiyo`

- `GET /` : List jobs
- `GET /:id` : Get job by id
- `POST /` : Create job
- `PUT /:id` : Edit job (only SCHEDULED)
- `DELETE /:id` : Delete job (only SCHEDULED)
- `PATCH /:id/release` : Release job
- `PATCH /:id/run` : Run job
- `PATCH /:id/suspend` : Suspend job
- `PATCH /:id/complete` : Complete job
- `PATCH /:id/close` : Close job

## 5. Data Model
Entity disimpan di table `Job_Offset_Printer_Taiyo` dengan kolom utama:
- `id` (UUID)
- `work_order` (unique)
- `sales_order`
- `quantity_order`
- `quantity_unit` (lookup: QUANTITY_UNIT)
- `work_center` (lookup: WORK_CENTER)
- `planned_start_time`
- `release_date`
- `due_date`
- `job_priority` (lookup: JOB_PRIORITY)
- `job_lifecycle_state` (lookup: JOB_LIFECYCLE_STATE)
- `notes`
- `attribute` (JSONB)

## 6. Lookup Requirements
Wajib tersedia pada table `Lookup`:
- `JOB_PRIORITY`: HIGH, MEDIUM, LOW
- `JOB_LIFECYCLE_STATE`: SCHEDULED, RELEASED, RUNNING, SUSPENDED, COMPLETED, CANCELLED, CLOSED
- `QUANTITY_UNIT`: BK, EA
- `WORK_CENTER`: MACHINE_A, MACHINE_B
