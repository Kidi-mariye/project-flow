@extends('layouts.legal')

@section('title', 'Privacy Policy')

@section('content')
    <h1>Privacy Policy</h1>
    <p class="updated">Effective date: {{ \Illuminate\Support\Carbon::now()->format('F j, Y') }}</p>

    <p>
        {{ config('app.name') }} ("we", "us", "our") provides this task management service
        (the "Service"). This policy explains what information we collect, how we use it,
        and the choices you have.
    </p>

    <h2>Information we collect</h2>
    <ul>
        <li><strong>Account data:</strong> name, email address, and a securely hashed password when you register.</li>
        <li><strong>Your content:</strong> tasks, projects, categories, notifications, reminders, and settings you create.</li>
        <li><strong>Usage data:</strong> IP address, browser type, and timestamps for security and operational purposes.</li>
    </ul>

    <h2>How we use information</h2>
    <ul>
        <li>To operate the Service, deliver reminders and notifications, and authenticate you.</li>
        <li>To send transactional email such as verification codes and password resets.</li>
        <li>To protect the Service against abuse, fraud, and security incidents.</li>
    </ul>

    <h2>How we store information</h2>
    <p>
        Your data is stored on our servers and protected with industry-standard safeguards.
        Passwords are hashed and never stored in plain text. Email is sent through a
        configured mail provider (see the Service's deployment documentation).
    </p>

    <h2>Sharing</h2>
    <p>
        We do not sell your personal information. We only share data with service
        providers that help us run the Service (such as email delivery) and only to
        the extent necessary to provide the Service, or as required by law.
    </p>

    <h2>Your choices</h2>
    <ul>
        <li>You may update your name and email from Settings.</li>
        <li>You may delete tasks, categories, and other content at any time.</li>
        <li>To request account deletion or a copy of your data, contact us below.</li>
    </ul>

    <h2>Contact us</h2>
    <p>
        Questions about this policy or your data should be sent to
        <a href="mailto:{{ config('legal.contact_email') }}">{{ config('legal.contact_email') }}</a>
        @if (config('legal.address'))
            or by post to {{ config('legal.address') }}
        @endif
        .
    </p>

    <h2>Children</h2>
    <p>The Service is not directed to children under 13, and we do not knowingly collect their data.</p>

    <h2>Changes</h2>
    <p>
        We may update this policy from time to time. Material changes will be announced
        in the Service. Continued use after changes take effect constitutes acceptance.
    </p>
@endsection
