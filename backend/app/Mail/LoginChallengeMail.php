<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginChallengeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $code,
        public string $purpose,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: ucfirst(str_replace(['-', '_'], ' ', $this->purpose)) . ' verification code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.login-challenge',
            with: [
                'userName' => $this->userName,
                'code' => $this->code,
                'purpose' => $this->purpose,
            ],
        );
    }
}