# Database Schema Specification 🗄️

The database is built on PostgreSQL 16 (with SQLite support for local rapid testing) managed via SQLAlchemy 2.0 ORM and Alembic migrations.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ CHALLANS : "receives"
    USERS ||--o{ OTP_VERIFICATIONS : "requests"
    USERS ||--o{ VOICE_LOGS : "records"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    TRAFFIC_RULES ||--o{ CHALLANS : "governs"
    CHALLANS ||--|| QR_REFERENCES : "bound to"

    USERS {
        int id PK
        string full_name
        string phone_number UK
        string email
        string driving_license_no
        enum role "CITIZEN, ADMIN, OFFICER"
        string hashed_password
        string preferred_language "en, ur, ps"
        boolean is_active
        datetime created_at
    }

    CHALLANS {
        int id PK
        string challan_no UK
        string vehicle_no
        string vehicle_type
        int user_id FK
        int rule_id FK
        numeric amount
        numeric late_fee
        enum status "PENDING, PAID, DISPUTED, CANCELLED, OVERDUE"
        string location
        string city
        string evidence_image_url
        datetime issued_at
        datetime due_date
        datetime paid_at
        string payment_method
        string payment_transaction_id
    }

    QR_REFERENCES {
        int id PK
        string qr_token UK
        int challan_id FK,UK
        text payload_data
        int scan_count
        datetime last_scanned_at
        boolean is_revoked
        datetime expires_at
        datetime created_at
    }

    TRAFFIC_RULES {
        int id PK
        string section UK
        string title
        string category
        text description
        numeric base_fine
        int demerit_points
        string legal_act
        boolean is_active
    }

    OTP_VERIFICATIONS {
        int id PK
        string phone_number
        string otp_hash
        datetime expires_at
        int attempts
        boolean is_used
        datetime created_at
    }

    VOICE_LOGS {
        int id PK
        int user_id FK
        text query_text
        text response_text
        string language
        string intent
        boolean is_grounded
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string resource
        string ip_address
        datetime created_at
    }
```
