from rest_framework import serializers
from .models import ChatRoom, Message, ChatRequest
from users.serializers import UserSerializer
try:
    from pets.serializers import PetListSerializer
except ImportError:
    PetListSerializer = None


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'read_status', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer for ChatRoom model."""
    participants = UserSerializer(many=True, read_only=True)
    user_a = UserSerializer(read_only=True)
    user_b = UserSerializer(read_only=True)
    room_id = serializers.CharField(read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'room_id', 'user_a', 'user_b', 'participants', 'participant_ids', 
            'created_at', 'updated_at', 'is_active', 'last_message', 'unread_count'
        ]
        read_only_fields = ['id', 'room_id', 'user_a', 'user_b', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(read_status=False).exclude(sender=request.user).count()
        return 0

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        room = ChatRoom.objects.create(**validated_data)
        if participant_ids:
            room.participants.set(participant_ids)
        return room


class ChatRoomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for chat room lists."""
    participants = serializers.SerializerMethodField()
    user_a = serializers.SerializerMethodField()
    user_b = serializers.SerializerMethodField()
    room_id = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'room_id', 'user_a', 'user_b', 'participants', 'other_participant', 
            'created_at', 'updated_at', 'is_active', 'last_message', 'unread_count'
        ]
    
    def get_participants(self, obj):
        try:
            if hasattr(obj, 'participants'):
                participants = obj.participants.all()
                return UserSerializer(participants, many=True).data
        except Exception as e:
            print(f"Error in get_participants: {e}")
        return []
    
    def get_user_a(self, obj):
        try:
            # Check if the field exists and has a value
            # Use getattr to safely check if attribute exists
            user_a_id = getattr(obj, 'user_a_id', None)
            if user_a_id:
                # Try to access user_a, but handle if it doesn't exist
                try:
                    user_a = getattr(obj, 'user_a', None)
                    if user_a:
                        return UserSerializer(user_a, context=self.context).data
                except Exception as attr_error:
                    # Field might not be loaded, try to get from database
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        user_a = User.objects.get(id=user_a_id)
                        return UserSerializer(user_a, context=self.context).data
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error in get_user_a: {e}")
        return None
    
    def get_user_b(self, obj):
        try:
            # Check if the field exists and has a value
            # Use getattr to safely check if attribute exists
            user_b_id = getattr(obj, 'user_b_id', None)
            if user_b_id:
                # Try to access user_b, but handle if it doesn't exist
                try:
                    user_b = getattr(obj, 'user_b', None)
                    if user_b:
                        return UserSerializer(user_b, context=self.context).data
                except Exception as attr_error:
                    # Field might not be loaded, try to get from database
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        user_b = User.objects.get(id=user_b_id)
                        return UserSerializer(user_b, context=self.context).data
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error in get_user_b: {e}")
        return None
    
    def get_room_id(self, obj):
        try:
            # First try to get existing room_id
            if hasattr(obj, 'room_id') and obj.room_id:
                return str(obj.room_id)
            # Generate room_id if missing but we have user_a and user_b
            if hasattr(obj, 'user_a_id') and hasattr(obj, 'user_b_id') and obj.user_a_id and obj.user_b_id:
                user_ids = sorted([obj.user_a_id, obj.user_b_id])
                return f"{user_ids[0]}_{user_ids[1]}"
            # Try to get from participants if user_a/user_b not available
            if hasattr(obj, 'participants'):
                participants = list(obj.participants.all()[:2])
                if len(participants) == 2:
                    user_ids = sorted([p.id for p in participants])
                    return f"{user_ids[0]}_{user_ids[1]}"
        except Exception as e:
            print(f"Error in get_room_id: {e}")
        return None

    def get_last_message(self, obj):
        try:
            if hasattr(obj, 'messages'):
                last_msg = obj.messages.last()
                if last_msg:
                    sender_name = None
                    if last_msg.sender:
                        sender_name = getattr(last_msg.sender, 'name', None) or getattr(last_msg.sender, 'email', str(last_msg.sender))
                    return {
                        'content': last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content,
                        'created_at': last_msg.created_at.isoformat() if hasattr(last_msg, 'created_at') and last_msg.created_at else None,
                        'sender': sender_name
                    }
        except Exception as e:
            print(f"Error in get_last_message: {e}")
        return None

    def get_unread_count(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user:
                return obj.messages.filter(read_status=False).exclude(sender=request.user).count()
        except Exception:
            pass
        return 0

    def get_other_participant(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user:
                # Try to get from user_a/user_b first (if they exist)
                try:
                    if hasattr(obj, 'user_a_id') and obj.user_a_id:
                        if obj.user_a and obj.user_a.id != request.user.id:
                            return UserSerializer(obj.user_a).data
                except (AttributeError, Exception):
                    pass
                
                try:
                    if hasattr(obj, 'user_b_id') and obj.user_b_id:
                        if obj.user_b and obj.user_b.id != request.user.id:
                            return UserSerializer(obj.user_b).data
                except (AttributeError, Exception):
                    pass
                
                # Fallback to participants
                try:
                    if hasattr(obj, 'participants'):
                        other = obj.participants.exclude(id=request.user.id).first()
                        if other:
                            return UserSerializer(other).data
                except Exception:
                    pass
        except Exception as e:
            print(f"Error in get_other_participant: {e}")
        return None


class ChatRequestSerializer(serializers.ModelSerializer):
    """Serializer for ChatRequest model."""
    requester = UserSerializer(read_only=True)
    target = UserSerializer(read_only=True)
    pet = serializers.SerializerMethodField()
    pet_id = serializers.SerializerMethodField()
    target_id = serializers.IntegerField(write_only=True, required=False)
    requester_id = serializers.IntegerField(write_only=True, required=False)
    room_id = serializers.SerializerMethodField()
    
    def get_pet(self, obj):
        """Get pet object safely."""
        try:
            if hasattr(obj, 'pet') and obj.pet is not None:
                try:
                    if PetListSerializer is not None:
                        return PetListSerializer(obj.pet, context=self.context).data
                    else:
                        # Fallback if PetListSerializer is not available
                        return {
                            'id': obj.pet.id,
                            'name': getattr(obj.pet, 'name', 'Unknown'),
                            'breed': getattr(obj.pet, 'breed', ''),
                        }
                except (ImportError, AttributeError, Exception) as ser_error:
                    # Fallback if PetListSerializer fails
                    print(f"Error using PetListSerializer: {ser_error}")
                    return {
                        'id': obj.pet.id,
                        'name': getattr(obj.pet, 'name', 'Unknown'),
                        'breed': getattr(obj.pet, 'breed', ''),
                    }
        except Exception as e:
            print(f"Error serializing pet in ChatRequest: {e}")
            import traceback
            print(traceback.format_exc())
        return None
    
    def get_pet_id(self, obj):
        """Get pet_id safely."""
        try:
            if hasattr(obj, 'pet') and obj.pet:
                return obj.pet.id
        except Exception as e:
            print(f"Error getting pet_id in ChatRequest: {e}")
        return None
    
    class Meta:
        model = ChatRequest
        fields = [
            'id', 'pet', 'pet_id', 'requester', 'requester_id', 'target', 'target_id',
            'type', 'status', 'message', 'admin_notes', 'created_at', 'updated_at',
            'admin_approved_at', 'user_accepted_at', 'room_id'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'admin_approved_at', 'user_accepted_at'
        ]
    
    def get_room_id(self, obj):
        """Get room_id if chat is active."""
        try:
            if obj.status == 'active':
                # Try to get chat_room relationship (OneToOne)
                try:
                    if hasattr(obj, 'chat_room'):
                        chat_room = getattr(obj, 'chat_room', None)
                        if chat_room:
                            room_id = getattr(chat_room, 'room_id', None)
                            if room_id:
                                return str(room_id)
                except Exception as e:
                    print(f"Error accessing chat_room attribute: {e}")
                    pass
                
                # If chat_room not loaded, try to get it from database
                try:
                    from .models import ChatRoom
                    room = ChatRoom.objects.filter(chat_request=obj).first()
                    if room:
                        room_id = getattr(room, 'room_id', None)
                        if room_id:
                            return str(room_id)
                except Exception as e:
                    print(f"Error querying ChatRoom: {e}")
                    pass
                
                # Generate room_id from requester and target (fallback)
                try:
                    if hasattr(obj, 'requester') and hasattr(obj, 'target'):
                        requester = getattr(obj, 'requester', None)
                        target = getattr(obj, 'target', None)
                        if requester and target and hasattr(requester, 'id') and hasattr(target, 'id'):
                            user_ids = sorted([requester.id, target.id])
                            return f"{user_ids[0]}_{user_ids[1]}"
                except Exception as e:
                    print(f"Error generating room_id from users: {e}")
                    pass
        except Exception as e:
            print(f"Error in get_room_id for ChatRequest: {e}")
            import traceback
            print(traceback.format_exc())
        return None

