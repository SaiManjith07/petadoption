
import os
import django
import sys

# Add project root to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from chats.models import ChatRoom, Message
from django.db.models import Count

def fix_duplicates():
    print("Checking for duplicate chat rooms...")
    
    # specific check for 6_8
    target_room_id = '6_8'
    rooms = ChatRoom.objects.filter(room_id=target_room_id).order_by('-created_at')
    
    count = rooms.count()
    print(f"Found {count} rooms with room_id='{target_room_id}'")
    
    if count > 1:
        print("Duplicates found. analyzing...")
        
        # We want to keep the one with the most messages, or the oldest one if equal? 
        # Usually checking which one has messages is best.
        
        rooms_with_counts = []
        for room in rooms:
            msg_count = room.messages.count()
            rooms_with_counts.append((room, msg_count))
            print(f"Room ID: {room.id}, room_id: {room.room_id}, Messages: {msg_count}, Created: {room.created_at}")
            
        # Sort by message count (descending), then by creation date (descending)
        rooms_with_counts.sort(key=lambda x: (x[1], x[0].created_at), reverse=True)
        
        # Keep the first one
        room_to_keep = rooms_with_counts[0][0]
        print(f"Keeping Room ID: {room_to_keep.id} (Messages: {rooms_with_counts[0][1]})")
        
        # Delete others
        for room, msg_cnt in rooms_with_counts[1:]:
            print(f"Deleting Room ID: {room.id} (Messages: {msg_cnt})...")
            # If the duplicate room has messages, we might want to migrate them first?
            # For safety, let's move messages to the kept room if they are not already there.
            if msg_cnt > 0:
                print(f"  Migrating {msg_cnt} messages from Room {room.id} to Room {room_to_keep.id}...")
                Message.objects.filter(room=room).update(room=room_to_keep)
                
            room.delete()
            print("  Deleted.")
            
        print("Cleanup complete for 6_8.")
    else:
        print("No duplicates found for 6_8.")

    # General check (optional, but good)
    print("\nChecking for other duplicates...")
    duplicates = ChatRoom.objects.values('room_id').annotate(count=Count('id')).filter(count__gt=1)
    
    for entry in duplicates:
        r_id = entry['room_id']
        if r_id == target_room_id: continue # already handled
        
        if not r_id: continue # skip None room_ids
        
        print(f"Found duplicate for {r_id}")
        dup_rooms = ChatRoom.objects.filter(room_id=r_id).order_by('-created_at')
        
        # Logic matches above: keep one with most messages
        rooms_with_counts = []
        for room in dup_rooms:
            msg_count = room.messages.count()
            rooms_with_counts.append((room, msg_count))
            
        rooms_with_counts.sort(key=lambda x: (x[1], x[0].created_at), reverse=True)
        room_to_keep = rooms_with_counts[0][0]
        
        print(f"Keeping Room ID: {room_to_keep.id}")
        
        for room, msg_cnt in rooms_with_counts[1:]:
            if msg_cnt > 0:
                Message.objects.filter(room=room).update(room=room_to_keep)
            room.delete()
            print(f"Deleted duplicate Room ID {room.id}")

if __name__ == '__main__':
    fix_duplicates()
