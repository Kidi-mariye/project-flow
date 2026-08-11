# Mail Provider Checklist

The application sends transactional email in production:

- **2FA login codes** (`LoginChallengeMail`) — sent when a user signs in and has two-factor verification enabled
- **Magic-link login codes** (`LoginChallengeMail`) — sent for passwordless login
- **Task reminders** (`TaskReminderMail`) — sent by the `php artisan tasks:send-reminders` scheduler command

If `MAIL_MAILER=log` (the local default), none of these emails are actually delivered — they are only written to the log file. A production environment must use SMTP or a real provider.

---

## Choose a Provider

| Provider | Laravel `MAIL_MAILER` | Notes |
| --- | --- | --- |
| Generic SMTP (Mailtrap, Gmail, etc.) | `smtp` | Simplest; works with any provider that exposes SMTP |
| Mailgun | `smtp` | Use their SMTP host, or the API transport with a custom config |
| Amazon SES | `ses` | Requires IAM credentials; cheapest at scale |
| Postmark | `postmark` | `POSTMARK_API_KEY` from your Postmark server |
| Resend | `resend` | `RESEND_API_KEY` from your Resend account |

> Providers like Mailgun/Postmark/Resend require the sending domain (the one in `MAIL_FROM_ADDRESS`) to be **verified** in their dashboard and DNS records added before email is delivered.

---

## SMTP Checklist

Use this for `MAIL_MAILER=smtp`:

1. Set `MAIL_MAILER=smtp`
2. Set `MAIL_HOST` (e.g. `smtp.mailgun.org`, `smtp.resend.com`)
3. Set `MAIL_PORT` (usually `587` with TLS, or `465` for SSL)
4. Set `MAIL_USERNAME` and `MAIL_PASSWORD` from your provider
5. Set `MAIL_ENCRYPTION=tls` (or `ssl` if using port 465)
6. Set `MAIL_FROM_ADDRESS` to a real, verified address (not `hello@example.com`)
7. Set `MAIL_FROM_NAME` to your app display name (defaults to `APP_NAME`)
8. Optionally set `MAIL_EHLO_DOMAIN` to your sending domain

## Provider Quick Configs

### Amazon SES

```dotenv
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
```

### Postmark

```dotenv
MAIL_MAILER=postmark
POSTMARK_API_KEY=your-postmark-server-token
```

### Resend

```dotenv
MAIL_MAILER=resend
RESEND_API_KEY=re_xxxxxxxx
```

### Mailgun via SMTP

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@yourdomain.com
MAIL_PASSWORD=your-mailgun-smtp-password
MAIL_ENCRYPTION=tls
```

---

## Verify It Works

After updating `.env`, run `php artisan config:clear` (or `php artisan config:cache` in production) so the new values take effect, then send a test:

```bash
php artisan tinker --execute="Mail::raw('Mail provider check', function (\$m) { \$m->to('you@example.com'); });"
```

If that succeeds, test an app email end-to-end by requesting a 2FA or magic-link login and confirming the code arrives.

---

## Production Do's and Don'ts

- **Do** keep the `log` mailer for local development.
- **Do** use a transactional provider with deliverability support rather than a personal mailbox.
- **Do** verify your sending domain and `MAIL_FROM_ADDRESS` with the provider.
- **Don't** use `MAIL_FROM_ADDRESS="hello@example.com"` in production — recipients will reject or spam-filter it.
- **Don't** commit real `MAIL_USERNAME`/`MAIL_PASSWORD`/API keys — they belong in the host's deployment secrets, not in the repo.
