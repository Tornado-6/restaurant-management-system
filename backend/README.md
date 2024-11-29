# Restaurant Management System - Backend

## Email Configuration

For password reset functionality, you need to configure email settings.

### Option 1: Gmail SMTP (Recommended for Development)

1. Create an App Password for Gmail:
   - Go to your Google Account
   - Navigate to Security > 2-Step Verification
   - Scroll down and select "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Generate the app password

2. Set Environment Variables:
```bash
export EMAIL_HOST_USER=your_gmail_address@gmail.com
export EMAIL_HOST_PASSWORD=your_generated_app_password
export FRONTEND_URL=http://localhost:3000  # Your frontend URL
```

### Option 2: Other SMTP Providers

Modify these settings in `core/settings.py`:
```python
EMAIL_HOST = 'your_smtp_host'
EMAIL_PORT = 587  # or your provider's port
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
```

### Security Notes
- Never commit sensitive credentials to version control
- Use environment variables or a `.env` file
- For production, use a dedicated email service like SendGrid or AWS SES

## Troubleshooting
- Ensure your SMTP settings are correct
- Check firewall and network settings
- Verify app password or SMTP credentials
