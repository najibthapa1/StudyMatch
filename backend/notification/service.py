"""
Notification service — import and call these helpers from any app to create user-facing notifications
without coupling to this app's models directly from the call site.
"""

def _create(recipient, notification_type, title, message,sender=None, related_event_id='', related_user_id=''):
    from .models import UserNotification
    if recipient == sender:
        return  # never notify yourself
    UserNotification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
        related_event_id=str(related_event_id) if related_event_id else '',
        related_user_id=str(related_user_id) if related_user_id else '',
    )



def notify_connection_request(from_user, to_user):
    sender_name = _get_name(from_user)
    _create(
        recipient=to_user,
        sender=from_user,
        notification_type='connection_request',
        title='New Connection Request',
        message=f'{sender_name} wants to connect with you.',
        related_user_id=from_user.user_id,
    )


def notify_connection_accepted(acceptor, requester):
    acceptor_name = _get_name(acceptor)
    _create(
        recipient=requester,
        sender=acceptor,
        notification_type='connection_accepted',
        title='Connection Request Accepted',
        message=f'{acceptor_name} accepted your connection request.',
        related_user_id=acceptor.user_id,
    )



def notify_event_created(event, guild_members_qs):
    """Notify all guild members (excluding creator) that a new event was created."""
    creator_name = _get_name(event.created_by)
    for user in guild_members_qs.exclude(user_id=event.created_by_id):
        _create(
            recipient=user,
            sender=event.created_by,
            notification_type='event_created',
            title='New Event in Your Guild',
            message=f'{creator_name} created "{event.title}" — join before it fills up!',
            related_event_id=event.event_id,
        )


def notify_event_confirmed(event):
    """Notify all participants that their event has been confirmed."""
    participants = event.participants.all().select_related('user')
    for participant in participants:
        _create(
            recipient=participant.user,
            sender=event.created_by,
            notification_type='event_confirmed',
            title='Event Confirmed!',
            message=f'"{event.title}" has reached 3+ pre-joins and is now confirmed. See you there!',
            related_event_id=event.event_id,
        )


def notify_event_updated(event):
    """Notify all participants that an event was updated."""
    participants = event.participants.all().select_related('user')
    creator_name = _get_name(event.created_by)
    for participant in participants:
        if participant.user_id == event.created_by_id:
            continue
        _create(
            recipient=participant.user,
            sender=event.created_by,
            notification_type='event_updated',
            title='Event Updated',
            message=f'{creator_name} updated details for "{event.title}". Check the latest info.',
            related_event_id=event.event_id,
        )


def notify_event_deleted(event, participants_user_qs):
    """Notify participants that an event they joined was deleted."""
    creator_name = _get_name(event.created_by)
    for user in participants_user_qs:
        if user.user_id == event.created_by_id:
            continue
        _create(
            recipient=user,
            sender=event.created_by,
            notification_type='event_deleted',
            title='Event Cancelled',
            message=f'"{event.title}" organised by {creator_name} has been cancelled.',
        )


def notify_event_reminder(event):
    """Send 24-hour reminder to all confirmed/pre-joined participants."""
    participants = event.participants.all().select_related('user')
    for participant in participants:
        _create(
            recipient=participant.user,
            notification_type='event_reminder',
            title='Event Tomorrow ',
            message=f'Reminder: "{event.title}" is happening tomorrow at {_fmt_time(event.time_start)}.',
            related_event_id=event.event_id,
        )



def _get_name(user):
    if user is None:
        return 'Someone'
    try:
        return user.profile.full_name or user.email
    except Exception:
        return user.email


def _fmt_time(t):
    try:
        hour = t.hour
        minute = t.minute
        ampm = 'AM' if hour < 12 else 'PM'
        hour12 = hour % 12 or 12
        return f"{hour12}:{minute:02d} {ampm}"
    except Exception:
        return str(t)