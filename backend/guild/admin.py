from django.contrib import admin
from .models import Guild, Event, EventParticipant

admin.site.register(Guild)
admin.site.register(Event)
admin.site.register(EventParticipant)