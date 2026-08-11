<?php

use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

// Legal pages (rendered server-side; not part of the SPA).
Route::view('/privacy', 'legal.privacy');
Route::view('/terms', 'legal.terms');

// Serve the built React SPA. `vite build` outputs into public/ (see
// frontend/vite.config.js), so index.html is available in production.
Route::get('/', SpaController::class);

// Fallback so client-side routing (e.g. /dashboard) works in production.
// API routes and the /up health check are matched first and still respond.
Route::fallback(SpaController::class);
