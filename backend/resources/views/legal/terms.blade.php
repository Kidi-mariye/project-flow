@extends('layouts.legal')

@section('title', 'Terms of Service')

@section('content')
    <h1>Terms of Service</h1>
    <p class="updated">Effective date: {{ \Illuminate\Support\Carbon::now()->format('F j, Y') }}</p>

    <p>
        These Terms of Service ("Terms") govern your access to and use of the
        {{ config('app.name') }} service (the "Service"). By using the Service,
        you agree to these Terms.
    </p>

    <h2>Your account</h2>
    <ul>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You must provide accurate information when registering.</li>
        <li>You may not share accounts or allow others to use your account without authorization.</li>
    </ul>

    <h2>Acceptable use</h2>
    <p>You agree not to use the Service to:</p>
    <ul>
        <li>Violate any applicable law or regulation.</li>
        <li>Infringe the rights of others, including intellectual property.</li>
        <li>Upload or transmit malicious code, content that is unlawful, or content that disrupts the Service.</li>
        <li>Attempt to gain unauthorized access to the Service, other accounts, or connected systems.</li>
    </ul>

    <h2>Your content</h2>
    <p>
        You retain ownership of the content you create. You grant us a limited license
        to store, process, and display your content solely to provide the Service to you.
    </p>

    <h2>Availability</h2>
    <p>
        We aim to keep the Service available but do not guarantee uninterrupted access.
        We may temporarily suspend the Service for maintenance or security reasons.
    </p>

    <h2>Termination</h2>
    <p>
        You may stop using the Service at any time. We may suspend or terminate access
        for violations of these Terms or for conduct that harms the Service or other users.
    </p>

    <h2>Limitation of liability</h2>
    <p>
        To the maximum extent permitted by law, the Service is provided "as is" without
        warranties of any kind. We are not liable for indirect, incidental, or
        consequential damages arising from your use of the Service.
    </p>

    <h2>Changes</h2>
    <p>
        We may update these Terms from time to time. Material changes will be announced
        in the Service. Continued use after changes take effect constitutes acceptance.
    </p>
@endsection
