import os
import django
import sys
from django.db import connection

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from chats.models import ChatRequest, ChatRoom

print("--- Chat Statistics Debug ---")

# 1. Check Table Existence (The content of the fix)
all_tables = connection.introspection.table_names()
table_exists = 'chats_chatroom' in all_tables
print(f"Table 'chats_chatroom' exists: {table_exists}")

# 2. Check ChatRequests
total_requests = ChatRequest.objects.count()
pending_requests = ChatRequest.objects.filter(status='pending').count()
approved_requests = ChatRequest.objects.filter(status__in=['admin_approved', 'active']).count()
rejected_requests = ChatRequest.objects.filter(status='rejected').count()

print(f"\nChatRequests:")
print(f"  Total: {total_requests}")
print(f"  Pending: {pending_requests}")
print(f"  Approved/Active: {approved_requests}")
print(f"  Rejected: {rejected_requests}")

# 3. Check ChatRooms
if table_exists:
    active_chats = ChatRoom.objects.filter(is_active=True).count()
    total_chats = ChatRoom.objects.count()
    print(f"\nChatRooms:")
    print(f"  Total: {total_chats}")
    print(f"  Active: {active_chats}")
else:
    print("\nChatRooms table does not exist.")
    active_chats = 0

data = {
    'pending_requests': pending_requests,
    'active_chats': active_chats,
    'total_requests': total_requests,
    'approved_requests': approved_requests,
    'rejected_requests': rejected_requests,
}
print(f"\nCalculated Stats Payload: {data}")
