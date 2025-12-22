"""
Quick script to check Cloudinary URLs in the database.
Run with: C:\Users\HP\Desktop\PK\petadoption\petadoption\Scripts\python.exe check_cloudinary_urls.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pets.models import Pet, PetImage

print("=" * 70)
print("PETS WITH CLOUDINARY URLs")
print("=" * 70)
pets = Pet.objects.filter(cloudinary_url__isnull=False).order_by('-created_at')
if pets.exists():
    print(f"\nFound {pets.count()} pet(s) with Cloudinary URLs:\n")
    for pet in pets:
        print(f"Pet ID: {pet.id}")
        print(f"Name: {pet.name}")
        print(f"Status: {pet.adoption_status}")
        print(f"Cloudinary URL: {pet.cloudinary_url}")
        print(f"Public ID: {pet.cloudinary_public_id}")
        print(f"Created: {pet.created_at}")
        print("-" * 70)
else:
    print("\nNo pets with Cloudinary URLs found.")
    print("Note: Only pets created AFTER Cloudinary integration will have these URLs.")

print("\n" + "=" * 70)
print("ADDITIONAL PET IMAGES WITH CLOUDINARY URLs")
print("=" * 70)
images = PetImage.objects.filter(cloudinary_url__isnull=False).order_by('-created_at')
if images.exists():
    print(f"\nFound {images.count()} additional image(s) with Cloudinary URLs:\n")
    for img in images:
        print(f"Image ID: {img.id}")
        print(f"Pet: {img.pet.name} (Pet ID: {img.pet.id})")
        print(f"Caption: {img.caption or 'N/A'}")
        print(f"Cloudinary URL: {img.cloudinary_url}")
        print(f"Public ID: {img.cloudinary_public_id}")
        print(f"Created: {img.created_at}")
        print("-" * 70)
else:
    print("\nNo additional images with Cloudinary URLs found.")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
total_pets = Pet.objects.count()
pets_with_cloudinary = Pet.objects.filter(cloudinary_url__isnull=False).count()
total_images = PetImage.objects.count()
images_with_cloudinary = PetImage.objects.filter(cloudinary_url__isnull=False).count()

print(f"Total Pets: {total_pets}")
print(f"Pets with Cloudinary URLs: {pets_with_cloudinary}")
print(f"Total Additional Images: {total_images}")
print(f"Additional Images with Cloudinary URLs: {images_with_cloudinary}")

