from .models import UserNotification


def _create(recipient, ntype, title, msg, sender=None, event_id='', user_id=''):
    if recipient == sender:
        return
    UserNotification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=ntype,
        title=title,
        message=msg,
        related_event_id=str(event_id) if event_id else '',
        related_user_id=str(user_id) if user_id else '',
    )


def _name(user):
    if not user:
        return 'Someone'
    try:
        return user.profile.full_name or user.email
    except AttributeError:
        return user.email


def _time_str(t):
    try:
        h = t.hour
        m = t.minute
        ampm = 'AM' if h < 12 else 'PM'
        h12 = h % 12 or 12
        return f"{h12}:{m:02d} {ampm}"
    except:
        return str(t)


def notify_connection_request(from_user, to_user):
    _create(
        to_user, 'connection_request', 'New Connection Request',
        f'{_name(from_user)} wants to connect with you.',
        sender=from_user, user_id=from_user.user_id
    )


def notify_connection_accepted(acceptor, requester):
    _create(
        requester, 'connection_accepted', 'Connection Accepted',
        f'{_name(acceptor)} accepted your connection request.',
        sender=acceptor, user_id=acceptor.user_id
    )


def notify_event_created(event, members_qs):
    creator = _name(event.created_by)
    for user in members_qs.exclude(user_id=event.created_by_id):
        _create(
            user, 'event_created', 'New Guild Event',
            f'{creator} created "{event.title}"',
            sender=event.created_by, event_id=event.event_id
        )


def notify_event_confirmed(event):
    participants = event.participants.all().select_related('user')
    for p in participants:
        _create(
            p.user, 'event_confirmed', 'Event Confirmed',
            f'"{event.title}" has 3+ pre-joins and is now confirmed!',
            sender=event.created_by, event_id=event.event_id
        )


def notify_event_updated(event):
    participants = event.participants.all().select_related('user')
    creator = _name(event.created_by)
    for p in participants:
        if p.user_id == event.created_by_id:
            continue
        _create(
            p.user, 'event_updated', 'Event Updated',
            f'{creator} updated "{event.title}"',
            sender=event.created_by, event_id=event.event_id
        )


def notify_event_deleted(event, users_qs):
    creator = _name(event.created_by)
    for user in users_qs:
        if user.user_id == event.created_by_id:
            continue
        _create(
            user, 'event_deleted', 'Event Cancelled',
            f'"{event.title}" by {creator} was cancelled.',
            sender=event.created_by
        )


def notify_event_reminder(event):
    participants = event.participants.all().select_related('user')
    for p in participants:
        _create(
            p.user, 'event_reminder', 'Event Tomorrow',
            f'"{event.title}" is tomorrow at {_time_str(event.time_start)}',
            event_id=event.event_id
        )