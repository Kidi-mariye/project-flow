<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 600px;
            margin: 0 auto;
            padding: 24px;
            background: #f8fafc;
        }
        .container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        }
        .eyebrow {
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 12px;
            font-weight: 700;
            margin: 0 0 12px 0;
        }
        h1 {
            margin: 0 0 12px 0;
            color: #0f172a;
            font-size: 24px;
        }
        .code {
            display: inline-block;
            margin: 18px 0;
            padding: 14px 20px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ccfbf1, #dbeafe);
            color: #0f172a;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.18em;
        }
        .note {
            color: #64748b;
            font-size: 14px;
            margin-top: 16px;
        }
        .footer {
            margin-top: 24px;
            padding-top: 18px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 12px;
        }
    </style>
</head>
<body>
    @php
        $purposeLabel = $purpose === 'password-reset'
            ? 'password reset'
            : str_replace(['-', '_'], ' ', $purpose) . ' sign-in';
        $expiryMinutes = $purpose === 'password-reset' ? 30 : 10;
    @endphp
    <div class="container">
        <p class="eyebrow">Task Manager</p>
        <h1>Hello {{ $userName }},</h1>
        <p>You requested a {{ $purposeLabel }} code. Use the code below to continue:</p>
        <div class="code">{{ $code }}</div>
        <p class="note">This code expires in {{ $expiryMinutes }} minutes. If you did not request this, you can ignore this email.</p>
        <div class="footer">
            This message was sent automatically by Task Manager.
        </div>
    </div>
</body>
</html>