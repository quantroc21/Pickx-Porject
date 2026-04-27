import type { Court, Match, Player } from "./types";

export const MOCK_PLAYERS: Player[] = [
  { id: "p1",  name: "Nguyễn Minh Quân", handle: "minhquan",  elo: 1842, wins: 64, losses: 21, streak: 5,  joinedAt: "2024-03-12", isActive: true },
  { id: "p2",  name: "Trần Hải Anh",     handle: "haianh",    elo: 1788, wins: 58, losses: 24, streak: 3,  joinedAt: "2024-04-02", isActive: true },
  { id: "p3",  name: "Lê Đức Thịnh",     handle: "ducthinh",  elo: 1721, wins: 49, losses: 22, streak: -1, joinedAt: "2024-02-18", isActive: true },
  { id: "p4",  name: "Phạm Thu Hương",   handle: "thuhuong",  elo: 1664, wins: 42, losses: 25, streak: 2,  joinedAt: "2024-05-09", isActive: true },
  { id: "p5",  name: "Hoàng Gia Bảo",    handle: "giabao",    elo: 1602, wins: 38, losses: 27, streak: 1,  joinedAt: "2024-01-22", isActive: true },
  { id: "p6",  name: "Đặng Khánh Linh",  handle: "khanhlinh", elo: 1554, wins: 33, losses: 28, streak: -2, joinedAt: "2024-06-14", isActive: true },
  { id: "p7",  name: "Vũ Tuấn Kiệt",     handle: "tuankiet",  elo: 1498, wins: 30, losses: 30, streak: 0,  joinedAt: "2024-03-30", isActive: true },
  { id: "p8",  name: "Bùi Mai Phương",   handle: "maiphuong", elo: 1452, wins: 27, losses: 29, streak: 4,  joinedAt: "2024-07-01", isActive: false },
  { id: "p9",  name: "Đỗ Quang Huy",     handle: "quanghuy",  elo: 1389, wins: 22, losses: 26, streak: -3, joinedAt: "2024-04-19", isActive: true },
  { id: "p10", name: "Ngô Phương Vy",    handle: "phuongvy",  elo: 1322, wins: 18, losses: 24, streak: 1,  joinedAt: "2024-05-22", isActive: true },
  { id: "p11", name: "Lý Thành Đạt",     handle: "thanhdat",  elo: 1268, wins: 15, losses: 22, streak: 2,  joinedAt: "2024-08-10", isActive: false },
  { id: "p12", name: "Trịnh Bảo Ngọc",   handle: "baongoc",   elo: 1184, wins: 11, losses: 21, streak: -1, joinedAt: "2024-09-03", isActive: true },
  { id: "p13", name: "Phan Hữu Nghĩa",   handle: "huunghia",  elo: 1098, wins: 7,  losses: 19, streak: 0,  joinedAt: "2024-10-12", isActive: false },
  { id: "p14", name: "Cao Mỹ Duyên",     handle: "myduyen",   elo: 1042, wins: 4,  losses: 17, streak: 1,  joinedAt: "2024-11-01", isActive: true },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    playedAt: "2025-04-25T18:42:00Z",
    team1: { playerIds: ["p1", "p4"], score: 11 },
    team2: { playerIds: ["p2", "p5"], score: 8 },
    winner: 1,
    eloDelta: { p1: 12, p4: 14, p2: -11, p5: -13 },
  },
  {
    id: "m2",
    playedAt: "2025-04-25T17:55:00Z",
    team1: { playerIds: ["p3", "p7"], score: 9 },
    team2: { playerIds: ["p1", "p6"], score: 11 },
    winner: 2,
    eloDelta: { p1: 9, p6: 11, p3: -8, p7: -10 },
  },
  {
    id: "m3",
    playedAt: "2025-04-25T17:10:00Z",
    team1: { playerIds: ["p2", "p9"], score: 11 },
    team2: { playerIds: ["p4", "p10"], score: 6 },
    winner: 1,
    eloDelta: { p2: 10, p9: 13, p4: -9, p10: -12 },
  },
  {
    id: "m4",
    playedAt: "2025-04-25T16:25:00Z",
    team1: { playerIds: ["p1", "p3"], score: 7 },
    team2: { playerIds: ["p2", "p4"], score: 11 },
    winner: 2,
    eloDelta: { p2: 8, p4: 10, p1: -10, p3: -9 },
  },
  {
    id: "m5",
    playedAt: "2025-04-25T15:40:00Z",
    team1: { playerIds: ["p5", "p8"], score: 11 },
    team2: { playerIds: ["p6", "p11"], score: 9 },
    winner: 1,
    eloDelta: { p5: 11, p8: 13, p6: -10, p11: -11 },
  },
  {
    id: "m6",
    playedAt: "2025-04-24T20:10:00Z",
    team1: { playerIds: ["p1", "p5"], score: 11 },
    team2: { playerIds: ["p7", "p9"], score: 4 },
    winner: 1,
    eloDelta: { p1: 7, p5: 10, p7: -9, p9: -10 },
  },
];

export const MOCK_COURTS: Court[] = [
  {
    id: "c1",
    name: "Court 1",
    status: "live",
    team1: ["p1", "p4"],
    team2: ["p2", "p5"],
    scoreT1: 9,
    scoreT2: 7,
    startedAt: "2025-04-25T18:30:00Z",
  },
  {
    id: "c2",
    name: "Court 2",
    status: "live",
    team1: ["p3", "p6"],
    team2: ["p7", "p10"],
    scoreT1: 5,
    scoreT2: 5,
    startedAt: "2025-04-25T18:35:00Z",
  },
  {
    id: "c3",
    name: "Court 3",
    status: "warmup",
    team1: ["p9", "p12"],
    team2: ["p8", "p14"],
    scoreT1: 0,
    scoreT2: 0,
  },
];

export const BENCH_PLAYER_IDS = ["p11", "p13"];

export function getPlayer(id: string): Player | undefined {
  return MOCK_PLAYERS.find((p) => p.id === id);
}

export function leaderboard(): Player[] {
  return [...MOCK_PLAYERS].sort((a, b) => b.elo - a.elo);
}

export function playerMatches(playerId: string): Match[] {
  return MOCK_MATCHES.filter(
    (m) => m.team1.playerIds.includes(playerId) || m.team2.playerIds.includes(playerId),
  ).sort((a, b) => +new Date(b.playedAt) - +new Date(a.playedAt));
}