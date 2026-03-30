from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import UserNotification
from .serializers import UserNotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """Return paginated notifications for the logged-in user."""
    filter_type = request.GET.get('filter', 'all') 
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))

    qs = UserNotification.objects.filter(recipient=request.user)
    if filter_type == 'unread':
        qs = qs.filter(is_read=False)

    total = qs.count()
    unread_count = UserNotification.objects.filter(
        recipient=request.user, is_read=False
    ).count()

    start = (page - 1) * per_page
    end = start + per_page
    notifications = qs[start:end]

    serializer = UserNotificationSerializer(notifications, many=True)
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count,
        'pagination': {
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': max(1, (total + per_page - 1) // per_page),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = UserNotification.objects.filter(
        recipient=request.user, is_read=False
    ).count()
    return Response({'unread_count': count}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, notification_id):
    try:
        notification = UserNotification.objects.get(
            notification_id=notification_id, recipient=request.user
        )
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=['is_read', 'read_at'])
        return Response({'message': 'Marked as read'}, status=status.HTTP_200_OK)
    except UserNotification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    UserNotification.objects.filter(
        recipient=request.user, is_read=False
    ).update(is_read=True, read_at=timezone.now())
    return Response({'message': 'All marked as read'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    try:
        notification = UserNotification.objects.get(
            notification_id=notification_id, recipient=request.user
        )
        notification.delete()
        return Response({'message': 'Deleted'}, status=status.HTTP_200_OK)
    except UserNotification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    UserNotification.objects.filter(recipient=request.user).delete()
    return Response({'message': 'All notifications cleared'}, status=status.HTTP_200_OK)