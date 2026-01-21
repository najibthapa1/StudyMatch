
from django.core.mail import send_mail
from django.conf import settings
import random

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(user_email, code):
    """Send verification code to user's email"""
    subject = 'Verify Your StudyMatch Account'
    message = f'''
Hello,

Thank you for registering with StudyMatch!

Your verification code is: {code}

This code will expire in 15 minutes.

If you didn't create this account, please ignore this email.

Best regards,
StudyMatch Team
    '''
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False