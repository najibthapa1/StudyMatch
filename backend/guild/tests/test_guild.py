from django.test import TestCase
from datetime import time, date, timedelta
from guild.models import Guild, Event, EventParticipant
from authentication.models import User


class TestEventModel(TestCase):
    
    def setUp(self):
        self.guild = Guild.objects.create(
            name='Islington College',
            description='Official guild for Islington College students'
        )
    
    def test_create_event(self):
        event = Event.objects.create(
            guild=self.guild,
            title='Python Workshop',
            description='Learn Python basics',
            date=date.today() + timedelta(days=5),
            time_start=time(14, 0),
            time_end=time(16, 0)
        )
        
        self.assertEqual(event.title, 'Python Workshop')
        self.assertEqual(event.guild, self.guild)
    
    def test_is_event_ended_future_event(self):
        future_date = date.today() + timedelta(days=5)
        event = Event.objects.create(
            guild=self.guild,
            title='Future Event',
            description='Future event description',
            date=future_date,
            time_start=time(14, 0),
            time_end=time(16, 0)
        )
        
        self.assertFalse(event.is_event_ended())
    
    def test_is_event_ended_past_event(self):
        past_date = date.today() - timedelta(days=5)
        event = Event.objects.create(
            guild=self.guild,
            title='Past Event',
            description='Past event description',
            date=past_date,
            time_start=time(14, 0),
            time_end=time(16, 0)
        )
        
        self.assertTrue(event.is_event_ended())
    
    def test_is_event_ended_today(self):
        today = date.today()
        event = Event.objects.create(
            guild=self.guild,
            title='Today Past Event',
            description='Today event description',
            date=today,
            time_start=time(8, 0),
            time_end=time(10, 0)
        )
        
        self.assertTrue(event.is_event_ended())


class TestEventParticipantModel(TestCase):
    
    def setUp(self):
        self.guild = Guild.objects.create(
            name='Islington College',
            description='Official guild for Islington College students'
        )
        self.user1 = User.objects.create_user(
            email='student1@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.user2 = User.objects.create_user(
            email='student2@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.user3 = User.objects.create_user(
            email='student3@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.event_creator = User.objects.create_user(
            email='creator@islingtoncollege.edu.np',
            password='Pass123'
        )
        self.event = Event.objects.create(
            guild=self.guild,
            title='Python Workshop',
            description='Learn Python basics',
            category='workshop',
            date=date.today() + timedelta(days=5),
            time_start=time(14, 0),
            time_end=time(16, 0),
            venue='Brit',
            created_by=self.event_creator,
            status='pending'
        )
    
    def test_user_pre_joins_event(self):
        participant = EventParticipant.objects.create(
            event=self.event,
            user=self.user1,
            is_confirmed=False
        )
        
        self.assertEqual(participant.user, self.user1)
        self.assertEqual(participant.event, self.event)
        self.assertFalse(participant.is_confirmed)
    
    def test_pre_join_increments_counter(self):
        self.assertEqual(self.event.pre_joined_count, 0)
        
        EventParticipant.objects.create(event=self.event, user=self.user1)
        self.event.refresh_from_db()
        self.assertEqual(self.event.pre_joined_count, 1)
    
    def test_third_pre_join_auto_confirms_event(self):
        EventParticipant.objects.create(event=self.event, user=self.user1)
        EventParticipant.objects.create(event=self.event, user=self.user2)
        EventParticipant.objects.create(event=self.event, user=self.user3)
        
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, 'confirmed')
        self.assertEqual(self.event.pre_joined_count, 3)
        self.assertEqual(self.event.attendee_count, 3)
    
    def test_event_can_be_cancelled(self):
        self.event.status = 'cancelled'
        self.event.save()
        self.event.refresh_from_db()
        
        self.assertEqual(self.event.status, 'cancelled')
