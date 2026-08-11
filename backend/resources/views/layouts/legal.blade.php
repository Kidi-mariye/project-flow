<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Legal') · {{ config('app.name') }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
            line-height: 1.7;
        }
        .wrap {
            max-width: 760px;
            margin: 0 auto;
            padding: 32px 20px 64px;
        }
        header.site {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            padding: 18px 24px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }
        header.site .brand {
            font-weight: 800;
            font-size: 1.05rem;
            color: #0f172a;
            text-decoration: none;
        }
        header.site nav { display: flex; gap: 18px; }
        header.site nav a {
            color: #0f766e;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
        }
        header.site nav a:hover { text-decoration: underline; }
        main.card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 32px;
            margin-top: 24px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
        }
        main.card h1 {
            margin: 0 0 6px;
            font-size: 1.7rem;
            color: #0f172a;
        }
        main.card .updated { color: #64748b; font-size: 0.85rem; margin: 0 0 24px; }
        main.card h2 {
            margin: 28px 0 8px;
            font-size: 1.15rem;
            color: #0f172a;
        }
        main.card p, main.card li { color: #475569; }
        main.card ul { padding-left: 22px; }
        footer {
            text-align: center;
            color: #94a3b8;
            font-size: 0.82rem;
            margin-top: 28px;
        }
        footer a { color: #0f766e; }
        @media (max-width: 640px) {
            main.card { padding: 22px; }
        }
    </style>
</head>
<body>
    <header class="site">
        <a class="brand" href="/">{{ config('app.name') }}</a>
        <nav>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/">Home</a>
        </nav>
    </header>

    <div class="wrap">
        <main class="card">
            @yield('content')
        </main>
        <footer>
            {{ config('app.name') }} · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </footer>
    </div>
</body>
</html>
