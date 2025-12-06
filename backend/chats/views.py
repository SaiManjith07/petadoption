from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, ChatRoomListSerializer, MessageSerializer


class ChatRoomListView(generics.ListCreateAPIView):
    """List and create chat rooms."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ChatRoomListSerializer
        return ChatRoomSerializer

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            participants=user,
            is_active=True
        ).prefetch_related('participants', 'messages').distinct()

    def perform_create(self, serializer):
        room = serializer.save()
        # Add current user to participants if not already included
        if self.request.user not in room.participants.all():
            room.participants.add(self.request.user)


class ChatRoomDetailView(generics.RetrieveAPIView):
    """Retrieve a specific chat room."""
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user).prefetch_related('participants', 'messages')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_or_create_room(request, user_id):
    """Get or create a chat room with another user."""
    try:
        from users.models import User
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'message': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if other_user == request.user:
        return Response(
            {'message': 'Cannot create room with yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Try to find existing room
    room = ChatRoom.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user
    ).distinct().first()

    if not room:
        # Create new room
        room = ChatRoom.objects.create()
        room.participants.add(request.user, other_user)

    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data)


class MessageListView(generics.ListCreateAPIView):
    """List and create messages for a chat room."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Verify user is a participant
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
        except ChatRoom.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(room=room).select_related('sender')

    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
        except ChatRoom.DoesNotExist:
            raise PermissionError("You don't have permission to send messages to this room.")
        
        serializer.save(sender=self.request.user, room=room)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """Send a message to a chat room."""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
    except ChatRoom.DoesNotExist:
        return Response(
            {'message': 'Room not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get('content', '').strip()
    if not content:
        return Response(
            {'message': 'Message content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = Message.objects.create(
        room=room,
        sender=request.user,
        content=content
    )

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, room_id):
    """Mark all messages in a room as read."""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
    except ChatRoom.DoesNotExist:
        return Response(
            {'message': 'Room not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    Message.objects.filter(
        room=room
    ).exclude(
        sender=request.user
    ).update(read_status=True)

    return Response({'message': 'Messages marked as read'}, status=status.HTTP_200_OK)

