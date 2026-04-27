import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import json
import os
import random
from itertools import combinations
from datetime import datetime

st.set_page_config(page_title="PickX Pickleball Performance Lab", page_icon="🏓", layout="wide")

DB_FILE = "pickx_database.db"

def init_db():
    if not os.path.exists(DB_FILE):
        seed_data = {
            "players": [],
            "matches": [],
            "live_schedule": [],
            "live_rest": []
        }
        names = ["Quân", "Long", "Hải", "Ngân", "Tiến", "Bảo", "Anh", "Minh", "Khang", "Tuấn"]
        for i, name in enumerate(names):
            seed_data["players"].append({
                "id": str(i),
                "name": name,
                "elo": random.randint(900, 2000),
                "wins": 0,
                "losses": 0
            })
        save_db(seed_data)
    else:
        with open(DB_FILE, "r") as f:
            try:
                data = json.load(f)
            except:
                data = []

        if isinstance(data, list):
            new_data = {"players": data, "matches": [], "live_schedule": [], "live_rest": []}
            save_db(new_data)
        else:
            # Ensure new keys exist 
            needs_save = False
            if "live_schedule" not in data:
                data["live_schedule"] = []
                needs_save = True
            if "live_rest" not in data:
                data["live_rest"] = []
                needs_save = True
                
            if needs_save: save_db(data)

def load_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

def calculate_elo_change(t1_elo, t2_elo, t1_score, t2_score):
    t1_won = t1_score > t2_score
    actual_score_t1 = 1 if t1_won else 0
    p_t1 = 1 / (1 + 10 ** ((t2_elo - t1_elo) / 400))
    score_gap = abs(t1_score - t2_score)
    if score_gap >= 9: mov_mult = 1.75
    elif 4 <= score_gap <= 8: mov_mult = 1.0
    else: mov_mult = 0.6
    k = 32
    points_t1 = (k * mov_mult) * (actual_score_t1 - p_t1)
    return points_t1, -points_t1

TIERS = [
    (0, 1000, "Đồng", "Bronze", "#cd7f32"),
    (1000, 1150, "Bạc", "Silver", "#c0c0c0"),
    (1150, 1300, "Vàng", "Gold", "#ffd700"),
    (1300, 1450, "Bạch Kim", "Platinum", "#e5e4e2"),
    (1450, 1600, "Kim Cương", "Diamond", "#b9f2ff"),
    (1600, 1800, "Kiện Tướng", "Master", "#33ccff"),
    (1800, 2000, "Siêu Cúp", "Elite", "#ff3366"),
    (2000, float('inf'), "Chuyên Nghiệp", "Pro", "#ffcc00")
]

def get_tier_info(elo):
    for min_elo, max_elo, name, en_name, color in TIERS:
        if min_elo <= elo < max_elo:
            return min_elo, max_elo, name, color
    return TIERS[-1]

def update_player_stats(player_id, db, elo_change, won):
    for p in db["players"]:
        if p["id"] == player_id:
            p["elo"] = round(p["elo"] + elo_change, 2)
            if won: p["wins"] += 1
            else: p["losses"] += 1
            break

def record_match_history(db, t1, t2, t1_score, t2_score, t1_change, t2_change):
    match_record = {
        "id": str(random.randint(10000, 99999)),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "t1_names": [p["name"] for p in t1],
        "t2_names": [p["name"] for p in t2],
        "t1_score": t1_score,
        "t2_score": t2_score,
        "t1_change": round(t1_change, 2),
        "t2_change": round(t2_change, 2)
    }
    db["matches"].insert(0, match_record)
    save_db(db)

# ==================== USER VIEW ====================

