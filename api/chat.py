import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

SYSTEM_PROMPT = """
당신은 K-POP 아이돌 팬덤 문화와 최애 영업에 통달한 전문 덕질 큐레이터 '최애 아카이브' AI 에이전트입니다.
친구의 심장을 저격할 맞춤형 '입덕 백서'를 작성해 주세요.

[작성 규칙]
1. 톡톡 튀고 트렌디한 Y2K 팬덤 구어체('~해!', '~라구!', 이모지 💖, ✨, 💿 적절히 활용)로 작성하세요.
2. [킬링 포인트 3대 요약]과 [3단계 입덕 루트]를 명확하고 설득력 있게 구성하세요.
3. 답변의 맨 마지막 줄에는 반드시 아래 형식으로 추천 검색 키워드 3개를 한 줄 추가하세요.
형식: [YOUTUBE: 키워드1, 키워드2, 키워드3]
"""

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
        urllib.request.urlopen(req, timeout=3)
    except Exception as e:
        print(f"Webhook 전송 에러: {e}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode('utf-8')) if body else {}
            bias_name = data.get('biasName', '').strip()
            friend_taste = data.get('friendTaste', '').strip()
            focus_points = data.get('focusPoints', '')

            if not bias_name or not friend_taste:
                self._send_json(400, {'error': '최애 이름과 취향을 모두 입력해 주세요.'})
                return

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                self._send_json(500, {'error': 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.'})
                return

            focus_points_text = ', '.join(focus_points) if isinstance(focus_points, list) else str(focus_points)
            prompt_text = f"""
- 최애 아이돌: {bias_name}
- 친구의 취향: {friend_taste}
- 집중 영업 포인트: {focus_points_text}

위 정보를 바탕으로 친구의 취향을 저격할 최고의 맞춤형 입덕 영업 백서를 만들어주세요!
"""

            # Gemini 1.5 Flash Direct REST API 호출
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
            gemini_payload = {
                "system_instruction": {
                    "parts": [{"text": SYSTEM_PROMPT}]
                },
                "contents": [
                    {
                        "parts": [{"text": prompt_text}]
                    }
                ]
            }

            req = urllib.request.Request(
                endpoint,
                data=json.dumps(gemini_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )

            with urllib.request.urlopen(req, timeout=25) as response:
                result_raw = response.read().decode('utf-8')
                result_json = json.loads(result_raw)
                
                # 텍스트 응답 추출
                reply_text = ""
                try:
                    candidates = result_json.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            reply_text = parts[0].get("text", "")
                except Exception:
                    pass

                if not reply_text:
                    reply_text = "입덕 가이드 생성 응답을 가져오지 못했습니다."

                send_discord_notification(bias_name, friend_taste, reply_text)
                self._send_json(200, {'reply': reply_text})

        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            self._send_json(e.code, {'error': f'Gemini API 오류 ({e.code}): {err_msg}'})
        except Exception as e:
            self._send_json(500, {'error': f'서버 처리 오류: {str(e)}'})

    def _send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()