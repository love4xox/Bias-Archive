import os
import json
import urllib.request
from http.server import BaseHTTPRequestHandler

def send_discord_notification(bias_name, friend_taste, reply_summary):
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return

    clean_reply = reply_summary.split("[YOUTUBE:")[0].strip()

    payload = {
        "content": "💿 **[최애 아카이브] 새로운 입덕 가이드가 생성되었습니다!**",
        "embeds": [
            {
                "title": f"💖 최애 아카이브 | {bias_name} 영업 시작",
                "color": 16731533,
                "fields": [
                    {"name": "🎯 상대방 취향/타겟", "value": str(friend_taste)[:300], "inline": False},
                    {"name": "💌 AI 입덕 백서 요약", "value": clean_reply[:400] + ("..." if len(clean_reply) > 400 else ""), "inline": False}
                ],
                "footer": {"text": "최애 아카이브 운영 자동화 시스템"}
            }
        ]
    }

    try:
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=req_data,
            headers={
                'Content-Type': 'application/json; charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)'
            }
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"Webhook 전송 에러: {e}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode('utf-8')) if body else {}
            bias_name = data.get('bias_name', '')
            friend_taste = data.get('friend_taste', '')
            reply_summary = data.get('reply_summary', '')

            send_discord_notification(bias_name, friend_taste, reply_summary)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()