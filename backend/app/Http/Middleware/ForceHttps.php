<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Redirects insecure traffic to HTTPS and adds HSTS. Gated by
 * APP_FORCE_HTTPS=true in bootstrap/app.php; pair it with TRUST_PROXIES
 * so requests behind a load balancer are detected correctly.
 */
class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isSecure()) {
            if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
                return redirect()->secure($request->getRequestUri());
            }

            abort(403, 'HTTPS is required.');
        }

        $response = $next($request);

        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        return $response;
    }
}
