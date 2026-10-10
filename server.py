# -*- coding: utf-8 -*-
"""
정연수 아빠의 4개국어 & 100 위인 역사 & 자동차 대백과 & 패밀리 교육 서버
엄마/아빠 스마트폰 및 태블릿 실시간 동기화 (활동 타임라인, AI 흥미 분석, 칭찬 스티커)
"""
import http.server
import socketserver
import os
import sys
import json
import urllib.parse
import webbrowser
import socket
import threading
from datetime import datetime

PORT = 8800
FAMILY_PIN = os.environ.get("FAMILY_PIN", "7979")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "family_db.json")

def load_db():
    if not os.path.exists(DB_FILE):
        return {"profiles": {}, "stickers": [], "activities": [], "unreadForChild": {"eunchan": [], "eunwoo": []}}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading DB: {e}")
        return {"profiles": {}, "stickers": [], "activities": [], "unreadForChild": {"eunchan": [], "eunwoo": []}}

def save_db(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving DB: {e}")

def compute_analytics(db, child_id):
    activities = [a for a in db.get("activities", []) if a.get("childId") == child_id]
    total_acts = len(activities)
    
    cat_counts = {"car": 0, "history": 0, "language": 0, "dino": 0, "other": 0}
    for a in activities:
        cat = a.get("category", "other")
        if cat in cat_counts:
            cat_counts[cat] += 1
        else:
            cat_counts["other"] += 1
            
    cat_pct = {}
    for k, v in cat_counts.items():
        cat_pct[k] = round((v / total_acts * 100) if total_acts > 0 else 0, 1)

    # Top items
    top_items = [a.get("title", "") for a in activities[:5]]

    # AI coaching insight
    child_name = "은찬이" if child_id == "eunchan" else "은우"
    top_cat = max(cat_counts, key=cat_counts.get) if total_acts > 0 else "car"
    
    insights = {
        "car": f"{child_name}는 기계의 발전사와 자동차 디자인, 연혁에 남다른 탐구열과 집중력을 보이고 있습니다. 원인과 결과를 파악하는 논리적 사고력이 매우 뛰어납니다!",
        "history": f"{child_name}는 위인들의 용기와 지혜로운 일화에 깊이 몰입하고 있습니다. 이야기의 교훈을 흡수하는 공감 능력과 정의감이 쑥쑥 자라나고 있습니다!",
        "language": f"{child_name}는 4개국어 말하기와 문장 발음에 큰 흥미를 보이며 씩씩하게 소리 내어 연습하고 있습니다. 글로벌 소통 감각이 탁월합니다!",
        "dino": f"{child_name}는 신비한 공룡과 고대 생태계 탐험에 무한한 상상력과 호기심을 발휘하고 있습니다. 자연과학적 관찰력이 우수합니다!",
        "other": f"{child_name}는 다양한 분야를 골고루 탐색하며 균형 잡힌 호기심을 키워가고 있습니다!"
    }
    
    parent_tips = {
        "car": "💡 아빠 팁: 길을 건널 때 지나가는 자동차의 세대나 특징을 함께 이야기해보세요! 아이의 눈빛이 반짝거릴 거예요.",
        "history": "💡 엄마 팁: 오늘 배운 위인(이순신, 세종대왕 등)의 명언을 식사 자리에서 가볍게 칭찬과 함께 나눠보세요.",
        "language": "💡 아빠 팁: 아이가 배운 일상 인사말(Good morning, 早上好)을 아침에 자연스럽게 건네주세요.",
        "dino": "💡 엄마 팁: 주말에 공룡 화석이나 자연사 박물관 책을 함께 열어보며 호기심을 북돋워 주세요.",
        "other": "💡 부모 팁: 아이가 무엇을 눌러보든 '참 잘했어!'라는 칭찬 도장 한 방으로 큰 자신감을 선물해주세요."
    }

    return {
        "totalActivities": total_acts,
        "categoryCounts": cat_counts,
        "categoryPercentages": cat_pct,
        "topInterests": top_items,
        "aiDiagnosis": insights.get(top_cat, insights["other"]),
        "coachingTip": parent_tips.get(top_cat, parent_tips["other"])
    }

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def is_authorized(self, query):
        auth_header = self.headers.get("X-Family-Auth", "").strip()
        auth_query = query.get("auth", [""])[0].strip()
        cookie = self.headers.get("Cookie", "")
        auth_cookie = ""
        if "family_auth=" in cookie:
            auth_cookie = cookie.split("family_auth=")[1].split(";")[0].strip()

        if auth_header == FAMILY_PIN or auth_query == FAMILY_PIN or auth_cookie == FAMILY_PIN:
            return True
        return False

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 0. API: PIN 인증 여부 확인
        if path == "/api/verify_pin":
            pin = query.get("pin", [""])[0]
            is_valid = (pin == FAMILY_PIN)
            res = {"valid": is_valid, "pin": FAMILY_PIN if is_valid else None}
            body = json.dumps(res, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path.startswith("/api/") and not self.is_authorized(query):
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            err_body = json.dumps({"error": "가족 전용 보안 인증(PIN)이 필요합니다."}, ensure_ascii=False).encode("utf-8")
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
            return

        # 1. API: 전체 패밀리 DB 및 AI 분석 데이터 제공
        if path == "/api/family":
            db = load_db()
            response_data = {
                "profiles": db.get("profiles", {}),
                "stickers": db.get("stickers", []),
                "activities": db.get("activities", []),
                "analytics": {
                    "eunchan": compute_analytics(db, "eunchan"),
                    "eunwoo": compute_analytics(db, "eunwoo")
                },
                "serverTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            body = json.dumps(response_data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 2. API: 아이 화면에서 새 칭찬 스티커 도착 확인 (폴링)
        if path == "/api/check_stickers":
            child = query.get("child", ["eunchan"])[0]
            db = load_db()
            unread = db.get("unreadForChild", {}).get(child, [])
            
            if unread:
                # Clear unread after delivering
                db["unreadForChild"][child] = []
                save_db(db)

            body = json.dumps(unread, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)
        
        try:
            req_data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            req_data = {}

        # 0. API: PIN 인증 검증 (POST)
        if path == "/api/verify_pin":
            pin = req_data.get("pin", "").strip()
            is_valid = (pin == FAMILY_PIN)
            res = {"valid": is_valid, "pin": FAMILY_PIN if is_valid else None}
            res_body = json.dumps(res, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res_body)))
            self.end_headers()
            self.wfile.write(res_body)
            return

        if path.startswith("/api/") and not self.is_authorized({}):
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            err_body = json.dumps({"error": "가족 전용 보안 인증(PIN)이 필요합니다."}, ensure_ascii=False).encode("utf-8")
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
            return

        # 1. API: 부모가 스마트폰/PC에서 칭찬 스티커 쾅! 전송
        if path == "/api/sticker":
            db = load_db()
            target_child = req_data.get("targetChild", "eunchan")
            giver = req_data.get("giver", "dad")
            giver_name = "정연수 아빠" if giver == "dad" else "엄마"
            sticker_type = req_data.get("stickerType", "gold_trophy")
            icon = req_data.get("icon", "🏆" if sticker_type == "gold_trophy" else "💖")
            title = req_data.get("title", "황금 트로피 칭찬 도장")
            reason = req_data.get("reason", "스스로 씩씩하게 해냄!")

            new_sticker = {
                "id": f"stk_{int(datetime.now().timestamp() * 1000)}",
                "targetChild": target_child,
                "giver": giver,
                "giverName": giver_name,
                "stickerType": sticker_type,
                "icon": icon,
                "title": title,
                "reason": reason,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "read": False
            }

            db.setdefault("stickers", []).insert(0, new_sticker)
            
            # 아이 도장판 개수 증가 (최대 10개)
            profile = db.setdefault("profiles", {}).setdefault(target_child, {})
            current_stamps = profile.get("stampsCount", 0)
            profile["stampsCount"] = min(current_stamps + 1, profile.get("maxStamps", 10))

            # 아이 화면 실시간 팝업용 큐에 추가
            db.setdefault("unreadForChild", {}).setdefault(target_child, []).append(new_sticker)
            
            save_db(db)

            res = {"success": True, "sticker": new_sticker, "newStampsCount": profile["stampsCount"]}
            res_body = json.dumps(res, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res_body)))
            self.end_headers()
            self.wfile.write(res_body)
            return

        # 2. API: 아이 학습 활동 타임라인 기록
        if path == "/api/activity":
            db = load_db()
            child_id = req_data.get("childId", "eunchan")
            child_name = "정은찬" if child_id == "eunchan" else "정은우"
            
            new_activity = {
                "id": f"act_{int(datetime.now().timestamp() * 1000)}",
                "childId": child_id,
                "childName": child_name,
                "type": req_data.get("type", "other"),
                "icon": req_data.get("icon", "🌟"),
                "title": req_data.get("title", "학습 활동 완료"),
                "detail": req_data.get("detail", "흥미진진한 탐험을 진행했어요!"),
                "category": req_data.get("category", "other"),
                "timeSpentSec": req_data.get("timeSpentSec", 60),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "date": datetime.now().strftime("%Y-%m-%d")
            }

            db.setdefault("activities", []).insert(0, new_activity)
            # 최대 200개 유지
            if len(db["activities"]) > 200:
                db["activities"] = db["activities"][:200]

            # 프로필 마지막 활동 시간 갱신
            if child_id in db.get("profiles", {}):
                db["profiles"][child_id]["lastActive"] = datetime.now().strftime("%Y-%m-%d %H:%M")

            save_db(db)

            res = {"success": True, "activity": new_activity}
            res_body = json.dumps(res, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res_body)))
            self.end_headers()
            self.wfile.write(res_body)
            return

        # 3. API: 도장판 초기화
        if path == "/api/reset_stamps":
            db = load_db()
            child_id = req_data.get("childId", "eunchan")
            if child_id in db.get("profiles", {}):
                db["profiles"][child_id]["stampsCount"] = 0
                save_db(db)

            res = {"success": True, "stampsCount": 0}
            res_body = json.dumps(res, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res_body)))
            self.end_headers()
            self.wfile.write(res_body)
            return

        self.send_response(404)
        self.end_headers()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def open_browser():
    import time
    time.sleep(1.0)
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_local_ip()
    
    httpd = None
    for p in range(PORT, PORT + 20):
        try:
            httpd = socketserver.TCPServer(("", p), CustomHandler)
            PORT = p
            break
        except OSError:
            continue

    if not httpd:
        print("서버 포트를 열 수 없습니다.")
        sys.exit(1)

    print("=" * 65)
    print("   ★ 은찬이 & 은우 & 엄마·아빠의 패밀리 교육 서버 가동 ★")
    print("=" * 65)
    print(f" [PC 브라우저 접속] : http://localhost:{PORT}")
    print(f" [엄마/아빠 스마트폰] : http://{local_ip}:{PORT}")
    print("   (같은 와이파이에 연결된 스마트폰/아이패드에서 바로 접속!)")
    print("=" * 65)
    print(" 서버를 종료하려면 이 창을 닫거나 Ctrl+C 를 누르세요.")
    print("=" * 65)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버가 안전하게 종료되었습니다.")
