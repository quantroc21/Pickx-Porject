import json

def reset_db():
    db_path = '/Users/lehoangquan/.gemini/antigravity/scratch/pickx/pickx_database.db'
    with open(db_path, 'r') as f:
        db = json.load(f)
        
    for p in db['players']:
        skill = p.get('initialSkill', 'intermediate')
        if skill == 'beginner':
            elo = 700
        elif skill == 'intermediate':
            elo = 900
        elif skill == 'advanced':
            elo = 1000
        elif skill == 'expert':
            elo = 1200
        else:
            elo = 1000
            
        p['elo'] = elo
        p['mmr'] = elo
        p['wins'] = 0
        p['losses'] = 0
        p['streak'] = 0
        p['last_comment'] = "Sẵn sàng định chuẩn DUPR! 🚀"
        p['last_comment_time'] = ""
        
    db['matches'] = []
    
    with open(db_path, 'w') as f:
        json.dump(db, f, indent=2)
        
if __name__ == '__main__':
    reset_db()
    print("Database reset successfully for DUPR calibration.")
