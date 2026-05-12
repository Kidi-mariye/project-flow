<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ config('app.name', 'Laravel') }}</title>

        @php
            $builtCss = glob(public_path('assets/index-*.css')) ?: [];
            $builtJs = glob(public_path('assets/index-*.js')) ?: [];
        @endphp

        @if (count($builtCss) && count($builtJs))
            <link rel="stylesheet" href="{{ url('/assets/' . basename($builtCss[0])) }}" crossorigin>
            <script type="module" crossorigin src="{{ url('/assets/' . basename($builtJs[0])) }}"></script>
        @elseif (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="theme-dark">
        {{-- SPA mount point --}}
        <div id="root" style="width:100%;height:100%;"></div>
    </body>
</html>
