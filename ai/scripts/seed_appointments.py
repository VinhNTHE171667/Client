"""
Seed sample appointment data for ML training.
Generates realistic appointment + appointment_detail records based on existing services/customers/doctors.
"""
import pymysql
import uuid
from datetime import datetime, timedelta
import random
import os

# MySQL config
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", 33306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "gen_spa"),
    "charset": "utf8mb4",
}


def connect_db():
    return pymysql.connect(**DB_CONFIG)


def fetch_existing_ids(conn):
    """Fetch existing customer, doctor, service IDs"""
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM customer WHERE deletedAt IS NULL LIMIT 100")
    customers = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id FROM doctor WHERE deletedAt IS NULL LIMIT 20")
    doctors = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id, price FROM service WHERE deletedAt IS NULL LIMIT 50")
    services = cur.fetchall()  # [(id, price), ...]
    
    cur.close()
    return customers, doctors, services


def generate_appointments(conn, num_appointments=5000):
    """Generate appointments spanning last 365 days"""
    customers, doctors, services = fetch_existing_ids(conn)
    
    if not customers or not doctors or not services:
        print("❌ Not enough existing data (customers/doctors/services). Please seed those first.")
        return
    
    print(f"📊 Found {len(customers)} customers, {len(doctors)} doctors, {len(services)} services")
    print(f"🔄 Generating {num_appointments} appointments...")
    
    cur = conn.cursor()
    
    # Date range: last 365 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    statuses = ["completed", "completed", "completed", "paid", "cancelled"]  # bias towards completed
    appointment_types = ["online", "offline"]
    payment_methods = ["cash", "card", "momo", "zalopay"]
    
    batch_appointments = []
    batch_details = []
    
    for i in range(num_appointments):
        appt_id = str(uuid.uuid4())
        customer_id = random.choice(customers)
        doctor_id = random.choice(doctors)
        
        # Random date in past year
        days_ago = random.randint(0, 365)
        appt_date = end_date - timedelta(days=days_ago)
        start_time = appt_date.replace(hour=random.randint(8, 18), minute=random.choice([0, 30]))
        end_time = start_time + timedelta(hours=random.randint(1, 3))
        
        status = random.choice(statuses)
        appt_type = random.choice(appointment_types)
        payment_method = random.choice(payment_methods)
        
        # Select 1-3 services per appointment (basket)
        num_services = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        selected_services = random.sample(services, min(num_services, len(services)))
        
        total_amount = sum(svc[1] for svc in selected_services)
        deposit_amount = total_amount * 0.3 if status in ["deposited", "paid", "completed"] else 0
        
        batch_appointments.append((
            appt_id, customer_id, doctor_id, None,  # staffId
            appt_date, status, appt_date, appt_date, None,  # createdAt, updatedAt, deletedAt
            None,  # voucherId
            None if status != "cancelled" else appt_date,  # cancelledAt
            None,  # cancelReason
            None,  # rejectionReason
            start_time, end_time,
            f"Auto-generated appointment {i+1}",  # note
            random.randint(100000, 999999),  # orderCode
            appt_type, payment_method, total_amount, deposit_amount,
            1 if status == "completed" else 0  # isFeedbackGiven
        ))
        
        # appointment_detail
        for svc_id, svc_price in selected_services:
            detail_id = str(uuid.uuid4())
            quantity = 1
            batch_details.append((detail_id, appt_id, svc_id, quantity, svc_price))
    
    # Bulk insert appointments
    insert_appt_sql = """
        INSERT INTO appointment (
            id, customerId, doctorId, staffId, appointment_date, status,
            createdAt, updatedAt, deletedAt, voucherId, cancelledAt, cancelReason,
            rejectionReason, startTime, endTime, note, orderCode, appointmentType,
            paymentMethod, totalAmount, depositAmount, isFeedbackGiven
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cur.executemany(insert_appt_sql, batch_appointments)
    
    # Bulk insert appointment_detail
    insert_detail_sql = """
        INSERT INTO appointment_detail (id, appointmentId, serviceId, quantity, price)
        VALUES (%s, %s, %s, %s, %s)
    """
    cur.executemany(insert_detail_sql, batch_details)
    
    conn.commit()
    cur.close()
    
    print(f"✅ Inserted {len(batch_appointments)} appointments and {len(batch_details)} appointment details")


def main():
    print("🚀 Starting appointment data seeding...")
    conn = connect_db()
    try:
        generate_appointments(conn, num_appointments=5000)
        print("✅ Seed completed successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
