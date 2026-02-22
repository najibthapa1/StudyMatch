from rest_framework import serializers
from .models import Profile, StudyGoal, Activity
from authentication.models import User

# Study Goal Serializer
class StudyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyGoal
        fields = [
            'goal_id',
            'title',
            'is_completed',
            'created_at',
            'updated_at',
            'completed_at'
        ]
        read_only_fields = ['goal_id', 'created_at', 'updated_at']

# Activity Serializer
class ActivitySerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Activity
        fields = [
            'activity_id',
            'activity_type',
            'action',
            'description',
            'created_at',
            'time_ago'
        ]
    
    def get_time_ago(self, obj):
        return obj.get_time_ago()
    
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'