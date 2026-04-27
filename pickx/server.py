from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import requests
import json
import os
import random
from itertools import combinations
from datetime import datetime
import math
from typing import List, Optional, Dict
from pymongo import MongoClient

# VAPID Keys for Web Push
VAPID_PUBLIC_KEY = "BDm7xzKt_L1jVB6EqXehXKFJqGj93ubeCLMKzvMeSJlWDMhpZM24F1oQxQS0zVNpD4rlXcBWLgOv0KhEW-cv5Pc"
VAPID_PRIVATE_KEY = "ELBJ-KQJLnQ71OoAACqlDpuysojOzAulCHrf-4sh2bM"
VAPID_CLAIMS = {"sub": "mailto:admin@pickx.app"}

# Predefined pool of 100 unique avatars (Seeds 1-100)
AVATAR_POOL = [
    f"https://api.dicebear.com/7.x/avataaars/svg?seed=pickx_{i}" for i in range(1, 101)
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

DB_FILE = "pickx_database.db"
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://quanle2212_db_user:eDxVWzCSeYYHrv7N@pickxdb.3hafbwh.mongodb.net/?appName=PickxDb")

def get_mongo_client():
    if not MONGO_URI:
        return None
    try:
        client = MongoClient(MONGO_URI)
        return client
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return None

def load_db():
    client = get_mongo_client()
    if client:
        try:
            db = client["pickx_db"]
            collection = db["state"]
            doc = collection.find_one({"_id": "main_state"})
            client.close()
            if doc:
                # Remove MongoDB internal _id before returning
                if "_id" in doc: del doc["_id"]
                return doc
        except Exception as e:
            print(f"MongoDB Load Error: {e}")

    # Fallback to local file
    if not os.path.exists(DB_FILE):
        return {"players": [], "matches": [], "live_schedule": [], "live_rest": []}
    with open(DB_FILE, "r") as f:
        try:
            data = json.load(f)
        except:
            data = {"players": [], "matches": [], "live_schedule": [], "live_rest": []}
            
        if "live_schedule" not in data: data["live_schedule"] = []
        if "live_rest" not in data: data["live_rest"] = []
        
        changed = False
        for p in data["players"]:
            if "password" not in p:
                p["password"] = "123456"
                changed = True
            if "streak" not in p: p["streak"] = 0
            if "rest_count" not in p: p["rest_count"] = 0
            if "badges" not in p: p["badges"] = []
            if "partnerships" not in p: p["partnerships"] = {}
            if "avatar_url" not in p:
                p["avatar_url"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={p['name']}"
            if "id" not in p: 
                p["id"] = str(random.randint(1000, 9999))
                changed = True
            if "mmr" not in p:
                p["mmr"] = p.get("elo", 1000)
                changed = True
                
        if changed:
            save_db(data)
                
        return data

def save_db(data):
    client = get_mongo_client()
    if client:
        try:
            db = client["pickx_db"]
            collection = db["state"]
            collection.replace_one({"_id": "main_state"}, data, upsert=True)
            client.close()
            return
        except Exception as e:
            print(f"MongoDB Save Error: {e}")

    # Fallback to local file
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Formatters to match React Frontend Expectation
def format_player(p):
    return {
        "id": p.get("id"),
        "name": p["name"],
        "handle": p["name"].lower().replace(" ", ""),
        "elo": round(p["elo"]),
        "wins": p["wins"],
        "losses": p["losses"],
        "streak": p.get("streak", 0),
        "avatar_url": p.get("avatar_url"),
        "joinedAt": p.get("joinedAt", "2024-01-01"),
        "badges": p.get("badges", []),
        "isActive": True
    }

def format_match(m):
    db = load_db()
    name_to_id = {p["name"]: p.get("id") for p in db["players"]}
    
    t1_ids = [name_to_id.get(n, n) for n in m["t1_names"]]
    t2_ids = [name_to_id.get(n, n) for n in m["t2_names"]]
    
    if "eloDelta" in m:
        delta_map = {name_to_id.get(n, n): d for n, d in m["eloDelta"].items()}
    else:
        delta_map = {
            **{pid: m.get("t1_change", 0) for pid in t1_ids},
            **{pid: m.get("t2_change", 0) for pid in t2_ids}
        }
        
    return {
        "id": m.get("id", str(random.randint(1000,9999))),
        "playedAt": m["date"] if "T" in m.get("date", "") else m.get("date", "2020-01-01").replace("/", "-") + "T12:00:00Z", # rough shim
        "team1": { "playerIds": t1_ids, "score": m["t1_score"] },
        "team2": { "playerIds": t2_ids, "score": m["t2_score"] },
        "winner": 1 if m["t1_score"] > m["t2_score"] else 2,
        "eloDelta": delta_map
    }

def send_push_notification(player_id, message_data):
    data = load_db()
    player = next((p for p in data["players"] if p["id"] == player_id), None)
    if not player or "push_subscription" not in player:
        return

    try:
        webpush(
            subscription_info=player["push_subscription"],
            data=json.dumps(message_data),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        print(f"Sent push to {player['name']}")
    except WebPushException as ex:
        print(f"Failed to send push: {ex}")
        if ex.response and ex.response.status_code in [404, 410]:
            player.pop("push_subscription", None)
            save_db(data)

@app.get("/api/players")
def get_players():
    db = load_db()
    return [format_player(p) for p in db["players"]]

@app.get("/api/players/{player_id}")
def get_player(player_id: str):
    db = load_db()
    for p in db["players"]:
        if p.get("id") == player_id:
            return format_player(p)
    raise HTTPException(status_code=404, detail="Player not found")

@app.get("/api/matches")
def get_matches():
    db = load_db()
    return [format_match(m) for m in db["matches"]]

@app.get("/api/live_courts")
def get_live_courts():
    db = load_db()
    courts = []
    name_to_id = {p["name"]: p.get("id") for p in db["players"]}
    
    # Track court index within each round for labelling
    round_court_counter = {}
    # Check if there are multiple rounds
    unique_rounds = set()
    for entry in db["live_schedule"]:
        if len(entry) == 5 and isinstance(entry[0], int):
            unique_rounds.add(entry[0])
    multi_round = len(unique_rounds) > 1
    
    for i, entry in enumerate(db["live_schedule"]):
        if len(entry) == 5 and isinstance(entry[0], int):
            round_num, t1, t2, a1, a2 = entry
            round_court_counter[round_num] = round_court_counter.get(round_num, 0) + 1
            court_idx = round_court_counter[round_num]
            court_name = f"Vòng {round_num} · Sân {court_idx}" if multi_round else f"Sân {court_idx}"
        else:
            t1, t2 = entry[0], entry[1]
            court_name = f"Sân {i+1}"
        
        t1_ids = [name_to_id.get(n, n) for n in t1]
        t2_ids = [name_to_id.get(n, n) for n in t2]
        courts.append({
            "id": f"c{i}",
            "name": court_name,
            "status": "warmup",
            "team1": t1_ids,
            "team2": t2_ids,
            "scoreT1": 0,
            "scoreT2": 0
        })
    bench = [name_to_id.get(n, n) for n in db.get("live_rest", [])]
    return {"courts": courts, "bench": bench}

class AuthRequest(BaseModel):
    pin: str

@app.post("/api/admin/auth")
def auth(req: AuthRequest):
    if req.pin == "1234":
        return {"success": True}
    return {"success": False}

class UserLoginParams(BaseModel):
    username: str
    password: str

@app.post("/api/login/user")
def login_user(req: UserLoginParams):
    db = load_db()
    u = req.username.strip().lower()
    if u.startswith("@"): u = u[1:]
    
    for p in db["players"]:
        p_handle = p["name"].lower().replace(" ", "")
        if p_handle == u and p.get("password") == req.password:
            return {"success": True, "player_id": p.get("id")}
            
    raise HTTPException(status_code=401, detail="Sai username hoặc mật khẩu")

class MakeMatchParams(BaseModel):
    playerIds: List[str]

@app.post("/api/matchmaker")
def run_matchmaker(req: MakeMatchParams):
    db = load_db()
    id_to_player = {p.get("id"): p for p in db["players"]}
    selected = [id_to_player[pid] for pid in req.playerIds if pid in id_to_player]
    
    if len(selected) < 4:
        raise HTTPException(status_code=400, detail="Cần ít nhất 4 người chơi.")
    
    # FAIRNESS 1: Session-based Rotation
    # Calculate how many times each player played in the last 15 matches
    recent_play_counts = {p["name"]: 0 for p in selected}
    for m in db["matches"][:15]:
        for name in m.get("t1_names", []) + m.get("t2_names", []):
            if name in recent_play_counts:
                recent_play_counts[name] += 1
                
    # Shuffle first to break ties randomly, then sort by recent plays (ascending)
    # This guarantees people who sat out recently get to play first.
    random.shuffle(selected)
    selected.sort(key=lambda x: recent_play_counts[x["name"]])
    
    num_playing = (len(selected) // 4) * 4
    players_to_play = selected[:num_playing]
    players_to_rest = selected[num_playing:]
    
    names = [p["name"] for p in players_to_play]
    # CORE ALGORITHM: Use Hidden MMR for matchmaking, not visible Elo
    skill_map = {p["name"]: p.get("mmr", p["elo"]) for p in players_to_play}
    
    # 1. Build Recent History Map for Rotation Penalty
    # We now track the last 2 matches for each player to prevent repeats
    recent_history = {} # name -> list of { 'partner': name, 'opps': set(names) }
    for m in db["matches"][:30]: # Scan deeper to find the last 2 matches
        t1 = set(m.get("t1_names", []))
        t2 = set(m.get("t2_names", []))
        all_m = t1 | t2
        for p in all_m:
            if p not in recent_history:
                recent_history[p] = []
            
            # Keep up to 2 recent matches for rotation memory
            if len(recent_history[p]) < 2:
                if p in t1:
                    partner = next((x for x in t1 if x != p), None)
                    opps = t2
                else:
                    partner = next((x for x in t2 if x != p), None)
                    opps = t1
                recent_history[p].append({ "partner": partner, "opps": opps })

    full_schedule = []
    best_round_partition = None
    best_total_score = float("inf")
    
    # Optimization: 3000 trials for better rotation + balance
    for _ in range(3000):
        shuffled = random.sample(names, len(names))
        current_partition = []
        current_total_score = 0
        
        for i in range(0, len(shuffled), 4):
            group = shuffled[i:i+4]
            splits = [
                ([group[0], group[1]], [group[2], group[3]]),
                ([group[0], group[2]], [group[1], group[3]]),
                ([group[0], group[3]], [group[1], group[2]]),
            ]
            
            best_split = None
            best_split_score = float("inf")
            
            for t1, t2 in splits:
                a1 = (skill_map[t1[0]] + skill_map[t1[1]]) / 2
                a2 = (skill_map[t2[0]] + skill_map[t2[1]]) / 2
                gap = abs(a1 - a2)
                
                # Penalty Logic
                penalty = 0
                
                # 2. All-time partnership penalty
                for p_name in t1 + t2:
                    partner = next(x for x in (t1 if p_name in t1 else t2) if x != p_name)
                    p_obj = next(p for p in db["players"] if p["name"] == p_name)
                    penalty += p_obj.get("partnerships", {}).get(partner, 0) * 100
                
                # 3. STRICT ROTATION PENALTY (Avoid repeats in the last 2 matches)
                for p_name in t1 + t2:
                    history_list = recent_history.get(p_name, [])
                    if not history_list: continue
                    
                    is_t1 = p_name in t1
                    my_team = t1 if is_t1 else t2
                    opp_team = t2 if is_t1 else t1
                    current_partner = next(x for x in my_team if x != p_name)
                    
                    for idx, history in enumerate(history_list):
                        weight = 1.0 if idx == 0 else 0.7 # Penalty is slightly lower for the 2nd match back
                        
                        if current_partner == history["partner"]:
                            penalty += 1500 * weight # Same partner again
                        for opp in opp_team:
                            if opp in history["opps"]:
                                penalty += 400 * weight # Same opponent again

                score = gap + penalty
                if score < best_split_score:
                    best_split_score = score
                    best_split = (t1, t2, a1, a2)
            
            current_partition.append(best_split)
            current_total_score += best_split_score
            
        if current_total_score < best_total_score:
            best_total_score = current_total_score
            best_round_partition = current_partition
            
    courts = []
    name_to_id = {p["name"]: p.get("id") for p in db["players"]}
    
    for i, (t1, t2, a1, a2) in enumerate(best_round_partition):
        t1_ids = [name_to_id.get(n, n) for n in t1]
        t2_ids = [name_to_id.get(n, n) for n in t2]
        courts.append({
            "id": f"c{i}",
            "name": f"Sân {i+1}",
            "status": "proposed",
            "team1": t1_ids,
            "team2": t2_ids,
            "scoreT1": 0,
            "scoreT2": 0
        })
        
    bench = [name_to_id.get(n, n) for n in [p["name"] for p in players_to_rest]]
    return {"courts": courts, "bench": bench}

class RecordMatchParams(BaseModel):
    team1Ids: List[str]
    team2Ids: List[str]
    score1: int
    score2: int
    targetScore: int = 11
    court_name: Optional[str] = None

@app.post("/api/matches")
def record_match(req: RecordMatchParams):
    db = load_db()
    players_map = {p.get("id"): p for p in db["players"]}
    
    id_list = req.team1Ids + req.team2Ids
    if len(set(id_list)) < 4:
        raise HTTPException(status_code=400, detail="Cần 4 người chơi khác nhau.")
    
    hi, lo = max(req.score1, req.score2), min(req.score1, req.score2)
    if req.score1 == req.score2:
        raise HTTPException(status_code=400, detail="Tỉ số không được hoà.")
    if hi < req.targetScore:
        raise HTTPException(status_code=400, detail=f"Phải đánh đến ít nhất {req.targetScore} điểm.")
    if (hi - lo) < 2:
        raise HTTPException(status_code=400, detail="Phải thắng cách biệt ít nhất 2 điểm.")
        
    t1_p1 = players_map[req.team1Ids[0]]
    t1_p2 = players_map[req.team1Ids[1]]
    t2_p1 = players_map[req.team2Ids[0]]
    t2_p2 = players_map[req.team2Ids[1]]
    
    t1_won = req.score1 > req.score2
    score_gap = abs(req.score1 - req.score2)
    aps_t1 = req.score1 / (req.score1 + req.score2)
    
    # PickX TrueSkill Algorithm (High Magnitude)
    t1_avg_mmr = (t1_p1.get("mmr", t1_p1["elo"]) + t1_p2.get("mmr", t1_p2["elo"])) / 2
    t2_avg_mmr = (t2_p1.get("mmr", t2_p1["elo"]) + t2_p2.get("mmr", t2_p2["elo"])) / 2
    
    p_t1 = 1 / (1 + 10 ** ((t2_avg_mmr - t1_avg_mmr) / 400))
    bonus_multiplier = 1.08 if req.targetScore == 15 else 1.0
    
    # Continuous Margin of Victory (MoV) Multiplier
    mov_mult = math.log2(score_gap + 1)
    
    player_deltas = {}
    
    # Update each player
    for pid in id_list:
        p = players_map[pid]
        is_t1 = pid in req.team1Ids
        won = (is_t1 and t1_won) or (not is_t1 and not t1_won)
        
        p_win = p_t1 if is_t1 else (1 - p_t1)
        aps = aps_t1 if is_t1 else (1 - aps_t1)
        w_val = 1.0 if won else 0.0
        
        # 1. Dynamic Confidence Factor (K_effective)
        total_games = p["wins"] + p["losses"]
        k_base = 60 if total_games < 15 else 32
        k_effective = k_base * mov_mult
        
        # 2. Update Hidden MMR (60% Win Outcome, 40% Point Share)
        mmr_change = k_effective * bonus_multiplier * (0.6 * (w_val - p_win) + 0.4 * (aps - p_win))
        p["mmr"] = p.get("mmr", p["elo"]) + mmr_change
        
        # 3. Update Visible Rating (Elo)
        base_gain = (k_effective * 0.7) * bonus_multiplier * (w_val - p_win)
        gap = p["mmr"] - p["elo"]
        
        if won:
            elo_change = max(2.0, base_gain + 0.2 * gap)
        else:
            elo_change = min(-2.0, base_gain + 0.2 * gap)
            
        p["elo"] = round(p["elo"] + elo_change)
        player_deltas[p["name"]] = round(elo_change)
        
        # --- Generate Performance Comment ---
        if won:
            if score_gap >= 7:
                p["last_comment"] = random.choice(["Huỷ diệt quá! 🥶", "Quá cháy! 🔥", "Đánh như chẻ tre! 🚀"])
            elif score_gap <= 2:
                p["last_comment"] = random.choice(["Trận đấu đau tim quá! 💓", "Bản lĩnh đấy! 👑", "Đỉnh của chóp! 🏆"])
            else:
                p["last_comment"] = random.choice(["Chúc mừng chiến thắng! 🎉", "Tuyệt vời! 🌟", "Phong độ ổn định! 👏"])
        else:
            if aps > 0.45: # High point share despite losing (Carrying)
                p["last_comment"] = random.choice(["Gánh còng lưng mà vẫn tạ! 🥲", "Thua nhưng ngẩng cao đầu! 💪", "Thiếu chút may mắn thôi! 🍀"])
            elif score_gap >= 7:
                p["last_comment"] = random.choice(["Thôi ra uống nước cam rồi phục thù! 🍊", "Khởi động hơi lâu nhỉ? 🏃‍♂️", "Trận sau làm lại nhé! 🔄"])
            else:
                p["last_comment"] = random.choice(["Trận đấu suýt soát! 😤", "Tiếc quá! 💔", "Cố lên trận sau! 👊"])
                
        p["last_comment_time"] = datetime.now().isoformat() + "Z"
        # ------------------------------------
        
        # Streak Update
        if won:
            p["streak"] = p.get("streak", 0) + 1 if p.get("streak", 0) > 0 else 1
            p["wins"] += 1
        else:
            p["streak"] = p.get("streak", 0) - 1 if p.get("streak", 0) < 0 else -1
            p["losses"] += 1
            
        # Partnership persistence
        partner_id = req.team1Ids[1] if pid == req.team1Ids[0] else (req.team1Ids[0] if pid == req.team1Ids[1] else (req.team2Ids[1] if pid == req.team2Ids[0] else req.team2Ids[0]))
        partner_name = players_map[partner_id]["name"]
        if "partnerships" not in p: p["partnerships"] = {}
        p["partnerships"][partner_name] = p["partnerships"].get(partner_name, 0) + 1

        # Achievement Badges Check
        if "badges" not in p: p["badges"] = []
        
        # 1. Lật Đổ Kèo Trên (Challenge: 200+ MMR gap)
        opp_avg = t2_avg_mmr if is_t1 else t1_avg_mmr
        if won and opp_avg - p["mmr"] > 200:
            if "Lật Đổ Kèo Trên" not in p["badges"]: p["badges"].append("Lật Đổ Kèo Trên")
            
        # 2. Độc Cô Cầu Bại (Challenge: 7+ win streak)
        if p["streak"] >= 7:
            if "Độc Cô Cầu Bại" not in p["badges"]: p["badges"].append("Độc Cô Cầu Bại")
            
        # 3. Gánh Đội Thần Thánh (Challenge: Partner 250+ MMR lower)
        my_partner_mmr = players_map[partner_id].get("mmr", players_map[partner_id]["elo"])
        if won and p["mmr"] - my_partner_mmr > 250:
            if "Gánh Đội Thần Thánh" not in p["badges"]: p["badges"].append("Gánh Đội Thần Thánh")
            
        # 4. Kẻ Ngắt Chuỗi (Challenge: Stop opponent's 7+ streak)
        opp_ids = req.team2Ids if is_t1 else req.team1Ids
        for oid in opp_ids:
            if won and players_map[oid].get("streak", 0) >= 7:
                if "Kẻ Ngắt Chuỗi" not in p["badges"]: p["badges"].append("Kẻ Ngắt Chuỗi")
                
        # 5. Vua Kết Nối (Challenge: 15 different partners)
        if len(p.get("partnerships", {})) >= 15:
            if "Vua Kết Nối" not in p["badges"]: p["badges"].append("Vua Kết Nối")

    match_record = {
        "id": str(random.randint(10000, 99999)),
        "date": datetime.now().isoformat() + "Z",
        "t1_names": [players_map[pid]["name"] for pid in req.team1Ids],
        "t2_names": [players_map[pid]["name"] for pid in req.team2Ids],
        "t1_score": req.score1,
        "t2_score": req.score2,
        "target_score": req.targetScore,
        "eloDelta": player_deltas
    }
    db["matches"].insert(0, match_record)
    
    # Remove from live_schedule if exists
    db["live_schedule"] = [s for s in db["live_schedule"] if not (
        (isinstance(s, list) and set(s[1]) == set(match_record["t1_names"]) and set(s[2]) == set(match_record["t2_names"])) or
        (isinstance(s, dict) and set(s.get("team1", [])) == set(req.team1Ids) and set(s.get("team2", [])) == set(req.team2Ids))
    )]
    
    save_db(db)
    return format_match(match_record)

class AddPlayerParams(BaseModel):
    name: str
    password: Optional[str] = "123456"

@app.post("/api/players")
def add_player(req: AddPlayerParams):
    db = load_db()
    for p in db["players"]:
        if p["name"].lower() == req.name.strip().lower():
            raise HTTPException(status_code=400, detail="Name already exists")
            
    new_id = str(random.randint(1000, 9999))
    
    # Auto-assign a random avatar
    styles = ["avataaars", "bottts", "pixel-art", "lorelei", "notionists", "open-peeps"]
    style = random.choice(styles)
    base_seed = f"{req.name.strip()}_{random.randint(100, 999)}"
    avatar_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={base_seed}"
    
    new_p = {
        "id": new_id,
        "name": req.name.strip(),
        "password": req.password,
        "elo": 1000,
        "wins": 0,
        "losses": 0,
        "streak": 0,
        "avatar_url": avatar_url,
        "badges": [],
        "joinedAt": datetime.now().strftime("%Y-%m-%d")
    }
    db["players"].append(new_p)
    save_db(db)
    return format_player(new_p)

@app.post("/api/players/{player_id}/avatar/randomize")
def randomize_avatar(player_id: str):
    db = load_db()
    player = None
    for p in db["players"]:
        if p.get("id") == player_id:
            player = p
            break
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Generate a unique seed
    styles = ["avataaars", "bottts", "pixel-art", "lorelei", "notionists", "open-peeps"]
    style = random.choice(styles)
    
    attempts = 0
    while attempts < 10:
        base_seed = f"{player['name']}_{random.randint(100, 999)}"
        new_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={base_seed}"
        
        # Check uniqueness
        is_unique = True
        for p in db["players"]:
            if p.get("avatar_url") == new_url and p.get("id") != player_id:
                is_unique = False
                break
        
        if is_unique:
            player["avatar_url"] = new_url
            save_db(db)
            return format_player(player)
        
        attempts += 1
        
    raise HTTPException(status_code=500, detail="Could not generate a unique avatar")

@app.post("/api/live_courts/{court_idx}/assign")
def assign_court(court_idx: int, req: RecordMatchParams):
    try:
        data = load_db()
        
        # Resolve names to IDs for the push notification
        p_map = {p["id"]: p["name"] for p in data["players"]}
        t1_names = [p_map.get(pid, pid) for pid in req.team1Ids]
        t2_names = [p_map.get(pid, pid) for pid in req.team2Ids]

        # APPEND the match to live_schedule instead of updating by index
        if "live_schedule" not in data:
            data["live_schedule"] = []
            
        new_entry = [1, t1_names, t2_names, 0, 0]
        
        # Prevent duplicate append if clicked multiple times
        exists = False
        for entry in data.get("live_schedule", []):
            if isinstance(entry, list) and set(entry[1]) == set(t1_names) and set(entry[2]) == set(t2_names):
                exists = True
                break
                
        if not exists:
            data["live_schedule"].append(new_entry)
            save_db(data)

        # Notify players via Web Push with EMPHASIZED Court Name
        court_label = req.court_name if hasattr(req, 'court_name') and req.court_name else f"Sân {court_idx + 1}"
        
        msg = {
            "title": "🎾 VÀO SÂN NGAY!",
            "body": f"Mời bạn vào {court_label.upper()} để thi đấu trận: {' + '.join(t1_names)} vs {' + '.join(t2_names)}",
            "url": "/"
        }
        for pid in (req.team1Ids + req.team2Ids):
            send_push_notification(pid, msg)

        return {"message": "Assigned successfully"}

    except Exception as e:
        print(f"Assign error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/live_courts/{court_idx}/cancel")
def cancel_court(court_idx: int):
    try:
        db = load_db()
        if court_idx < 0 or court_idx >= len(db["live_schedule"]):
            # Log specific out of bounds error
            with open("debug_error.log", "a") as f:
                f.write(f"{datetime.now()}: Cancel failed. Index {court_idx} out of range (len {len(db['live_schedule'])})\n")
            raise HTTPException(status_code=404, detail="Court not found")
            
        # Actually remove the entry from the list
        removed = db["live_schedule"].pop(court_idx)
        save_db(db)
        
        with open("debug_error.log", "a") as f:
            f.write(f"{datetime.now()}: Cancelled court at index {court_idx}: {removed}\n")
            
        return {"message": "Court cancelled"}
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        with open("debug_error.log", "a") as f:
            f.write(f"{datetime.now()}: CRITICAL ERROR in cancel_court: {err_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/avatars/available")
def get_available_avatars():
    db = load_db()
    taken_urls = {p.get("avatar_url") for p in db["players"] if p.get("avatar_url")}
    available = [url for url in AVATAR_POOL if url not in taken_urls]
    return available

class SetAvatarParams(BaseModel):
    avatar_url: str

@app.post("/api/players/{player_id}/avatar")
def set_avatar(player_id: str, req: SetAvatarParams):
    db = load_db()
    player = None
    for p in db["players"]:
        if p.get("id") == player_id:
            player = p
            break
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if this avatar is taken by someone else
    for p in db["players"]:
        if p.get("avatar_url") == req.avatar_url and p.get("id") != player_id:
            raise HTTPException(status_code=400, detail="Avatar already taken")
            
    player["avatar_url"] = req.avatar_url
    save_db(db)
    return format_player(player)

class PushSubscriptionModel(BaseModel):
    endpoint: str
    keys: Dict[str, str]

@app.post("/api/players/{player_id}/push-subscribe")
def push_subscribe(player_id: str, req: PushSubscriptionModel):
    db = load_db()
    player = next((p for p in db["players"] if p["id"] == player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player["push_subscription"] = req.dict()
    save_db(db)
    return {"message": "Subscribed successfully"}

@app.post("/api/players/{player_id}/push-test")
def push_test(player_id: str):
    msg = {
        "title": "🔔 Kiểm tra thông báo",
        "body": "Chúc mừng! Hệ thống thông báo PickX đã sẵn sàng trên thiết bị của bạn. 🔥",
        "url": "/"
    }
    send_push_notification(player_id, msg)
    return {"message": "Test push sent"}
