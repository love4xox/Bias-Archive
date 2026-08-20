import os
import json
import urllib.request
from http.server import BaseHTTPRequestHandler
from google import genai

SYSTEM_PROMPT = """
당신은 K-POP 아이돌 팬덤 문화와 최애 영업에 통달한 센스 넘치는 전문 덕질 큐레이터 '최애 아카이브' AI 에이전트입니다.
사용자가 제공한 '최애 아이돌(그룹/멤버)'과 '영업 대상 친구의 취향/포인트'를 분석하여, 친구가 당장 입덕할 수밖에 없게 만드는 '맞춤형 입덕 영업 백서'를 작성하세요.

작성 가이드:
1. 톡톡 튀고 트렌디하며 재치 있는 Y2K 팬덤 어조(이모지 💖, ✨, 💿 적절히 활용)로 작성합니다.
2. [킬링 포인트 3대 요약]과 [입덕 추천 루트(무대/자컨/갭차이)]를 명확하고 설득력 있게 구성하세요.
3. 답변의 맨 마지막 줄에는 반드시 사용자가 유튜브에서 검색해 볼 수 있도록 최애 맞춤 [추천 검색 키워드 3개]를 아래 형식으로 한 줄 추가하세요.
형식: [YOUTUBE: 키워드1, 키워드2, 키워드3]
(예: [YOUTUBE: 세븐틴 호시 스파이더 직캠, 호시 고잉세븐틴 레전드, 호시 춤선 모음])
"""

def send_discord_notification(bias_name, friend_taste, reply_summary):
    """[운영 자동화] 새로운 입덕 가이드 생성을 디스코드로 실시간 알림"""
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return

    clean_reply = reply_summary.split("[YOUTUBE:")[0].strip()

    payload = {
        "content": "💿 **[최애 아카이브] 새로운 입덕 가이드가 생성되었습니다!**",
        "embeds": [
            {
                "title": f"💖 최애 아카이브 | {bias_name} 영업 시작",
                "color": 16731533, # 버블검 핑크 (#FF4D8D)
                "fields": [
                    {"name": "🎯 상대방 취향/타겟", "value": friend_taste[:300], "inline": False},
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
        print(f"Webhook 알림 전송 에러: {e}")

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
                self._send_json(400, {'error': '최애 이름과 상대방 취향을 입력해주세요.'})
                return

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                self._send_json(500, {'error': 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.'})
                return

            user_prompt = f"""
[최애 아이돌]: {bias_name}
[상대방 취향/성향]: {friend_taste}
[추가 집중 영업 포인트]: {focus_points}

위 정보를 바탕으로 친구의 취향을 저격할 최고의 맞춤형 입덕 영업 백서를 만들어주세요!
"""

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=user_prompt,
                config={'system_instruction': SYSTEM_PROMPT}
            )

            # 운영 자동화 웹훅 전송
            send_discord_notification(bias_name, friend_taste, response.text)

            self._send_json(200, {'reply': response.text})

        except Exception as e:
            self._send_json(500, {'error': f'서버 오류: {str(e)}'})

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