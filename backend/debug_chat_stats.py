import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from chats.models import ChatRequest, ChatRoom
from django.db import connection

print("--- Chat Statistics Debug ---")

# 1. Check ChatRequests
total_requests = ChatRequest.objects.count()
pending_requests = ChatRequest.objects.filter(status='pending').count()
approved_requests = ChatRequest.objects.filter(status__in=['admin_approved', 'active']).count()
rejected_requests = ChatRequest.objects.filter(status='rejected').count()

print(f"ChatRequests:")
print(f"  Total: {total_requests}")
print(f"  Pending: {pending_requests}")
print(f"  Approved/Active: {approved_requests}")
print(f"  Rejected: {rejected_requests}")

# 2. Check ChatRooms
active_chats = ChatRoom.objects.filter(is_active=True).count()
total_chats = ChatRoom.objects.count()

print(f"\nChatRooms:")
print(f"  Total: {total_chats}")
print(f"  Active: {active_chats}")

# 3. Simulate view logic
print("\n--- View Logic Simulation ---")
with connection.cursor() as cursor:
    cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chats_chatroom');")
    table_exists = cursor.fetchone()[0]

print(f"Table 'chats_chatroom' exists: {table_exists}")

data = {
    'pending_requests': pending_requests,
    'active_chats': active_chats if table_exists else 0,
    'total_requests': total_requests,
    'approved_requests': approved_requests,
    'rejected_requests': rejected_requests,
}
print(f"Calculated Stats Payload: {data}")
