import re
from datetime import datetime

def format_currency(amount: float) -> str:
    return f"₹{amount:,.2f}"

def format_date(dt: datetime) -> str:
    return dt.strftime("%d %b %Y, %I:%M %p") if dt else "N/A"

def clean_vehicle_number(vehicle_no: str) -> str:
    return re.sub(r'[^A-Za-z0-9]', '', vehicle_no).upper()
