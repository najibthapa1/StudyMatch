from rest_framework import serializers
from authentication.models import User
from user_profile.models import Profile, StudyGoal
from connection.models import ConnectionRequest
from django.db import models

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
            p = obj.profile
            return {
                'full_name': p.full_name, 'bio': p.bio,
                'university_name': p.university_name, 'course': p.course,
                'year': p.year, 'interests': p.interests, 'projects': p.projects,
                'profile_picture': p.profile_picture.url if p.profile_picture else None,
                'initials': p.get_initials(),
            }
        except:
            return None
    
    def get_is_connected(self, obj):
        req = self.context.get('request')
        if not req or not req.user:
            return False
        return ConnectionRequest.objects.filter(
            (models.Q(from_user=req.user, to_user=obj) | models.Q(from_user=obj, to_user=req.user)),
            status='accepted'
        ).exists()
    
    def get_connection_status(self, obj):
        req = self.context.get('request')
        if not req or not req.user:
            return None
        conn = ConnectionRequest.objects.filter(
            models.Q(from_user=req.user, to_user=obj) | models.Q(from_user=obj, to_user=req.user)
        ).first()
        if conn:
            if conn.status == 'accepted':
                return 'accepted'
            return 'pending_sent' if conn.from_user == req.user else 'pending_received'
        return None
    
    def get_request_id(self, obj):
        req = self.context.get('request')
        if not req or not req.user:
            return None
        conn = ConnectionRequest.objects.filter(from_user=obj, to_user=req.user, status='pending').first()
        return str(conn.request_id) if conn else None
    
    def get_match_score(self, obj):
        score_map = self.context.get('score_map', {})
        score = score_map.get(obj.user_id)
        if score is not None:
            return float(score)
        
        req = self.context.get('request')
        if not req or not req.user:
            return 0.0
        try:
            from discovery.services.matching import calculate_match_score
            return calculate_match_score(req.user.profile, obj.profile)
        except Exception as e:
            print(f"Error calculating match score: {e}")
            return 0.0
    
    def get_study_goals(self, obj):
        try:
            goals = StudyGoal.objects.filter(user=obj, is_completed=False)[:5]
            return [g.title for g in goals]
        except:
            return []
