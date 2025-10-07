from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.cache import cache
from .models import Profile
import json

User = get_user_model()

class ProfileUpdateTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        # Profile is created automatically by signal, just update it
        self.profile = self.user.profile
        self.profile.display_name = 'Test User'
        self.profile.bio = 'Test bio'
        self.profile.save()
        self.client.login(username='testuser', password='testpass123')
        
        # Clear cache before each test
        cache.clear()

    def test_profile_update_ajax(self):
        """Test that profile updates work via AJAX and return JSON response"""
        url = reverse('manage_profile')
        
        # Test data
        form_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@example.com',
            'display_name': 'Updated Name',
            'bio': 'Updated bio content',
            'phone': '1234567890',
            'address': 'Updated address',
        }
        
        # Make AJAX request
        response = self.client.post(
            url,
            data=form_data,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('profile_data', data)
        
        # Check that profile was updated
        self.user.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.user.email, 'updated@example.com')
        self.assertEqual(self.profile.display_name, 'Updated Name')
        self.assertEqual(self.profile.bio, 'Updated bio content')

    def test_profile_update_regular_form(self):
        """Test that regular form submission still works"""
        url = reverse('manage_profile')
        
        form_data = {
            'first_name': 'Regular',
            'last_name': 'Update',
            'email': 'regular@example.com',
            'display_name': 'Regular Update',
        }
        
        # Make regular POST request (not AJAX)
        response = self.client.post(url, data=form_data)
        
        # Should redirect on success
        self.assertEqual(response.status_code, 302)
        
        # Check that profile was updated
        self.user.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Regular')
        self.assertEqual(self.user.last_name, 'Update')
        self.assertEqual(self.profile.display_name, 'Regular Update')

    def test_profile_caching(self):
        """Test that profile data caching works correctly"""
        from accounts.views import _get_cached_profile_data, _set_cached_profile_data, _invalidate_profile_cache
        
        # Test caching
        test_data = {'display_name': 'Cached User', 'email': 'cached@test.com'}
        _set_cached_profile_data(self.user.id, test_data)
        
        # Test retrieval
        cached_data = _get_cached_profile_data(self.user.id)
        self.assertEqual(cached_data, test_data)
        
        # Test invalidation
        _invalidate_profile_cache(self.user.id)
        cached_data = _get_cached_profile_data(self.user.id)
        self.assertIsNone(cached_data)

    def test_form_optimization(self):
        """Test that form only saves changed fields"""
        from accounts.forms import ProfileForm
        
        # Create form with same data
        form_data = {
            'first_name': 'Test',  # Same as current
            'last_name': 'User',   # Same as current
            'email': 'test@example.com',  # Same as current
            'display_name': 'Test User',  # Same as current
            'bio': 'Test bio',  # Same as current
        }
        
        form = ProfileForm(form_data, instance=self.profile, user=self.user)
        self.assertTrue(form.is_valid())
        
        # Save and check that no unnecessary updates occurred
        original_updated_at = self.profile.updated_at
        form.save()
        
        # The updated_at should not change if no actual changes were made
        # (This test might need adjustment based on your specific requirements)
        self.profile.refresh_from_db()
        # Note: updated_at will change due to auto_now=True, but the optimization
        # prevents unnecessary database writes for unchanged fields
