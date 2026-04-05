from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from authentication.models import User
from user_profile.models import Profile
from .serializers import DiscoveryUserSerializer
from .models import MatchScore

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_users(request):
    try:
        search = request.GET.get('search', '')
        course = request.GET.get('course', '')
        year = request.GET.get('year', '')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))

        try:
            uni = request.user.profile.university_name
        except:
            uni = None

        users = User.objects.filter(
            is_verified=True, is_suspended=False, role='student',
            is_active=True, profile__university_name=uni
        ).exclude(user_id=request.user.user_id).select_related('profile')

        if search:
            users = users.filter(
                Q(profile__full_name__icontains=search) | Q(email__icontains=search) |
                Q(profile__interests__icontains=search) | Q(profile__bio__icontains=search))
        if course:
            users = users.filter(profile__course__icontains=course)
        if year:
            users = users.filter(profile__year__icontains=year)

        scored_ids = list(MatchScore.objects.filter(
            user_1=request.user, user_2__in=users
        ).order_by('-score').values_list('user_2_id', flat=True))
        
        unscored_ids = list(users.exclude(user_id__in=scored_ids).values_list('user_id', flat=True))
        all_ids = scored_ids + unscored_ids
        total = len(all_ids)

        start = (page - 1) * per_page
        page_ids = all_ids[start:start + per_page]
        
        user_map = {u.user_id: u for u in users.filter(user_id__in=page_ids)}
        paginated = [user_map[uid] for uid in page_ids if uid in user_map]

        score_map = {
            ms.user_2_id: ms.score
            for ms in MatchScore.objects.filter(user_1=request.user, user_2_id__in=page_ids)
        }
        serializer = DiscoveryUserSerializer(paginated, many=True, context={'request': request, 'score_map': score_map})

        all_profiles = Profile.objects.filter(
            user__is_verified=True, user__is_suspended=False,
            user__role='student', university_name=uni
        ).exclude(user=request.user)
        
        courses = list(all_profiles.exclude(course='').values_list('course', flat=True).distinct().order_by('course'))
        years = list(all_profiles.exclude(year='').values_list('year', flat=True).distinct().order_by('year'))

        return Response({
            'users': serializer.data,
            'pagination': {
                'total': total, 'page': page, 'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            },
            'filters': {'available_courses': courses, 'available_years': years}
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discovery_user_detail(request, user_id):
    try:
        user = User.objects.get(
            user_id=user_id, is_verified=True, is_suspended=False,
            role='student', is_active=True)
        
        if user == request.user:
            return Response({'error': 'Cannot view own profile through discovery'}, status=status.HTTP_400_BAD_REQUEST)
        
        score_map = {}
        try:
            ms = MatchScore.objects.get(user_1=request.user, user_2=user)
            score_map[user.user_id] = ms.score
        except MatchScore.DoesNotExist:
            pass
        
        serializer = DiscoveryUserSerializer(user, context={'request': request, 'score_map': score_map})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
