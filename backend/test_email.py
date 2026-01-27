import smtplib
from email.message import EmailMessage

# 👇 REPLACE WITH YOUR DETAILS
EMAIL_ADDRESS = "paint.it.onn@gmail.com"
APP_PASSWORD = "mpiq cggy rlxc hfkr"  # No spaces needed, but spaces are fine

msg = EmailMessage()
msg['Subject'] = "Test Email from RecruitPro"
msg['From'] = EMAIL_ADDRESS
msg['To'] = EMAIL_ADDRESS  # Send to yourself
msg.set_content("If you see this, the password works!")

try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL_ADDRESS, APP_PASSWORD)
        smtp.send_message(msg)
        print("✅ SUCCESS! The password is correct.")
except Exception as e:
    print(f"❌ FAILED: {e}")