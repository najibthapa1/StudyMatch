from rest_framework import serializers
from authentication.models import User
from user_profile.models import Profile, StudyGoal
from connection.models import ConnectionRequest
from django.db import models

# Discovery User Serializer
class DiscoveryUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    is_connected = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()
    request_id = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    study_goals = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'profile', 'is_connected', 'connection_status', 'request_id', 'match_score', 'study_goals']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'full_name': profile.full_name,
                'bio': profile.bio,
                'university_name': profile.university_name,
                'course': profile.course,
                'year': profile.year,
                'interests': profile.interests,
                'projects': profile.projects,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_is_connected(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        # Check if connected (both directions)
        return ConnectionRequest.objects.filter(
            (models.Q(from_user=request.user, to_user=obj) | models.Q(from_user=obj, to_user=request.user)),
            status='accepted'
        ).exists()
    
    def get_connection_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        # Check if there's a pending request
        conn_request = ConnectionRequest.objects.filter(
            models.Q(from_user=request.user, to_user=obj) | 
            models.Q(from_user=obj, to_user=request.user)
        ).first()
        
        if conn_request:
            if conn_request.status == 'accepted':
                return 'accepted'
            elif conn_request.from_user == request.user:
                return 'pending_sent'
            else:
                return 'pending_received'
        return None
    
    def get_request_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        conn_request = ConnectionRequest.objects.filter(
            from_user=obj,           
            to_user=request.user,    
            status='pending'
        ).first()
        
        if conn_request:
            return str(conn_request.request_id)
        return None
    
    def get_match_score(self, obj):
        """Calculate match score using the matching algorithm"""
        request = self.context.get('request')
        if not request or not request.user:
            return 0.0
        
        try:
            from discovery.services.matching import calculate_match_score
            
            user_profile = request.user.profile
            other_profile = obj.profile
            
            score = calculate_match_score(user_profile, other_profile)
            return score
        except Exception as e:
            print(f"Error calculating match score: {e}")
            return 0.0
    
    def get_study_goals(self, obj):
        """Get the user's study goals"""
        try:
            goals = StudyGoal.objects.filter(user=obj, is_completed=False)[:5]
            return [goal.title for goal in goals]
        except:
            return []
