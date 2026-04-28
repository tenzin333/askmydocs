import resend
import os
from dotenv import load_dotenv

load_dotenv() 


resend.api_key = os.getenv("RESEND_API_KEY") 
FRONTEND_URL = os.getenv("FRONTEND_URL")

def send_reset_email(email: str, token: str):
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    resend.Emails.send({
        "from": "AskMyDocs <onboarding@resend.dev>",
        "to": email,
        "subject": "Reset your password",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Reset your password</h2>
                <p>Click the link below to reset your password. 
                   This link expires in 1 hour.</p>
                <a href="{reset_url}" 
                   style="display: inline-block; padding: 12px 24px; 
                          background: #0f0e0d; color: #f5f0e8; 
                          border-radius: 8px; text-decoration: none;">
                    Reset Password
                </a>
                <p style="color: #8a8070; font-size: 13px; margin-top: 24px;">
                    If you didn't request this, ignore this email.
                </p>
            </div>
        """
    })