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
- CANCELLED
- CLOSED

## 3. Business Rules
- Add job:
  - `work_order` wajib unik.
  - Kombinasi `work_center + planned_start_time` tidak boleh duplikat terhadap job yang masih aktif. Job dengan state `CANCELLED`, `COMPLETED`, dan `CLOSED` tidak dianggap bentrok.
  - `job_lifecycle_state` selalu di-set ke `SCHEDULED` saat create.
  - `scheduled_date` otomatis diisi saat job dibuat.
- Edit job:
  - Hanya boleh jika state saat ini `SCHEDULED`.
- Delete job:
  - Hanya boleh jika state saat ini `SCHEDULED`.
- Release job:
  - Hanya dari `SCHEDULED` -> `RELEASED`.
  - `release_date` otomatis diisi saat endpoint release dipanggil.
- Run job:
  - Hanya dari `RELEASED` -> `RUNNING`.
  - `run_date` otomatis diisi saat endpoint run dipanggil.
- Suspend job:
  - Hanya dari `RELEASED` atau `RUNNING` -> `SUSPENDED`.
  - `suspend_date` otomatis diisi saat endpoint suspend dipanggil.
- Complete job:
  - Hanya dari `RUNNING` atau `SUSPENDED` -> `COMPLETED`.
  - `complete_date` otomatis diisi saat endpoint complete dipanggil.
- Cancel job:
  - Hanya dari `SCHEDULED`, `RELEASED`, `RUNNING`, atau `SUSPENDED` -> `CANCELLED`.
  - `cancel_date` otomatis diisi saat endpoint cancel dipanggil.
- Close job:
  - Hanya dari `RELEASED`, `COMPLETED`, atau `CANCELLED` -> `CLOSED`.
  - `close_date` otomatis diisi saat endpoint close dipanggil.

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
- `PATCH /:id/cancel` : Cancel job
- `PATCH /:id/close` : Close job

### Upload Preview Response
`POST /excel/upload-preview` akan mengembalikan:
- `data.unpopulated`: payload valid siap kirim ke `POST /batch-create`
- `data.populated`: payload valid dengan field lookup dipopulate object lookup untuk kebutuhan review/view

## 5. Data Model
Entity disimpan di table `Job_Offset_Printer_Taiyo` dengan kolom utama:
- `id` (UUID)
- `work_order` (unique)
- `sales_order`
- `quantity_order`
- `quantity_unit` (lookup: QUANTITY_UNIT)
- `work_center` (lookup: WORK_CENTER)
- `planned_start_time`
- `scheduled_date`
- `release_date`
- `run_date`
- `suspend_date`
- `complete_date`
- `cancel_date`
- `close_date`
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
