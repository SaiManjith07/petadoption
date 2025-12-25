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
    image_url = serializers.SerializerMethodField()
    message_type = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'content', 'message_type', 
            'image', 'image_url', 'cloudinary_url', 'cloudinary_public_id',
            'is_deleted', 'deleted_at', 'read_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'deleted_at']
        extra_kwargs = {
            'cloudinary_url': {'required': False, 'allow_null': True},
            'cloudinary_public_id': {'required': False, 'allow_null': True},
        }
    
    def get_image(self, obj):
        """Get image field safely."""
        try:
            if hasattr(obj, 'image'):
                image_value = getattr(obj, 'image', None)
                if image_value:
                    return str(image_value)
        except Exception:
            pass
        return None
    
    def get_is_deleted(self, obj):
        """Get is_deleted field safely."""
        try:
            return getattr(obj, 'is_deleted', False)
        except Exception:
            return False
    
    def get_message_type(self, obj):
        """Get message_type safely, defaulting to 'text' if column doesn't exist."""
        try:
            # First try to get message_type directly
            if hasattr(obj, 'message_type'):
                try:
                    return obj.message_type
                except Exception:
                    pass
            # Check if it's an image message (only if image field exists)
            try:
                if hasattr(obj, 'image'):
                    image_value = getattr(obj, 'image', None)
                    if image_value:
                        return 'image'
            except Exception:
                pass
            return 'text'
        except Exception:
            return 'text'
    
    def get_image_url(self, obj):
        """Get full URL for image - ONLY from Cloudinary."""
        try:
            # Check if is_deleted exists and is False
            is_deleted = getattr(obj, 'is_deleted', False)
            if is_deleted:
                return None
            
            # Priority 1: Use Cloudinary URL (primary storage method)
            # Safely check if cloudinary_url exists (column might not exist if migration not run)
            try:
                if hasattr(obj, 'cloudinary_url'):
                    cloudinary_url = getattr(obj, 'cloudinary_url', None)
                    if cloudinary_url:
                        return cloudinary_url
            except Exception:
                # Column doesn't exist yet, skip Cloudinary URL
                pass
            
            # Fallback: Use local image URL if Cloudinary not available
            if hasattr(obj, 'image'):
                image_value = getattr(obj, 'image', None)
                if image_value:
                    try:
                        # Try to get the URL safely
                        if hasattr(image_value, 'url'):
                            image_url = image_value.url
                        else:
                            image_url = str(image_value)
                        request = self.context.get('request')
                        
                        # Always prefer BACKEND_URL from settings for consistency
                        from django.conf import settings
                        base_url = getattr(settings, 'BACKEND_URL', None)
                        
                        # If BACKEND_URL is set, use it (production)
                        if base_url and base_url != 'http://127.0.0.1:8000':
                            if not image_url.startswith('/'):
                                image_url = '/' + image_url
                            if base_url.endswith('/'):
                                base_url = base_url.rstrip('/')
                            return f"{base_url}{image_url}"
                        
                        # Fallback to request.build_absolute_uri if available
                        if request:
                            return request.build_absolute_uri(image_url)
                        
                        # If already a full URL, return as is
                        if image_url.startswith('http://') or image_url.startswith('https://'):
                            return image_url
                        
                        # Last resort: return relative URL (will be fixed by frontend)
                        return image_url
                    except (AttributeError, Exception) as url_error:
                        pass
        except Exception:
            pass
        return None


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
        try:
            last_msg = obj.messages.last()
            if last_msg:
                return MessageSerializer(last_msg, context=self.context).data
        except Exception:
            pass
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
    pet_id = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    verified_by_admin_id = serializers.SerializerMethodField()
    chat_request = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'room_id', 'user_a', 'user_b', 'participants', 'other_participant', 
            'created_at', 'updated_at', 'is_active', 'last_message', 'unread_count',
            'pet_id', 'type', 'verified_by_admin_id', 'chat_request'
        ]
    
    def get_participants(self, obj):
        try:
            if hasattr(obj, 'participants'):
                participants = obj.participants.all()
                return UserSerializer(participants, many=True).data
        except Exception:
            pass
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
        except Exception:
            pass
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
        except Exception:
            pass
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
        except Exception:
            pass
        return None

    def get_last_message(self, obj):
        try:
            if hasattr(obj, 'messages'):
                # Use values() to avoid loading full Message objects and accessing fields that might not exist
                # Only select fields that definitely exist
                last_msg_data = obj.messages.values('id', 'content', 'created_at', 'sender_id').order_by('-created_at').first()
                if last_msg_data:
                    sender_name = None
                    if last_msg_data.get('sender_id'):
                        try:
                            from django.contrib.auth import get_user_model
                            User = get_user_model()
                            sender = User.objects.get(id=last_msg_data['sender_id'])
                            sender_name = getattr(sender, 'name', None) or getattr(sender, 'email', str(sender))
                        except Exception:
                            sender_name = f"User {last_msg_data['sender_id']}"
                    content = last_msg_data.get('content', '')
                    created_at = last_msg_data.get('created_at')
                    return {
                        'content': content[:50] + '...' if len(content) > 50 else content,
                        'created_at': created_at.isoformat() if created_at else None,
                        'sender': sender_name
                    }
        except Exception:
            pass
        return None

    def get_unread_count(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user:
                # Use values() to avoid loading full Message objects
                return obj.messages.filter(read_status=False).exclude(sender_id=request.user.id).count()
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
        except Exception:
            pass
        return None
    
    def get_pet_id(self, obj):
        """Get pet ID from chat_request if available."""
        try:
            if hasattr(obj, 'chat_request') and obj.chat_request:
                chat_request = obj.chat_request
                if hasattr(chat_request, 'pet') and chat_request.pet:
                    return chat_request.pet.id
        except Exception:
            pass
        return None
    
    def get_type(self, obj):
        """Get chat type from chat_request if available. For direct admin-created rooms (no chat_request), return 'normal'."""
        try:
            # Check if this is a direct chat room (no chat_request) - admin-created communication
            if not hasattr(obj, 'chat_request') or not obj.chat_request:
                # This is a direct communication room created by admin (no pet, no request)
                return 'normal'
            
            # If there's a chat_request, get type from it
            chat_request = obj.chat_request
            if hasattr(chat_request, 'type') and chat_request.type:
                return chat_request.type
        except Exception:
            pass
        # Default to 'normal' for direct communication
        return 'normal'
    
    def get_verified_by_admin_id(self, obj):
        """Get verified_by_admin ID from chat_request if available."""
        try:
            if hasattr(obj, 'chat_request') and obj.chat_request:
                chat_request = obj.chat_request
                if hasattr(chat_request, 'verified_by_admin') and chat_request.verified_by_admin:
                    return chat_request.verified_by_admin.id
        except Exception:
            pass
        return None
    
    def get_chat_request(self, obj):
        """Get chat_request data if available."""
        try:
            if hasattr(obj, 'chat_request') and obj.chat_request:
                return ChatRequestSerializer(obj.chat_request, context=self.context).data
        except Exception:
            pass
        return None


class ChatRequestSerializer(serializers.ModelSerializer):
    """Serializer for ChatRequest model."""
    requester = UserSerializer(read_only=True)
    target = UserSerializer(read_only=True, allow_null=True)
    verified_by_admin = UserSerializer(read_only=True, allow_null=True)
    pet = serializers.SerializerMethodField()
    pet_id = serializers.IntegerField(read_only=True, allow_null=True)
    target_id = serializers.SerializerMethodField()
    requester_id = serializers.IntegerField(write_only=True, required=False)
    room_id = serializers.SerializerMethodField()
    admin_verification_room = serializers.SerializerMethodField()
    final_chat_room = serializers.SerializerMethodField()
    
    def get_admin_verification_room(self, obj):
        """Get admin_verification_room safely."""
        try:
            if hasattr(obj, 'admin_verification_room') and obj.admin_verification_room:
                return ChatRoomSerializer(obj.admin_verification_room, context=self.context).data
        except Exception:
            pass
        return None
    
    def get_final_chat_room(self, obj):
        """Get final_chat_room safely."""
        try:
            if hasattr(obj, 'final_chat_room') and obj.final_chat_room:
                return ChatRoomSerializer(obj.final_chat_room, context=self.context).data
        except Exception:
            pass
        return None
    
    def get_target_id(self, obj):
        """Get target_id safely."""
        try:
            if hasattr(obj, 'target') and obj.target:
                return obj.target.id
            # Try to extract from admin_notes if target is null
            if hasattr(obj, 'admin_notes') and obj.admin_notes:
                import re
                match = re.search(r'Target user ID: (\d+)', obj.admin_notes)
                if match:
                    return int(match.group(1))
        except Exception:
            pass
        return None
    
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
                except (ImportError, AttributeError, Exception):
                    # Fallback if PetListSerializer fails
                    return {
                        'id': obj.pet.id,
                        'name': getattr(obj.pet, 'name', 'Unknown'),
                        'breed': getattr(obj.pet, 'breed', ''),
                    }
        except Exception:
            pass
        return None
    
    
    class Meta:
        model = ChatRequest
        fields = [
            'id', 'pet', 'pet_id', 'requester', 'requester_id', 'target', 'target_id',
            'type', 'status', 'message', 'admin_notes', 'created_at', 'updated_at',
            'admin_approved_at', 'user_accepted_at', 'room_id', 'admin_verification_room', 'final_chat_room',
            'verified_by_admin'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'admin_approved_at', 'user_accepted_at', 'target_id'
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
                                return str(room_id)
                except Exception:
                    pass
                
                # If chat_room not loaded, try to get it from database
                try:
                    from .models import ChatRoom
                    room = ChatRoom.objects.filter(chat_request=obj).first()
                    if room:
                        room_id = getattr(room, 'room_id', None)
                        if room_id:
                            return str(room_id)
                        if room_id:
                            return str(room_id)
                except Exception:
                    pass
                
                # Generate room_id from requester and target (fallback)
                try:
                    if hasattr(obj, 'requester') and hasattr(obj, 'target'):
                        requester = getattr(obj, 'requester', None)
                        target = getattr(obj, 'target', None)
                        if requester and target and hasattr(requester, 'id') and hasattr(target, 'id'):
                            user_ids = sorted([requester.id, target.id])
                            return f"{user_ids[0]}_{user_ids[1]}"
                            user_ids = sorted([requester.id, target.id])
                            return f"{user_ids[0]}_{user_ids[1]}"
                except Exception:
                    pass
        except Exception:
            pass
        return None

