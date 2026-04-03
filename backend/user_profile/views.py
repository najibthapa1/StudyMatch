from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import models
from django.conf import settings
from .models import Profile, StudyGoal, Activity
from .serializers import StudyGoalSerializer, ActivitySerializer
from authentication.serializers import UserSerializer
import anthropic
import random

# Profile Management Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get current user's profile"""
    try:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user's profile"""
    try:
        user = request.user
        profile = user.profile
        
        # Update profile fields
        profile_data = request.data.get('profile', {})
        
        if 'full_name' in profile_data:
            profile.full_name = profile_data['full_name']
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        if 'university_name' in profile_data:
            profile.university_name = profile_data['university_name']
        if 'course' in profile_data:
            profile.course = profile_data['course']
        if 'year' in profile_data:
            profile.year = profile_data['year']
        if 'interests' in profile_data:
            profile.interests = profile_data['interests']
        if 'projects' in profile_data:
            profile.projects = profile_data['projects']
        
        profile.save()
        
        serializer = UserSerializer(user)
        return Response(
            {
                'message': 'Profile updated successfully',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Upload profile picture to Cloudinary"""
    try:        
        if 'profile_picture' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile = request.user.profile
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        
        serializer = UserSerializer(request.user)
        return Response(
            {
                'message': 'Profile picture uploaded successfully',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """Get user statistics"""
    try:
        from connection.models import ConnectionRequest
        from chat.models import Conversation
        
        connections_count = ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user) | models.Q(to_user=request.user)),
            status='accepted'
        ).count()
        
        # Count number of people the user has messaged with (conversations)
        conversations_count = Conversation.objects.filter(
            models.Q(participant_one=request.user) | models.Q(participant_two=request.user)
        ).count()
        
        stats = {
            'connections': connections_count,
            'messages': conversations_count,
            'match_rate': 0,
            'projects_completed': 0,
            'study_hours': 0
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activity_timeline(request):
    """Get user's activity timeline"""
    try:
        
        activities = Activity.objects.filter(user=request.user)[:10]
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
# Study Goals 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_study_goals(request):
    """Get all study goals for current user"""
    try:
        goals = StudyGoal.objects.filter(user=request.user)
        serializer = StudyGoalSerializer(goals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_study_goal(request):
    """Create a new study goal"""
    try:
        title = request.data.get('title')
        
        if not title:
            return Response(
                {'error': 'Title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal = StudyGoal.objects.create(
            user=request.user,
            title=title
        )
        
        # Create activity
        Activity.objects.create(
            user=request.user,
            activity_type='goal',
            action='Created a new study goal',
            description=title
        )
        
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_study_goal(request, goal_id):
    """Update a study goal"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        
        if 'title' in request.data:
            goal.title = request.data['title']
        
        goal.save()
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_study_goal(request, goal_id):
    """Delete a study goal"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        goal.delete()
        
        return Response(
            {'message': 'Study goal deleted successfully'},
            status=status.HTTP_200_OK
        )
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_study_goal(request, goal_id):
    """Toggle study goal completion status"""
    try:
        goal = StudyGoal.objects.get(goal_id=goal_id, user=request.user)
        
        goal.is_completed = not goal.is_completed
        if goal.is_completed:
            goal.completed_at = timezone.now()
            # Create activity
            Activity.objects.create(
                user=request.user,
                activity_type='goal',
                action='Completed a study goal',
                description=goal.title
            )
        else:
            goal.completed_at = None
        
        goal.save()
        serializer = StudyGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except StudyGoal.DoesNotExist:
        return Response(
            {'error': 'Study goal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Study Tip Generator
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_study_tip(request):
    """Get a random study tip using Anthropic API"""
    
    # Fallback tips in case API fails
    fallback_tips = [
        "Try the Pomodoro Technique: study for 25 minutes, take a 5-minute break, and after 4 cycles take a longer 15-30 minute break.",
        "Use active recall instead of passive reading. Close your notes and try to write down everything you remember, then check what you missed.",
        "Study the same material in different locations. Research shows varying your environment can improve retention.",
        "Teach what you've learned to someone else (or pretend to). The 'Feynman Technique' helps identify gaps in your understanding.",
        "Review your notes within 24 hours of taking them. This simple habit can boost retention by up to 60%.",
        "Break large tasks into smaller, specific goals. Instead of 'study biology', try 'complete 20 flashcards on cell division'.",
        "Get 7-9 hours of sleep before an exam. Sleep is when your brain consolidates memories from the day.",
        "Exercise before studying. Even a 20-minute walk can improve focus and memory formation.",
        "Use spaced repetition: review material at increasing intervals (1 day, 3 days, 1 week, 2 weeks) for long-term retention.",
        "Minimize multitasking while studying. Each task switch costs you about 25 minutes of refocused attention.",
    ]
    
    try:
        api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        
        if not api_key:
            # Return a random fallback tip if no API key
            return Response({
                'tip': random.choice(fallback_tips)
            }, status=status.HTTP_200_OK)
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": """Give me one practical, actionable study tip for university students. 
                    Make it specific, evidence-based, and immediately actionable. 
                    Keep it to 2-3 sentences max. 
                    Vary the topic — it could be about memory techniques, time management, 
                    focus strategies, group study, exam prep, note-taking, avoiding burnout, 
                    active recall, spaced repetition, sleep and cognition, etc.
                    Do not include any intro like "Here's a tip:" — just give the tip directly."""
                }
            ]
        )
        
        tip = message.content[0].text if message.content else random.choice(fallback_tips)
        
        return Response({
            'tip': tip
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error fetching study tip: {e}")
        return Response({
            'tip': random.choice(fallback_tips)
        }, status=status.HTTP_200_OK)