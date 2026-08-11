<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Legal identity
    |--------------------------------------------------------------------------
    |
    | Company details shown on the public Privacy Policy and Terms of Service
    | pages. Set these in your .env (or .env.example) before going live:
    |
    |   LEGAL_COMPANY_NAME="Your Company Ltd"
    |   LEGAL_ADDRESS="1 Example Street, City, Country"
    |   LEGAL_CONTACT_EMAIL=legal@yourdomain.com
    |   LEGAL_JURISDICTION="England and Wales"
    |
    */

    'company_name' => env('LEGAL_COMPANY_NAME', config('app.name', 'Task Manager')),

    'address' => env('LEGAL_ADDRESS', ''),

    'contact_email' => env('LEGAL_CONTACT_EMAIL', env('MAIL_FROM_ADDRESS', '')),

    'jurisdiction' => env('LEGAL_JURISDICTION', ''),

];
