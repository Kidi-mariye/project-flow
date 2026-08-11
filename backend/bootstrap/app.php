<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(
            prepend: [
                \Illuminate\Http\Middleware\HandleCors::class,
            ],
        );

        // Trust proxies (load balancer / CDN / reverse proxy) so scheme,
        // host, and IP headers are honored. Set TRUST_PROXIES to "*" or a
        // comma-separated list of proxy IPs/CIDRs in production.
        $trustedProxies = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('TRUST_PROXIES', '')),
        )));

        if ($trustedProxies !== []) {
            $middleware->trustProxies(at: $trustedProxies);
        }

        // Optional HTTPS enforcement (see app/Http/Middleware/ForceHttps.php).
        if (filter_var(env('APP_FORCE_HTTPS', false), FILTER_VALIDATE_BOOL)) {
            $middleware->prepend(\App\Http\Middleware\ForceHttps::class);
        }
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
