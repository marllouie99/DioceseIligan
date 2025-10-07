from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Church, ChurchFollow, BookableService, ServiceImage

User = get_user_model()


class ChurchTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.login(username='testuser', password='testpass123')
        
        # Create a test church
        self.church = Church.objects.create(
            name='Test Church',
            slug='test-church',
            description='A test church for testing purposes',
            denomination='catholic',
            size='medium',
            email='test@church.com',
            phone='+63 123 456 7890',
            address='123 Test Street',
            city='Test City',
            state='Test State',
            country='Philippines',
            postal_code='12345',
            pastor_name='Pastor Test',
            service_times='Sunday 9:00 AM, 11:00 AM',
            owner=self.user
        )

    def test_church_creation(self):
        """Test that a church can be created successfully."""
        self.assertEqual(Church.objects.count(), 1)
        self.assertEqual(self.church.name, 'Test Church')
        self.assertEqual(self.church.owner, self.user)

    def test_church_detail_view(self):
        """Test that church detail view works."""
        response = self.client.get(reverse('core:church_detail', kwargs={'slug': self.church.slug}))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.church.name)

    def test_discover_churches_view(self):
        """Test that discover churches view works."""
        response = self.client.get(reverse('discover'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Discover Churches')

    def test_create_church_view(self):
        """Test that create church view works."""
        response = self.client.get(reverse('create_church'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Create Church')

    def test_manage_church_view(self):
        """Test that manage church view works for church owner."""
        response = self.client.get(reverse('manage_church'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Manage Church')

    def test_follow_church(self):
        """Test that a user can follow a church."""
        response = self.client.post(reverse('follow_church', kwargs={'church_id': self.church.id}))
        self.assertEqual(response.status_code, 200)
        
        # Check that the follow relationship was created
        self.assertTrue(ChurchFollow.objects.filter(user=self.user, church=self.church).exists())

    def test_unfollow_church(self):
        """Test that a user can unfollow a church."""
        # First follow the church
        ChurchFollow.objects.create(user=self.user, church=self.church)
        
        # Then unfollow
        response = self.client.post(reverse('unfollow_church', kwargs={'church_id': self.church.id}))
        self.assertEqual(response.status_code, 200)
        
        # Check that the follow relationship was removed
        self.assertFalse(ChurchFollow.objects.filter(user=self.user, church=self.church).exists())

    def test_church_search(self):
        """Test church search functionality."""
        response = self.client.get(reverse('discover'), {'query': 'Test Church'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Church')

    def test_church_filtering(self):
        """Test church filtering by denomination."""
        response = self.client.get(reverse('discover'), {'denomination': 'catholic'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Church')

    def test_church_owner_sidebar(self):
        """Test that manage church appears in sidebar for church owners."""
        response = self.client.get(reverse('discover'))
        self.assertEqual(response.status_code, 200)
        # The sidebar should contain the manage church link
        self.assertContains(response, 'Manage Church')

    def test_church_form_validation(self):
        """Test that church form validation works."""
        form_data = {
            'name': '',  # Empty name should fail
            'description': 'Test description',
            'denomination': 'catholic',
            'size': 'medium',
            'email': 'test@church.com',
            'phone': '+63 123 456 7890',
            'address': '123 Test Street',
            'city': 'Test City',
            'state': 'Test State',
            'country': 'Philippines',
            'postal_code': '12345',
            'pastor_name': 'Pastor Test',
            'service_times': 'Sunday 9:00 AM',
            'confirm_ownership': True
        }
        
        response = self.client.post(reverse('create_church'), form_data)
        # Should not redirect (form should have errors)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'This field is required')


class ServiceImageTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.login(username='testuser', password='testpass123')
        
        # Create a test church
        self.church = Church.objects.create(
            name='Test Church',
            slug='test-church',
            description='A test church for testing purposes',
            denomination='catholic',
            size='medium',
            email='test@church.com',
            phone='+63 123 456 7890',
            address='123 Test Street',
            city='Test City',
            state='Test State',
            country='Philippines',
            postal_code='12345',
            pastor_name='Pastor Test',
            service_times='Sunday 9:00 AM, 11:00 AM',
            owner=self.user
        )

    def test_create_service_with_multiple_images(self):
        """Test that a service can be created with multiple images."""
        # Create test image files
        image1 = SimpleUploadedFile(
            "test_image1.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        image2 = SimpleUploadedFile(
            "test_image2.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        form_data = {
            'name': 'Test Service',
            'description': 'A test service',
            'duration': 60,
            'max_bookings_per_day': 5,
            'advance_booking_days': 7,
            'is_active': True,
            'is_free': True,
        }
        
        files = {
            'images': [image1, image2]
        }
        
        response = self.client.post(reverse('core:create_service'), {**form_data, **files})
        
        # Debug: Print response content if not redirecting
        if response.status_code != 302:
            print(f"Response status: {response.status_code}")
            print(f"Response content: {response.content.decode()}")
        
        # Should redirect on success
        self.assertEqual(response.status_code, 302)
        
        # Check that service was created
        service = BookableService.objects.get(name='Test Service')
        self.assertEqual(service.church, self.church)
        
        # Check that images were created
        service_images = ServiceImage.objects.filter(service=service)
        self.assertEqual(service_images.count(), 2)
        
        # Check that first image is primary
        primary_image = service_images.filter(is_primary=True).first()
        self.assertIsNotNone(primary_image)
        
        # Check image order
        images_by_order = service_images.order_by('order')
        self.assertEqual(images_by_order[0].order, 0)
        self.assertEqual(images_by_order[1].order, 1)

    def test_service_get_images_method(self):
        """Test that service.get_images() returns images in correct order."""
        # Create a test service
        service = BookableService.objects.create(
            name='Test Service',
            description='A test service',
            church=self.church,
            duration=60,
            max_bookings_per_day=5,
            advance_booking_days=7
        )
        
        # Create test images with different orders
        image1 = ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test1.jpg", b"content", "image/jpeg"),
            order=2,
            is_primary=False
        )
        image2 = ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test2.jpg", b"content", "image/jpeg"),
            order=0,
            is_primary=True
        )
        image3 = ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test3.jpg", b"content", "image/jpeg"),
            order=1,
            is_primary=False
        )
        
        # Test get_images method
        images = service.get_images()
        self.assertEqual(len(images), 3)
        self.assertEqual(images[0], image2)  # order=0
        self.assertEqual(images[1], image3)  # order=1
        self.assertEqual(images[2], image1)  # order=2

    def test_service_card_displays_stackable_images(self):
        """Test that service cards display stackable images correctly."""
        # Create a test service with multiple images
        service = BookableService.objects.create(
            name='Test Service',
            description='A test service',
            church=self.church,
            duration=60,
            max_bookings_per_day=5,
            advance_booking_days=7
        )
        
        # Create multiple images
        for i in range(5):
            ServiceImage.objects.create(
                service=service,
                image=SimpleUploadedFile(f"test{i}.jpg", b"content", "image/jpeg"),
                order=i,
                is_primary=(i == 0)
            )
        
        # Test manage services view
        response = self.client.get(reverse('core:manage_services'))
        self.assertEqual(response.status_code, 200)
        
        # Check that the template contains the service image stack
        self.assertContains(response, 'service-image-stack')
        self.assertContains(response, 'stacked-image')
        self.assertContains(response, 'image-count-badge')

    def test_manage_service_images_page_loads(self):
        """Test that the manage service images page loads without template errors."""
        # Create a test service with images
        service = BookableService.objects.create(
            name='Test Service',
            description='A test service',
            church=self.church,
            duration=60,
            max_bookings_per_day=5,
            advance_booking_days=7
        )
        
        # Create a test image
        ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test.jpg", b"content", "image/jpeg"),
            order=0,
            is_primary=True
        )
        
        # Test manage service images view
        response = self.client.get(reverse('core:manage_service_images', kwargs={'service_id': service.id}))
        self.assertEqual(response.status_code, 200)
        
        # Check that the template loads without errors
        self.assertContains(response, 'Manage Images')
        self.assertContains(response, 'image-gallery')

    def test_api_service_images_endpoint(self):
        """Test that the API endpoint for service images works correctly."""
        # Create a test service with images
        service = BookableService.objects.create(
            name='Test Service',
            description='A test service',
            church=self.church,
            duration=60,
            max_bookings_per_day=5,
            advance_booking_days=7
        )
        
        # Create test images
        image1 = ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test1.jpg", b"content", "image/jpeg"),
            order=0,
            is_primary=True,
            caption="First image"
        )
        image2 = ServiceImage.objects.create(
            service=service,
            image=SimpleUploadedFile("test2.jpg", b"content", "image/jpeg"),
            order=1,
            is_primary=False,
            caption="Second image"
        )
        
        # Test API endpoint
        response = self.client.get(reverse('core:api_service_images', kwargs={'service_id': service.id}))
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['images']), 2)
        
        # Check image data structure
        self.assertEqual(data['images'][0]['id'], image1.id)
        self.assertEqual(data['images'][0]['caption'], 'First image')
        self.assertTrue(data['images'][0]['is_primary'])
        
        self.assertEqual(data['images'][1]['id'], image2.id)
        self.assertEqual(data['images'][1]['caption'], 'Second image')
        self.assertFalse(data['images'][1]['is_primary'])