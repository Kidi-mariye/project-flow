<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class SpaController extends Controller
{
    /**
     * Serve the built React SPA. `vite build` outputs into public/ (see
     * frontend/vite.config.js), so index.html is available in production.
     * Falls back to the welcome view so development still works.
     */
    public function __invoke(Request $request)
    {
        if ($request->is('api/*') || $request->is('sanctum/*')) {
            abort(404);
        }

        $index = public_path('index.html');

        if (File::exists($index)) {
            return File::get($index);
        }

        return view('welcome');
    }
}
