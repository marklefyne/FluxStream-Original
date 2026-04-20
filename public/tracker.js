// Oracle Tracking System - StreamEx v1.0
const SUPABASE_URL = 'https://muehmdtvffnxpjanoqqm.supabase.co'; // תחליף בכתובת ה-URL שלך מ-Supabase
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWhtZHR2ZmZueHBqYW5vcXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjQ2MDAsImV4cCI6MjA5MTk0MDYwMH0.u1JN1hoO7r0PzugmReaGiL2SLEvbdvKPS_u639byR1s'; // תחליף במפתח ה-Anon שלך

const tracker = {
    nodeId: localStorage.getItem('node_id') || 'node_' + Math.random().toString(36).substr(2, 9),
    
    async init() {
        // שמירת ה-ID של המשתמש אם זה ביקור ראשון
        if (!localStorage.getItem('node_id')) {
            localStorage.setItem('node_id', this.nodeId);
        }

        // 1. רישום ה-Node (המכשיר) בטבלה
        await this.registerNode();

        // 2. מעקב אחרי צפיות (בכל פעם שהכתובת משתנה)
        this.trackView();
        
        // 3. הפעלת Heartbeat כל 60 שניות
        setInterval(() => this.sendHeartbeat(), 60000);

        console.log('Oracle Tracker Active:', this.nodeId);
    },

    async registerNode() {
        const payload = {
            node_id: this.nodeId,
            device_type: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
            cpu_cores: navigator.hardwareConcurrency || 0,
            last_seen: new Date().toISOString()
        };

        await fetch(`${SUPABASE_URL}/rest/v1/nodes?node_id=eq.${this.nodeId}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
        });
    },

    async trackView() {
        // בודק אם אנחנו בדף של סרט (לפי ה-URL)
        const path = window.location.pathname;
        if (path.includes('/watch/')) {
            const contentId = path.split('/').pop();
            
            await fetch(`${SUPABASE_URL}/rest/v1/content_views`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tmdb_id: contentId,
                    last_viewed: new Date().toISOString()
                })
            });
        }
    },

    async sendHeartbeat() {
        await fetch(`${SUPABASE_URL}/rest/v1/nodes?node_id=eq.${this.nodeId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ last_seen: new Date().toISOString() })
        });
    }
};

// הפעלה
tracker.init();
