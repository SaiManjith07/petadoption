from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailBackend(ModelBackend):
    """Custom authentication backend using email instead of username."""
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Try to find user by email
            user = User.objects.get(Q(email__iexact=username) | Q(email__iexact=kwargs.get('email')))
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a non-existing user
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # If multiple users are found, return the first one
            user = User.objects.filter(Q(email__iexact=username) | Q(email__iexact=kwargs.get('email'))).first()

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

