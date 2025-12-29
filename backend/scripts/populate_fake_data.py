import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Volunteer, Shelter, FeedingPoint, AdminRegistration
from health.models import VaccinationCamp, HealthResource

User = get_user_model()

# Constants
PASSWORD = "Pavankumar@12345"
ADMIN_EMAIL = "admin@petrenuite.com"
TELANGANA_CITIES = [
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Warangal", "lat": 17.9689, "lng": 79.5941},
    {"name": "Nizamabad", "lat": 18.6725, "lng": 78.0941},
    {"name": "Karimnagar", "lat": 18.4386, "lng": 79.1288},
    {"name": "Khammam", "lat": 17.2473, "lng": 80.1514},
    {"name": "Secunderabad", "lat": 17.4399, "lng": 78.4983},
    {"name": "Gachibowli", "lat": 17.4401, "lng": 78.3489},
]

FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Pavan", "Rohan", "Karthik", "Ananya", "Diya", "Saanvi", "Lakshmi", "Priya"]
LAST_NAMES = ["Reddy", "Rao", "Kumar", "Sharma", "Verma", "Singh", "Patel", "Gupta"]

def get_random_location():
    city = random.choice(TELANGANA_CITIES)
    lat_var = random.uniform(-0.05, 0.05)
    lng_var = random.uniform(-0.05, 0.05)
    return {
        "city": city["name"],
        "lat": city["lat"] + lat_var,
        "lng": city["lng"] + lng_var,
        "state": "Telangana",
        "pincode": f"500{random.randint(100, 999)}"
    }

def create_users_and_admin():
    print("Creating users and admin...")
    users = []

    # Create distinct Admin
    if not User.objects.filter(email=ADMIN_EMAIL).exists():
        admin = User.objects.create_superuser(
            email=ADMIN_EMAIL,
            name="Super Admin Pavan",
            password=PASSWORD,
            role='admin',
            admin_level='super_admin'
        )
        print(f"Created SuperAdmin: {admin.email}")
    else:
        admin = User.objects.get(email=ADMIN_EMAIL)
        print(f"SuperAdmin already exists: {admin.email}")
    users.append(admin)

    # Create random users with different roles
    roles = ['user', 'volunteer', 'shelter']
    
    for i in range(20):
        role = random.choice(roles)
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"{first_name.lower()}.{last_name.lower()}{i}@example.com"
        
        if User.objects.filter(email=email).exists():
            continue

        loc = get_random_location()
        
        user = User.objects.create_user(
            email=email,
            name=f"{first_name} {last_name}",
            password=PASSWORD,
            role=role,
            phone=f"9{random.randint(100000000, 999999999)}",
            country_code="+91",
            pincode=loc['pincode'],
            address=f"{random.randint(1, 100)}, {loc['city']} Main Road",
            is_active=True
        )

        if role == 'volunteer':
            Volunteer.objects.create(
                user=user,
                ngo_name=f"Helping Hands {loc['city']}",
                experience_years=random.randint(1, 5),
                availability="Weekends",
                verified_by=admin if random.choice([True, False]) else None # Some unverified
            )
        
        elif role == 'shelter':
            Shelter.objects.create(
                user=user,
                name=f"{loc['city']} Animal Shelter",
                address=user.address,
                city=loc['city'],
                state=loc['state'],
                pincode=loc['pincode'],
                phone=user.phone,
                email=user.email,
                total_capacity=random.randint(50, 200),
                area_sqft=random.randint(1000, 5000),
                is_verified=random.choice([True, False]), # Mix of verified/unverified
                verified_by=admin if random.choice([True, False]) else None
            )
        
        users.append(user)
        print(f"Created {role}: {email}")
    
    return users, admin

def create_admin_managed_resources(admin):
    print("Creating admin managed resources...")
    
    # Feeding Points provided by Admin
    for i in range(5):
        loc = get_random_location()
        FeedingPoint.objects.create(
            name=f"Official Feeding Spot - {loc['city']} {i+1}",
            address=f"Municipal Park Area, {loc['city']}",
            city=loc['city'],
            state=loc['state'],
            pincode=loc['pincode'],
            latitude=loc['lat'],
            longitude=loc['lng'],
            description="Government approved feeding point. Maintained by details provided by Admin.",
            created_by=admin,
            is_active=True
        )
        print(f"Created Admin Feeding Point in {loc['city']}")

    # Vaccination Camps provided by Admin
    dates = [
        timezone.now().date() + timedelta(days=random.randint(-10, 20))
        for _ in range(5)
    ]
    for date in dates:
        loc = get_random_location()
        VaccinationCamp.objects.create(
            location=f"Govt. School Grounds, {loc['city']}",
            address=f"Near RTC Bus Stand, {loc['city']}",
            city=loc['city'],
            state=loc['state'],
            pincode=loc['pincode'],
            date=date,
            start_time="10:00:00",
            end_time="16:00:00",
            ngo="PetReunite Official",
            ngo_contact=f"9000{random.randint(100000, 999999)}",
            max_capacity=200,
            created_by=admin,
            is_active=True
        )
        print(f"Created Admin Vaccination Camp in {loc['city']} on {date}")

    # Health Resources created by Admin
    resources = [
        {
            "title": "Monsoon Care for Street Dogs",
            "type": "general",
            "content": "Ensure street dogs have dry shelter. Check for tick infestations commonly found in Telangana region during rains.",
            "desc": "Essential tips for monsoon season."
        },
        {
            "title": "Rabies Vaccination Schedule",
            "type": "vaccination",
            "content": "Puppies should be vaccinated at 6-8 weeks. Annual boosters are mandatory for safety.",
            "desc": "Guide to keeping pets safe from Rabies."
        },
        {
            "title": "First Aid for Heat Stroke",
            "type": "first_aid",
            "content": "Telangana summers are hot. If a dog is panting heavily, provide cool water and move to shade immediately.",
            "desc": "Critical summer care advice."
        }
    ]

    for res in resources:
        HealthResource.objects.create(
            title=res["title"],
            resource_type=res["type"],
            content=res["content"],
            short_description=res["desc"],
            is_featured=True,
            created_by=admin
        )
        print(f"Created Health Resource: {res['title']}")

def main():
    print("Starting PetReunite Fake Data Population (Telangana)...")
    users, admin = create_users_and_admin()
    create_admin_managed_resources(admin)
    print("Population Complete. Admin email set to: " + ADMIN_EMAIL)

if __name__ == "__main__":
    main()
