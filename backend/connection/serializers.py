from rest_framework import serializers
from .models import ConnectionRequest

# Connection Request Serializer
class ConnectionRequestSerializer(serializers.ModelSerializer):
    from_user_profile = serializers.SerializerMethodField()
    to_user_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = ConnectionRequest
        fields = ['request_id', 'from_user', 'to_user', 'from_user_profile', 'to_user_profile', 'status', 'created_at']
        read_only_fields = ['request_id', 'created_at']
    
    def get_from_user_profile(self, obj):
        try:
            profile = obj.from_user.profile
            return {
                'full_name': profile.full_name,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None
    
    def get_to_user_profile(self, obj):
        try:
            profile = obj.to_user.profile
            return {
                'full_name': profile.full_name,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'initials': profile.get_initials(),
            }
        except:
            return None