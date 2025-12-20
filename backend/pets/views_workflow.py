from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, F
from .models import Pet
from users.models import User, Volunteer, Shelter
from users.serializers import ShelterSerializer, VolunteerSerializer
from chats.models import ChatRoom
from notifications.models import Notification


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def found_pet_workflow(request, pet_id):
    """
    Handle found pet workflow with decision points:
    1. Check if user is volunteer
    2. Ask for shelter provision
    3. Suggest nearby shelters
    4. Match with nearby volunteers
    """
    try:
        pet = Pet.objects.get(id=pet_id, posted_by=request.user, adoption_status='Found')
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found or you are not authorized'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    action = request.data.get('action')  # 'provide_shelter', 'suggest_shelter', 'match_volunteers', 'move_to_shelter'
    
    if action == 'provide_shelter':
        # User (volunteer) wants to provide shelter
        if user.is_volunteer and user.volunteer_verified:
            volunteer = user.volunteer_profile
            if volunteer.can_provide_shelter and volunteer.shelter_capacity > 0:
                pet.current_location_type = 'volunteer'
                pet.current_location_id = volunteer.id
                pet.save()
                
                return Response({
                    'message': 'Pet assigned to your shelter',
                    'pet': pet.id
                })
            else:
                return Response(
                    {'message': 'You cannot provide shelter or capacity is full'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'message': 'You must be a verified volunteer to provide shelter'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    elif action == 'suggest_shelter':
        # Get nearby shelters
        pincode = pet.pincode or user.pincode
        shelters = Shelter.objects.filter(
            is_verified=True,
            pincode=pincode
        ).exclude(current_occupancy__gte=F('total_capacity'))[:5]
        return Response({
            'shelters': ShelterSerializer(shelters, many=True).data
        })
    
    elif action == 'move_to_shelter':
        # Move pet to a specific shelter
        shelter_id = request.data.get('shelter_id')
        try:
            shelter = Shelter.objects.get(id=shelter_id, is_verified=True)
            if shelter.available_capacity > 0:
                pet.current_location_type = 'shelter'
                pet.current_location_id = shelter.id
                shelter.current_occupancy += 1
                shelter.save()
                pet.save()
                
                # Notify shelter owner
                Notification.objects.create(
                    user=shelter.user,
                    title='New Pet Arrived',
                    message=f'A found pet "{pet.name}" has been moved to your shelter',
                    notification_type='system',
                    related_pet=pet
                )
                
                return Response({
                    'message': 'Pet moved to shelter successfully',
                    'shelter': ShelterSerializer(shelter).data
                })
            else:
                return Response(
                    {'message': 'Shelter is at full capacity'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Shelter.DoesNotExist:
            return Response(
                {'message': 'Shelter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif action == 'match_volunteers':
        # Find nearby volunteers
        pincode = pet.pincode or user.pincode
        volunteers = Volunteer.objects.filter(
            can_provide_shelter=True,
            user__volunteer_verified=True,
            user__pincode=pincode
        )[:10]
        
        return Response({
            'volunteers': VolunteerSerializer(volunteers, many=True).data
        })
    
    elif action == 'assign_to_volunteer':
        # Assign pet to a volunteer
        volunteer_id = request.data.get('volunteer_id')
        try:
            volunteer = Volunteer.objects.get(id=volunteer_id, can_provide_shelter=True)
            pet.current_location_type = 'volunteer'
            pet.current_location_id = volunteer.id
            pet.save()
            
            # Create chat room
            chat_room = ChatRoom.objects.create(
                pet=pet,
                room_type='reunification'
            )
            chat_room.participants.add(request.user, volunteer.user)
            
            # Notify volunteer
            Notification.objects.create(
                user=volunteer.user,
                title='Pet Assignment',
                message=f'You have been assigned to care for "{pet.name}"',
                notification_type='system',
                related_pet=pet
            )
            
            return Response({
                'message': 'Pet assigned to volunteer',
                'chat_room_id': chat_room.id
            })
        except Volunteer.DoesNotExist:
            return Response(
                {'message': 'Volunteer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(
        {'message': 'Invalid action'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_15_day_adoption(request, pet_id):
    """
    Check if pet has been in care for 15+ days and handle adoption transition.
    Only the uploader (posted_by) can give consent to move to adoption.
    """
    try:
        pet = Pet.objects.get(id=pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify that the user is the one who uploaded the pet
    if pet.posted_by != request.user:
        return Response(
            {'message': 'Only the person who uploaded this pet can make this decision'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Verify it's a found pet
    if pet.adoption_status != 'Found' or not pet.found_date:
        return Response(
            {'message': 'This endpoint is only for found pets'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate days
    days = pet.calculate_days_in_care()
    
    if days >= 15 and not pet.moved_to_adoption and not pet.is_reunited:
        # Ask for consent
        consent = request.data.get('consent_for_adoption', False)
        wants_to_keep = request.data.get('wants_to_keep', False)
        
        if wants_to_keep:
            # User wants to keep the pet - transfer ownership
            pet.owner = request.user
            pet.adoption_status = 'Adopted'
            pet.moved_to_adoption = False  # Don't mark as moved to adoption
            pet.save()
            
            # Notify user
            Notification.objects.create(
                user=request.user,
                title='Pet Ownership Transferred',
                message=f'You are now the owner of "{pet.name}"',
                notification_type='system',
                related_pet=pet
            )
            
            return Response({
                'message': 'Pet ownership transferred to you',
                'pet': pet.id,
                'status': 'Adopted'
            })
        
        elif consent:
            # User consents to move to adoption - move to adoption listing
            pet.moved_to_adoption = True
            pet.moved_to_adoption_date = timezone.now()
            pet.adoption_status = 'Available for Adoption'
            pet.owner_consent_for_adoption = True
            pet.save()
            
            # Notify the uploader
            Notification.objects.create(
                user=request.user,
                title='Pet Moved to Adoption',
                message=f'"{pet.name}" has been moved to adoption listing. Thank you for your consent!',
                notification_type='system',
                related_pet=pet
            )
            
            # If in shelter, notify shelter
            if pet.current_location_type == 'shelter':
                try:
                    shelter = Shelter.objects.get(id=pet.current_location_id)
                    Notification.objects.create(
                        user=shelter.user,
                        title='Pet Moved to Adoption',
                        message=f'"{pet.name}" has been moved to adoption listing',
                        notification_type='system',
                        related_pet=pet
                    )
                except Shelter.DoesNotExist:
                    pass
            
            return Response({
                'message': 'Pet moved to adoption listing successfully',
                'pet': pet.id,
                'status': 'Available for Adoption'
            })
        
        else:
            # Just checking status - return info that decision is needed
            return Response({
                'message': 'Pet has been in care for 15+ days. Please make a decision.',
                'days': days,
                'requires_decision': True,
                'pet_id': pet.id
            })
    
    elif pet.moved_to_adoption:
        return Response({
            'message': 'Pet has already been moved to adoption',
            'days': days,
            'requires_decision': False,
            'moved_to_adoption': True
        })
    elif pet.is_reunited:
        return Response({
            'message': 'Pet has been reunited with owner',
            'days': days,
            'requires_decision': False,
            'is_reunited': True
        })
    else:
        return Response({
            'days': days,
            'requires_decision': False,
            'message': f'Pet has been in care for {days} days. {15 - days} days remaining before decision is required.'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_lost_pet(request, lost_pet_id):
    """
    Match lost pet with found pets (including shelter and registered user pets).
    """
    try:
        lost_pet = Pet.objects.get(id=lost_pet_id, adoption_status='Lost', posted_by=request.user)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Lost pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Find matching found pets
    found_pets = Pet.objects.filter(
        adoption_status__in=['Found', 'Pending'],
        breed=lost_pet.breed
    ).exclude(id=lost_pet_id)
    
    # Include pets in shelters
    shelter_pets = Pet.objects.filter(
        current_location_type='shelter',
        adoption_status__in=['Found', 'Pending'],
        breed=lost_pet.breed
    )
    
    # Include pets with registered users
    user_pets = Pet.objects.filter(
        current_location_type__in=['user', 'volunteer'],
        adoption_status__in=['Found', 'Pending'],
        breed=lost_pet.breed
    )
    
    all_matches = (found_pets | shelter_pets | user_pets).distinct()
    
    # Filter by location if available
    if lost_pet.pincode:
        all_matches = all_matches.filter(
            Q(pincode=lost_pet.pincode) | Q(location__icontains=lost_pet.location)
        )
    
    from pets.serializers import PetListSerializer
    matches = PetListSerializer(all_matches[:20], many=True, context={'request': request}).data
    
    return Response({
        'matches': matches,
        'count': len(matches)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_lost_pet(request, found_pet_id):
    """
    User claims a found pet as their lost pet.
    """
    try:
        found_pet = Pet.objects.get(id=found_pet_id, adoption_status='Found')
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Found pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create claim request
    claim_message = request.data.get('message', '')
    
    # Determine who to contact
    contact_user = None
    if found_pet.current_location_type == 'shelter':
        try:
            shelter = Shelter.objects.get(id=found_pet.current_location_id)
            contact_user = shelter.user
        except Shelter.DoesNotExist:
            pass
    elif found_pet.current_location_type == 'volunteer':
        try:
            volunteer = Volunteer.objects.get(id=found_pet.current_location_id)
            contact_user = volunteer.user
        except Volunteer.DoesNotExist:
            pass
    elif found_pet.posted_by:
        contact_user = found_pet.posted_by
    
    if not contact_user:
        return Response(
            {'message': 'Cannot determine pet caretaker'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create chat room for reunification
    chat_room = ChatRoom.objects.create(
        pet=found_pet,
        room_type='reunification'
    )
    chat_room.participants.add(request.user, contact_user)
    
    # Notify caretaker
    Notification.objects.create(
        user=contact_user,
        title='Pet Claim Request',
        message=f'{request.user.name} claims "{found_pet.name}" as their lost pet',
        notification_type='pet_matched',
        related_pet=found_pet
    )
    
    return Response({
        'message': 'Claim request sent. Admin will verify.',
        'chat_room_id': chat_room.id
    })

