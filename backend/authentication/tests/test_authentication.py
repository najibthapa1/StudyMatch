from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import User, EmailVerification
from user_profile.models import Profile


class TestUserManager(TestCase):

    def test_create_user_valid_college_email(self):
        user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='TestPass123'
        )
        self.assertEqual(user.email, 'student@islingtoncollege.edu.np')
        self.assertFalse(user.is_verified)
        self.assertFalse(user.is_suspended)
        self.assertTrue(user.check_password('TestPass123'))

    def test_create_user_invalid_domain_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            User.objects.create_user(
                email='user@gmail.com',
                password='TestPass123'
            )
        self.assertIn('domain not allowed', str(ctx.exception))

    def test_password_is_hashed_not_plaintext(self):
        user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='MySecretPassword123'
        )
        self.assertNotEqual(user.password, 'MySecretPassword123')
        self.assertTrue(user.check_password('MySecretPassword123'))
        self.assertFalse(user.check_password('WrongPassword'))

    def test_create_superuser_sets_all_flags(self):
        admin = User.objects.create_superuser(
            email='admin@islingtoncollege.edu.np',
            password='AdminPass123'
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_verified)
        self.assertEqual(admin.role, 'admin')


class TestUserModelFields(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )

    def test_is_verified_default_false(self):
        self.assertFalse(self.user.is_verified)

    def test_role_default_student(self):
        self.assertEqual(self.user.role, 'student')


class TestEmailVerificationModel(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )

    def test_expired_code_is_in_past(self):
        ev = EmailVerification.objects.create(
            user=self.user,
            code='123456',
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        self.assertLess(ev.expires_at, timezone.now())


class TestRegisterEndpoint(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_valid_data_returns_201(self):
        data = {
            'email': 'newuser@islingtoncollege.edu.np',
            'password': 'SecurePass123',
            'name': 'John Doe',
            'university': 'Islington College',
            'major': 'Computer Science'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_id', response.data)


class TestLoginEndpoint(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_login_verified_user_returns_tokens(self):
        user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='MyPassword123'
        )
        user.is_verified = True
        user.save()

        response = self.client.post('/api/auth/login/', {
            'email': 'student@islingtoncollege.edu.np',
            'password': 'MyPassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_login_unverified_user_returns_403(self):
        User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='MyPassword123'
        )
        response = self.client.post('/api/auth/login/', {
            'email': 'student@islingtoncollege.edu.np',
            'password': 'MyPassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('verify', response.data['error'].lower())

    def test_login_suspended_user_returns_403(self):
        from administration.models import UserSuspension

        user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='MyPassword123'
        )
        user.is_verified = True
        user.is_suspended = True
        user.save()

        UserSuspension.objects.create(
            user=user,
            suspended_by=None,
            reason='Test suspension',
            duration_days=7,
            expires_at=timezone.now() + timedelta(days=7),
            is_active=True
        )

        response = self.client.post('/api/auth/login/', {
            'email': 'student@islingtoncollege.edu.np',
            'password': 'MyPassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('suspended', response.data['error'].lower())


class TestVerifyEmailEndpoint(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )

    def test_valid_code_returns_jwt_tokens(self):
        EmailVerification.objects.create(
            user=self.user, code='123456',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        response = self.client.post('/api/auth/verify-email/', {
            'email': 'student@islingtoncollege.edu.np',
            'code': '123456'
        }, format='json')
        self.assertIn('tokens', response.data)

    def test_expired_code_returns_400_with_expired_message(self):
        EmailVerification.objects.create(
            user=self.user, code='123456',
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        response = self.client.post('/api/auth/verify-email/', {
            'email': 'student@islingtoncollege.edu.np',
            'code': '123456'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['error'].lower())
