from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from authentication.models import User
from user_profile.models import Profile, StudyGoal, Activity

class TestProfileModel(TestCase):
    """Test Profile model and methods"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_get_initials_two_names(self):
        profile = Profile.objects.create(
            user=self.user,
            full_name="John Doe",
            university_name='Islington College'
        )
        
        initials = profile.get_initials()
        self.assertEqual(initials, "JD")
    
    def test_get_initials_single_name(self):
        profile = Profile.objects.create(
            user=self.user,
            full_name="John",
            university_name='Islington College'
        )
        
        initials = profile.get_initials()
        self.assertEqual(initials, "JO")
    
    def test_get_initials_empty_name(self):
        profile = Profile.objects.create(
            user=self.user,
            full_name="",
            university_name='Islington College'
        )
        
        initials = profile.get_initials()
        self.assertEqual(initials, "U")
    
    def test_profile_fields_persistent(self):
        profile = Profile.objects.create(
            user=self.user,
            full_name="Najib Thapa",
            bio="I love coding",
            university_name="Islington College",
            course="Computer Science",
            year="3rd year",
            interests="python,react,gaming"
        )
        
        profile.refresh_from_db()
        self.assertEqual(profile.full_name, "Najib Thapa")
        self.assertEqual(profile.bio, "I love coding")
        self.assertEqual(profile.university_name, "Islington College")
        self.assertEqual(profile.course, "Computer Science")
        self.assertEqual(profile.year, "3rd year")
        self.assertEqual(profile.interests, "python,react,gaming")

class TestStudyGoalModel(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )
    
    def test_create_study_goal(self):
        goal = StudyGoal.objects.create(
            user=self.user,
            title="Complete Python course"
        )
        
        self.assertEqual(goal.title, "Complete Python course")
        self.assertFalse(goal.is_completed)
        self.assertIsNone(goal.completed_at)
    
class TestActivityModel(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='student@islingtoncollege.edu.np',
            password='Pass123'
        )

    def test_activity_ordering_newest_first(self):
        activity1 = Activity.objects.create(
            user=self.user,
            activity_type='connection',
            action='Connected with user'
        )
        activity2 = Activity.objects.create(
            user=self.user,
            activity_type='message',
            action='Sent message'
        )
        
        activities = Activity.objects.filter(user=self.user)
        self.assertEqual(activities[0].activity_id, activity2.activity_id)
        self.assertEqual(activities[1].activity_id, activity1.activity_id)
    