def render_live_schedule(db):
    st.title("🏟️ Bảng Thư Lệnh Chờ Ra Sân")
    
    if not db.get("live_schedule"):
        st.info("Hiện Trọng Tài chưa có thông báo ghép sân mới nào.")
        return
        
    st.markdown("### 🔴 TRẠNG THÁI: CÁC SÂN ĐANG CHỜ KHỞI TRANH")
    
    for i, match in enumerate(db["live_schedule"]):
        t1, t2, a1, a2 = match
        
        st.markdown(f"#### 🏓 Sân Số {i + 1}")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"""
            <div style="border-left: 5px solid #28a745; padding: 10px; background-color: rgba(40,167,69,0.1); border-radius: 5px;">
                <h4 style="margin:0;">Đội 1 (Xanh)</h4>
                <p style="font-size:24px; font-weight:bold; margin:0;">{' & '.join(t1)}</p>
                <small>PR Trung Bình: {a1:.1f}</small>
            </div>
            """, unsafe_allow_html=True)
            
        with col2:
            st.markdown(f"""
            <div style="border-left: 5px solid #dc3545; padding: 10px; background-color: rgba(220,53,69,0.1); border-radius: 5px;">
                <h4 style="margin:0;">Đội 2 (Đỏ)</h4>
                <p style="font-size:24px; font-weight:bold; margin:0;">{' & '.join(t2)}</p>
                <small>PR Trung Bình: {a2:.1f}</small>
            </div>
            """, unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        
    st.markdown("---")
    if db.get("live_rest"):
        st.warning(f"⏳ **Danh sách VĐV chờ lượt tiếp theo:** {', '.join(db['live_rest'])}")
        

def render_player_profile(db):
    st.title("📊 Hồ Sơ Vận Động Viên")
    players = {p["name"]: p for p in db["players"]}
    player_names = list(players.keys())
    
    selected_player = st.selectbox("📌 Tên Vận Động Viên Khảo Sát:", options=player_names)
    
    if selected_player:
        p = players[selected_player]
        elo = p["elo"]
        min_elo, max_elo, rank_name, color = get_tier_info(elo)
        
        st.markdown("---")
        col1, col2, col3 = st.columns([1, 2, 1])
        with col1:
            st.markdown(f"<div style='text-align: center; border-left: 4px solid {color}; padding-left: 15px;'><h2 style='color: {color}; margin: 0;'>{rank_name}</h2><p style='color: gray; font-size: 14px;'>Xếp Hạng PickX</p></div>", unsafe_allow_html=True)
            
        with col2:
            st.header(f"VĐV: {p['name']}")
            win_rate = (p["wins"] / (p["wins"] + p["losses"]) * 100) if (p["wins"] + p["losses"]) > 0 else 0
            st.metric("Chỉ Số Điểm Hiệu Suất (PR)", f"{elo:.1f} pts")
            
            # Progress bar for professional growth
            if max_elo == float('inf'):
                st.progress(1.0)
                st.caption("🏆 Vận động viên đã đạt mức phân hạng chuyên nghiệp cao nhất.")
            else:
                progress = (elo - min_elo) / (max_elo - min_elo)
                st.progress(min(max(progress, 0.0), 1.0))
                pts_to_rank_up = max_elo - elo
                st.caption(f"Đang phát triển... Hiệu suất cần đạt để thăng hạng tiếp theo: **{pts_to_rank_up:.1f} pts**.")
                
        with col3:
            st.metric("Tổng Số Trận Thi Đấu", p["wins"] + p["losses"])
            st.metric("Tỉ lệ Chiến Thắng", f"{win_rate:.1f}%")
            
        st.markdown("---")
        st.markdown("### 📈 Lịch Sử Đấu Gần Đây")
        my_matches = []
        for m in db["matches"]:
            if selected_player in m["t1_names"] or selected_player in m["t2_names"]:
                my_matches.append(m)
                
        if not my_matches:
            st.info("Chưa có dữ liệu thi đấu nào được ghi nhận.")
        else:
            for m in my_matches[:5]:
                is_t1 = selected_player in m["t1_names"]
                my_team_score = m["t1_score"] if is_t1 else m["t2_score"]
                opp_team_score = m["t2_score"] if is_t1 else m["t1_score"]
                my_change = m["t1_change"] if is_t1 else m["t2_change"]
                
                win = my_team_score > opp_team_score
                color_bg = "rgba(40, 167, 69, 0.05)" if win else "rgba(220, 53, 69, 0.05)"
                color_text = "#28a745" if win else "#dc3545"
                result_text = "THẮNG" if win else "THUA"
                
                my_team_str = " & ".join(m["t1_names"] if is_t1 else m["t2_names"])
                opp_team_str = " & ".join(m["t2_names"] if is_t1 else m["t1_names"])
                
                st.markdown(f"""
                <div style='background-color: {color_bg}; padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid {color_text};'>
                    <span style='font-size: 13px; opacity: 0.6;'>Cập nhật lúc: {m['date']}</span><br/>
                    <span style='color: {color_text}; font-weight: 600; font-size: 16px;'>{result_text}</span> 
                    <span style='font-weight: 500;'>({my_team_score} - {opp_team_score})</span> 
                    <span style='float: right; font-weight: 600; font-size: 16px; color: {color_text};'>{my_change:+.1f} pts</span>
                    <hr style='margin: 8px 0; border-top: 1px solid rgba(255,255,255,0.1);' />
                    <span style='font-size: 14px;'>Đội Nhà: <strong>{my_team_str}</strong> | Đội Khách: <strong>{opp_team_str}</strong></span>
                </div>
                """, unsafe_allow_html=True)

def render_leaderboard(db):
    st.title("🏆 Bảng Xếp Hạng Vận Động Viên")
    df = pd.DataFrame(db["players"])
    if df.empty:
        st.warning("Chưa có cơ sở dữ liệu Vận Động Viên.")
        return
        
    df["Phân Hạng"] = df["elo"].apply(lambda x: get_tier_info(x)[2])
    df["Hiệu Suất (T/B)"] = df["wins"].astype(str) + " / " + df["losses"].astype(str)
    
    df = df.sort_values("elo", ascending=False).reset_index(drop=True)
    df.index += 1
    df["Hạng"] = df.index
    
    display_df = df[["Hạng", "name", "Phân Hạng", "elo", "Hiệu Suất (T/B)"]].rename(columns={"name": "Vận Động Viên", "elo": "Điểm Hiệu Suất (PR)"})
    st.dataframe(display_df, use_container_width=True, hide_index=True)


# ==================== HOST VIEW ====================
def render_host_dashboard(db):
    st.title("⚙️ Bảng Điều Khiển Hệ Thống Điều Hành")
    
    if "host_auth" not in st.session_state:
        st.session_state["host_auth"] = False
        
    if not st.session_state["host_auth"]:
        st.info("Khu vực này được giới hạn cho Quản Lý Trung Tâm Thể Thao. Yêu cầu xác thực.")
        pwd = st.text_input("Mã Định Danh (PIN):", type="password")
        if st.button("Xác Thực"):
            if pwd == "1234":
                st.session_state["host_auth"] = True
                st.rerun()
            else:
                st.error("Xác thực thất bại!")
        return
        
    st.success("Hệ thống đã kết nối. Cấp quyền Quản Trị Viên.")
    if st.button("Trạng Thái: Đang Mở (Nhấp để Khóa Màn Hình)"):
        st.session_state["host_auth"] = False
        st.rerun()
        
    st.markdown("---")
    tabs = st.tabs(["📝 Nhập Ghi Nhận KQ", "🧠 Hệ Thống Trí Tuệ Ghép Sân", "👤 Cấp Phát Hồ Sơ Cơ Sở"])
    
    players = {p["name"]: p for p in db["players"]}
    player_names = list(players.keys())
    
    with tabs[0]:
        st.subheader("Ghi Nhận Kết Quả Thi Đấu Lên Server")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Đội 1**")
            t1_p1 = st.selectbox("Vận Động Viên 1", options=player_names, key="t1p1")
            t1_p2 = st.selectbox("Vận Động Viên 2", options=[n for n in player_names if n != t1_p1], key="t1p2")
            t1_score = st.number_input("Điểm Đội 1", min_value=0, value=11, key="t1score")
        with col2:
            st.markdown("**Đội 2**")
            available_for_t2 = [n for n in player_names if n not in [t1_p1, t1_p2]]
            t2_p1 = st.selectbox("Vận Động Viên 1", options=available_for_t2, key="t2p1_t2")
            t2_p2 = st.selectbox("Vận Động Viên 2", options=[n for n in available_for_t2 if n != t2_p1], key="t2p2_t2")
            t2_score = st.number_input("Điểm Đội 2", min_value=0, value=9, key="t2score")
            
        if st.button("Đồng Bộ Phân Tích Hiện Thực"):
            is_valid = set([t1_p1, t1_p2, t2_p1, t2_p2])
            if len(is_valid) < 4: st.error("Mỗi đội phải gồm 2 nhân sự khác biệt trên cùng 1 sân.")
            elif t1_score == t2_score: st.error("Lỗi Dữ Liệu: Trong luật Pickleball không có kết quả hòa.")
            else:
                max_score = max(t1_score, t2_score)
                score_diff = abs(t1_score - t2_score)
                if max_score < 11 or score_diff < 2:
                    st.error("Cảnh Báo: Tối thiểu chiến thắng chạm 11 điểm và dẫn 2 điểm. Chưa đạt chuẩn.")
                else:
                    t1_elo_avg = (players[t1_p1]["elo"] + players[t1_p2]["elo"]) / 2
                    t2_elo_avg = (players[t2_p1]["elo"] + players[t2_p2]["elo"]) / 2
                    p1, p2 = calculate_elo_change(t1_elo_avg, t2_elo_avg, t1_score, t2_score)
                    
                    t1_won = t1_score > t2_score
                    update_player_stats(players[t1_p1]["id"], db, p1, t1_won)
                    update_player_stats(players[t1_p2]["id"], db, p1, t1_won)
                    update_player_stats(players[t2_p1]["id"], db, p2, not t1_won)
                    update_player_stats(players[t2_p2]["id"], db, p2, not t1_won)
                    
                    record_match_history(db, 
                                         [players[t1_p1], players[t1_p2]], 
                                         [players[t2_p1], players[t2_p2]], 
                                         t1_score, t2_score, p1, p2)
                    
                    # Also clear the live schedule since a match just finished
                    db["live_schedule"] = []
                    db["live_rest"] = []
                    save_db(db)
                    
                    st.success("Đã đồng bộ kết quả thành công và cấu trúc thống kê VĐV.")
                    
    with tabs[1]:
        st.subheader("Trợ Lý Sắp Xếp Sân Đấu Đồng Loạt Tối Ưu")
        selected = st.multiselect("Lựa chọn danh sách VĐV có mặt ở cơ sở", options=player_names, default=player_names[:6])
        if st.button("Khởi Động Thuật Toán Sắp Sân"):
            if len(selected) < 4:
                st.error("Cần 1 tập hợp dữ liệu tối thiểu 4 người.")
            else:
                num_matches = len(selected) // 4
                best_overall_gap = float("inf")
                best_overall_config = None
                
                for playing_group in combinations(selected, num_matches * 4):
                    if num_matches == 1:
                        court_splits = [(playing_group,)]
                    elif num_matches == 2:
                        court_splits = []
                        first_player = playing_group[0]
                        for group1_rest in combinations(playing_group[1:], 3):
                            group1 = (first_player,) + group1_rest
                            group2 = tuple(p for p in playing_group if p not in group1)
                            court_splits.append((group1, group2))
                    else:
                        court_splits = []
                    
                    for courts in court_splits:
                        current_config_matches = []
                        for cps in courts:
                            pairings = [([cps[0], cps[1]], [cps[2], cps[3]]),
                                        ([cps[0], cps[2]], [cps[1], cps[3]]),
                                        ([cps[0], cps[3]], [cps[1], cps[2]])]
                            b_gap = float("inf")
                            b_m = None
                            for t1, t2 in pairings:
                                a1 = (players[t1[0]]["elo"] + players[t1[1]]["elo"]) / 2
                                a2 = (players[t2[0]]["elo"] + players[t2[1]]["elo"]) / 2
                                g = abs(a1 - a2)
                                if g < b_gap:
                                    b_gap = g
                                    b_m = (t1, t2, a1, a2)
                            current_config_matches.append(b_m)
                        
                        s_gaps = sum(abs(m[2] - m[3]) for m in current_config_matches)
                        if s_gaps < best_overall_gap:
                            best_overall_gap = s_gaps
                            best_overall_config = current_config_matches
                            
                rp = [p for p in selected if p not in sum([list(m[0]+m[1]) for m in best_overall_config], [])]
                
                # Save to database to broadcast to public view
                db["live_schedule"] = best_overall_config
                db["live_rest"] = rp
                save_db(db)
                            
                st.success(f"Quá trình phân luồng hoàn tất => Bố trí song song {len(best_overall_config)} sân. Thuật toán đã phát thông báo ra Bảng Chung.")
                
                for i, match in enumerate(best_overall_config):
                    t1, t2, a1, a2 = match
                    pt1 = 1 / (1 + 10 ** ((a2 - a1) / 400))
                    st.info(f"**🏓 Sân số {i + 1}**")
                    c1, c2 = st.columns(2)
                    c1.metric(f"Đội 1 (PR TB: {a1:.1f})", " & ".join(t1), f"{pt1*100:.1f}% Win Probability", "off")
                    c2.metric(f"Đội 2 (PR TB: {a2:.1f})", " & ".join(t2), f"{(1-pt1)*100:.1f}% Win Probability", "off")
                
                if rp: st.warning(f"Chưa Đủ Điều Kiện Khởi Tạo Court Mới (Đang Chờ Vòng Kế): {', '.join(rp)}")
    
    with tabs[2]:
        st.subheader("Cập Nhật Danh Sách Vận Động Viên")
        with st.form("add_player_form"):
            new_name = st.text_input("Họ & Tên VĐV")
            if st.form_submit_button("Thêm Vào Cơ Sở Dữ Liệu"):
                if not new_name.strip(): st.error("Thiết lập thất bại: Trường thông tin rỗng.")
                elif any(p["name"].lower() == new_name.strip().lower() for p in db["players"]): st.error("Thiết lập thất bại: Dữ liệu bị trùng.")
                else:
                    db["players"].append({
                        "id": str(random.randint(1000, 9999)),
                        "name": new_name.strip(), "elo": 1000, "wins": 0, "losses": 0
                    })
                    save_db(db)
                    st.success(f"Quá trình cấp ID thành công. Mức nền tảng được ấn định: 1000 PR.")


# ==================== MAIN LOGIC ====================
def main():
    init_db()
    db = load_db()
    
    with st.sidebar:
        st.image("https://cdn-icons-png.flaticon.com/512/5812/5812061.png", width=60)
        st.title("PickX")
        st.caption("Trung Tâm Hiệu Suất Thể Thao")
        st.markdown("---")
        menu = st.radio("ĐIỀU HƯỚNG CỔNG THÔNG TIN", ["🏟️ Tín Hiệu Sân Trực Tiếp", "📊 Trích Xuất Dữ Liệu Cá Nhân", "📋 Báo Cáo Hiệu Suất Tổng", "⚙️ Hệ Thống Quản Trị Trọng Tài"])
        
        st.markdown("---")
        st.markdown("<small style='color: gray;'>Core Analytics Engine v2.0<br>Synapse Status: ONLINE</small>", unsafe_allow_html=True)
    
    if menu == "🏟️ Tín Hiệu Sân Trực Tiếp":
        render_live_schedule(db)
    elif menu == "📊 Trích Xuất Dữ Liệu Cá Nhân":
        render_player_profile(db)
    elif menu == "📋 Báo Cáo Hiệu Suất Tổng":
        render_leaderboard(db)
    elif menu == "⚙️ Hệ Thống Quản Trị Trọng Tài":
        render_host_dashboard(db)

if __name__ == "__main__":
    main()
