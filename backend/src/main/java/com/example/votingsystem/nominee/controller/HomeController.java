package com.example.votingsystem.nominee.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String home() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bright Future API</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        min-height: 100vh;
                        background: #0a0a0f;
                        color: #e4e4e7;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        position: relative;
                    }

                    body::before {
                        content: '';
                        position: fixed;
                        inset: 0;
                        background:
                            radial-gradient(ellipse 600px 400px at 20%% 30%%, rgba(139, 92, 246, 0.12) 0%%, transparent 70%%),
                            radial-gradient(ellipse 500px 350px at 80%% 70%%, rgba(59, 130, 246, 0.10) 0%%, transparent 70%%),
                            radial-gradient(ellipse 400px 300px at 50%% 50%%, rgba(236, 72, 153, 0.06) 0%%, transparent 70%%);
                        animation: pulse 8s ease-in-out infinite alternate;
                        z-index: 0;
                    }

                    @keyframes pulse {
                        0%%   { opacity: 0.6; transform: scale(1); }
                        100%% { opacity: 1;   transform: scale(1.05); }
                    }

                    body::after {
                        content: '';
                        position: fixed;
                        inset: 0;
                        background-image:
                            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                        background-size: 60px 60px;
                        z-index: 0;
                    }

                    .container {
                        position: relative;
                        z-index: 1;
                        text-align: center;
                        max-width: 720px;
                        padding: 2rem;
                    }

                    .badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        padding: 6px 16px;
                        border-radius: 9999px;
                        background: rgba(34, 197, 94, 0.1);
                        border: 1px solid rgba(34, 197, 94, 0.25);
                        color: #4ade80;
                        font-size: 0.8rem;
                        font-weight: 600;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        margin-bottom: 2rem;
                        animation: fadeIn 0.6s ease;
                    }

                    .badge .dot {
                        width: 8px; height: 8px;
                        background: #4ade80;
                        border-radius: 50%%;
                        animation: blink 1.5s ease-in-out infinite;
                    }

                    @keyframes blink {
                        0%%, 100%% { opacity: 1; }
                        50%%       { opacity: 0.3; }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }

                    h1 {
                        font-size: 3.2rem;
                        font-weight: 800;
                        letter-spacing: -0.03em;
                        line-height: 1.1;
                        margin-bottom: 0.5rem;
                        animation: fadeIn 0.6s ease 0.1s both;
                    }

                    h1 .gradient {
                        background: linear-gradient(135deg, #8b5cf6 0%%, #6366f1 25%%, #3b82f6 50%%, #06b6d4 75%%, #8b5cf6 100%%);
                        background-size: 200%% auto;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        animation: shimmer 3s linear infinite;
                    }

                    @keyframes shimmer {
                        to { background-position: 200%% center; }
                    }

                    .subtitle {
                        font-size: 1.1rem;
                        color: #71717a;
                        font-weight: 400;
                        margin-bottom: 2.5rem;
                        animation: fadeIn 0.6s ease 0.2s both;
                    }

                    .cards {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1rem;
                        margin-bottom: 2.5rem;
                        animation: fadeIn 0.6s ease 0.3s both;
                    }

                    .card {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 16px;
                        padding: 1.5rem 1rem;
                        text-decoration: none;
                        color: inherit;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }

                    .card:hover {
                        background: rgba(255, 255, 255, 0.06);
                        border-color: rgba(139, 92, 246, 0.3);
                        transform: translateY(-4px);
                        box-shadow: 0 8px 30px rgba(139, 92, 246, 0.1);
                    }

                    .card .icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
                    .card .label { font-size: 0.85rem; font-weight: 600; color: #d4d4d8; margin-bottom: 0.25rem; }
                    .card .desc { font-size: 0.75rem; color: #71717a; }

                    .endpoints {
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 16px;
                        padding: 1.5rem;
                        text-align: left;
                        animation: fadeIn 0.6s ease 0.4s both;
                        backdrop-filter: blur(10px);
                    }

                    .endpoints h3 {
                        font-size: 0.8rem;
                        font-weight: 600;
                        color: #71717a;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        margin-bottom: 1rem;
                    }

                    .endpoint-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

                    .endpoint {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 8px 12px;
                        border-radius: 10px;
                        transition: background 0.2s;
                    }

                    .endpoint:hover { background: rgba(255, 255, 255, 0.04); }

                    .method {
                        font-size: 0.6rem;
                        font-weight: 700;
                        padding: 3px 8px;
                        border-radius: 6px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        flex-shrink: 0;
                    }

                    .method.get  { background: rgba(34, 197, 94, 0.12); color: #4ade80; }
                    .method.post { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }

                    .path {
                        font-size: 0.8rem;
                        color: #a1a1aa;
                        font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
                    }

                    .footer {
                        margin-top: 2.5rem;
                        font-size: 0.75rem;
                        color: #52525b;
                        animation: fadeIn 0.6s ease 0.5s both;
                    }

                    .footer span { color: #8b5cf6; }

                    @media (max-width: 640px) {
                        h1 { font-size: 2.2rem; }
                        .cards { grid-template-columns: 1fr; }
                        .endpoint-grid { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="badge">
                        <span class="dot"></span>
                        System Online
                    </div>

                    <h1><span class="gradient">Bright Future</span> API</h1>
                    <p class="subtitle">The Bright Future Student Awards Voting Portal &mdash; Backend v1.0</p>

                    <div class="cards">
                        <a href="/h2-console" class="card">
                            <div class="icon">&#128451;</div>
                            <div class="label">H2 Console</div>
                            <div class="desc">Browse database</div>
                        </a>
                        <a href="http://localhost:5173" class="card">
                            <div class="icon">&#127760;</div>
                            <div class="label">Frontend</div>
                            <div class="desc">Open the web app</div>
                        </a>
                        <a href="/api/public/stats" class="card">
                            <div class="icon">&#128202;</div>
                            <div class="label">Public Stats</div>
                            <div class="desc">View live stats</div>
                        </a>
                    </div>

                    <div class="endpoints">
                        <h3>&#9889; API Endpoints</h3>
                        <div class="endpoint-grid">
                            <div class="endpoint">
                                <span class="method post">POST</span>
                                <span class="path">/api/auth/login</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/events</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/categories</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/nominees</span>
                            </div>
                            <div class="endpoint">
                                <span class="method post">POST</span>
                                <span class="path">/api/vote</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/dashboard</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/results</span>
                            </div>
                            <div class="endpoint">
                                <span class="method get">GET</span>
                                <span class="path">/api/students</span>
                            </div>
                        </div>
                    </div>

                    <p class="footer">Spring Boot 3.5.4 &bull; Java 17 &bull; H2 Database &bull; Powered by <span>Bright Future</span></p>
                </div>
            </body>
            </html>
            """;
    }
}
