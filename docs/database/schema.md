# Database Schema Design

### Entities

1. **`users`**
   - `id`: Integer (PK)
   - `full_name`: String(100)
   - `phone_number`: String(20, Unique)
   - `email`: String(100, Unique, Nullable)
   - `hashed_password`: String(255, Nullable)
   - `role`: Enum ('citizen', 'admin', 'traffic_officer')
   - `driving_license_no`: String(50, Nullable)
   - `preferred_language`: String(10, Default: 'en')
   - `created_at`: DateTime

2. **`violations`**
   - `id`: Integer (PK)
   - `section`: String(50, Unique)
   - `title`: String(200)
   - `description`: Text
   - `category`: String(50)
   - `penalty_amount`: Float
   - `penalty_points`: Integer

3. **`challans`**
   - `id`: Integer (PK)
   - `challan_no`: String(50, Unique)
   - `vehicle_no`: String(20, Indexed)
   - `user_id`: ForeignKey(users.id, Nullable)
   - `violation_id`: ForeignKey(violations.id)
   - `amount`: Float
   - `status`: Enum ('PENDING', 'PAID', 'DISPUTED', 'CANCELLED')
   - `location`: String(255)
   - `issued_at`: DateTime
   - `due_date`: DateTime
   - `paid_at`: DateTime (Nullable)
   - `payment_transaction_id`: String(100, Nullable)

4. **`voice_logs`**
   - `id`: Integer (PK)
   - `user_id`: ForeignKey(users.id, Nullable)
   - `query_text`: Text
   - `response_text`: Text
   - `detected_intent`: String(50)
   - `language`: String(10)
   - `created_at`: DateTime
