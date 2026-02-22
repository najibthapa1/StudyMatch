from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from authentication.models import User
from user_profile.models import Profile
from .serializers import DiscoveryUserSerializer
from .services.matching import calculate_match_score


# Discovery Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_users(request):
    """Get all users for discovery page with search and filters"""
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        course = request.GET.get('course', '')
        year = request.GET.get('year', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        # Get current user's university
        try:
            current_user_university = request.user.profile.university_name
        except:
            current_user_university = None
        users = User.objects.filter(
            is_verified=True,
            is_suspended=False,
            role='student',
            is_active=True,
            profile__university_name=current_user_university  
        ).exclude(
            user_id=request.user.user_id
        ).select_related('profile')
        
        # Apply search filter
        if search:
            users = users.filter(
                Q(profile__full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__interests__icontains=search) |
                Q(profile__bio__icontains=search)
            )
        
        # Apply course filter
        if course:
            users = users.filter(profile__course__icontains=course)
        
        # Apply year filter
        if year:
            users = users.filter(profile__year__icontains=year)
        
        all_profiles = Profile.objects.filter(
            user__is_verified=True,
            user__is_suspended=False,
            user__role='student',
            university_name=current_user_university  
        ).exclude(user=request.user)
        
        available_courses = list(all_profiles.exclude(course='').values_list('course', flat=True).distinct().order_by('course'))
        available_years = list(all_profiles.exclude(year='').values_list('year', flat=True).distinct().order_by('year'))
        
        total_users = users.count()
        
        start = (page - 1) * per_page
        end = start + per_page
        paginated_users = users[start:end]
        
        serializer = DiscoveryUserSerializer(paginated_users, many=True, context={'request': request})
        
        return Response({
            'users': serializer.data,
            'pagination': {
                'total': total_users,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_users + per_page - 1) // per_page
            },
            'filters': {
                'available_courses': available_courses,
                'available_years': available_years
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_user_detail(request, user_id):
    """Get detailed view of a specific user"""
    try:
        user = User.objects.get(
            user_id=user_id,
            is_verified=True,
            is_suspended=False,
            role='student',
            is_active=True
        )
        
        if user == request.user:
            return Response(
                {'error': 'Cannot view own profile through discovery'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DiscoveryUserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
