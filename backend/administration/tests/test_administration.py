from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from authentication.models import User
from administration.models import UserReport, UserSuspension


class TestReportModel(TestCase):
    
    def setUp(self):
        self.reporter = User.objects.create_user(
            email='reporter@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.reported_user = User.objects.create_user(
            email='reported@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_create_report(self):
        report = UserReport.objects.create(
            reported_by=self.reporter,
            reported_user=self.reported_user,
            reason='inappropriate',
            details='User sent offensive messages'
        )
        
        self.assertEqual(report.reported_by, self.reporter)
        self.assertEqual(report.reported_user, self.reported_user)
        self.assertEqual(report.reason, 'inappropriate')
        self.assertEqual(report.status, 'pending')
    
    def test_report_status_transitions(self):
        report = UserReport.objects.create(
            reported_by=self.reporter,
            reported_user=self.reported_user,
            reason='spam',
            details='Spamming messages'
        )
        
        report.status = 'reviewed'
        report.save()
        report.refresh_from_db()
        self.assertEqual(report.status, 'reviewed')
    
    def test_report_status_transitions_to_action_taken(self):
        report = UserReport.objects.create(
            reported_by=self.reporter,
            reported_user=self.reported_user,
            reason='spam',
            details='Spamming messages'
        )
        
        report.status = 'action_taken'
        report.save()
        report.refresh_from_db()
        self.assertEqual(report.status, 'action_taken')


class TestUserSuspension(TestCase):
    
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@islingtoncollege.edu.np',
            password='AdminPass123'
        )
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_suspend_user_sets_flag(self):
        suspension = UserSuspension.objects.create(
            user=self.user,
            suspended_by=self.admin,
            reason='Violation of terms',
            duration_days=7,
            expires_at=timezone.now() + timedelta(days=7),
            is_active=True
        )
        
        self.user.is_suspended = True
        self.user.save()
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_suspended)
        self.assertEqual(suspension.reason, 'Violation of terms')
        self.assertTrue(suspension.is_active)
    
    def test_unsuspend_user(self):
        suspension = UserSuspension.objects.create(
            user=self.user,
            suspended_by=self.admin,
            reason='Violation of terms',
            duration_days=7,
            expires_at=timezone.now() + timedelta(days=7),
            is_active=True
        )
        
        self.user.is_suspended = True
        self.user.save()
        
        # Unsuspend
        self.user.is_suspended = False
        self.user.save()
        
        suspension.is_active = False
        suspension.save()
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_suspended)
        suspension.refresh_from_db()
        self.assertFalse(suspension.is_active)
