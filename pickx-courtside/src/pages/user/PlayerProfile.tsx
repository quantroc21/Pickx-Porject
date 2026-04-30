import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Flame, Trophy, LogOut, Sword, Shield, Zap, Skull, Users, TrendingUp, Wand2, Bell, BellOff, Check, Radio, TriangleAlert } from "lucide-react";
import { usePlayers, useMatches, usePushSubscribe, useTestPushNotification, useChangePassword } from "@/lib/api";
import { TIER_HEX, getTier, tierProgress } from "@/lib/tiers";
import { TierBadge } from "@/components/pickx/TierBadge";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { EloDelta } from "@/components/pickx/EloDelta";
import { useUserAuth } from "@/hooks/useUserAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AvatarPicker } from "@/components/pickx/AvatarPicker";
import { toast } from "sonner";


export default function PlayerProfile() {
  const { id = "" } = useParams();
  const { userId, logout } = useUserAuth();
  const navigate = useNavigate();
  const isMe = userId === id;

  const { data: players = [], isLoading: pLoading } = usePlayers();
  const { data: allMatches = [], isLoading: mLoading } = useMatches();
  const player = players.find(p => p.id === id);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const subscribeMutation = usePushSubscribe(id);
  const testPushMutation = useTestPushNotification(id);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const changePasswordMutation = useChangePassword();

  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleSubscribe() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("Trình duyệt này không hỗ trợ thông báo đẩy.");
        return;
      }

      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission !== "granted") {
        toast.error("Vui lòng cấp quyền thông báo trong cài đặt trình duyệt.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let sub = await reg.pushManager.getSubscription();
      
      if (!sub) {
        const publicVapidKey = "BDm7xzKt_L1jVB6EqXehXKFJqGj93ubeCLMKzvMeSJlWDMhpZM24F1oQxQS0zVNpD4rlXcBWLgOv0KhEW-cv5Pc";
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }
      
      subscribeMutation.mutate(sub, {
        onSuccess: () => toast.success("Đã bật thông báo thành công!"),
        onError: () => toast.error("Không thể lưu đăng ký lên máy chủ.")
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi đăng ký thông báo PWA.");
    }
  }

  if (pLoading || mLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải biểu mẫu phân tích...</div>;

  if (!player) {
    return (
      <div className="grid place-items-center pt-20 text-center">
        <p className="font-display text-lg">Không tìm thấy tay vợt</p>
        <Link to="/" className="mt-3 text-sm text-primary underline">Về bảng xếp hạng</Link>
      </div>
    );
  }

  const matches = allMatches
    .filter(m => m && m.team1 && m.team2 && (m.team1.playerIds?.includes(player.id) || m.team2.playerIds?.includes(player.id)))
    .sort((a,b) => +new Date(b.playedAt) - +new Date(a.playedAt));
  const tier = getTier(player.elo);
  const { percent, pointsToNext, nextLabel } = tierProgress(player.elo);
  const totalMatches = player.wins + player.losses;
  const winRate = Math.round((player.wins / Math.max(1, totalMatches)) * 100);
  const tierColor = TIER_HEX[tier.key];
  
  const duprScore = (2.0 + (player.elo - 700) / 200).toFixed(2);
  const matchesToUnlock = Math.max(0, 5 - totalMatches);
  const isCalibrating = matchesToUnlock > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Bảng xếp hạng
        </Link>
        {isMe && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
          >
            Đăng xuất <LogOut className="size-3" />
          </button>
        )}
      </div>

      {/* Hero card */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border/60 liquid-glass p-5">
        <div
          className="absolute inset-x-0 top-0 h-32 opacity-40 blur-2xl"
          style={{ background: `radial-gradient(60% 100% at 50% 0%, ${tierColor}, transparent)` }}
        />
        


        <div className="relative flex items-start gap-4">
          <div className="relative group">
            <PlayerAvatar player={player} size="xl" ring />
            {isMe && (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full bg-primary/20 text-primary-foreground shadow-sm backdrop-blur-md transition-all hover:bg-primary/40 active:scale-90"
                title="Đổi diện mạo"
              >
                <Wand2 className="size-3.5" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                @{player.handle}
              </p>
              {isMe && <span className="inline-block rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary ring-1 ring-primary/40">BẠN</span>}
            </div>
            <h1 className="truncate font-display text-2xl font-bold leading-tight">{player.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TierBadge elo={player.elo} size="md" />
              {player.streak >= 3 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 text-[11px] font-semibold text-warning ring-1 ring-warning/30 animate-pulse">
                  <Flame className="size-3" /> Nhào vô · Chuỗi {player.streak}
                </span>
              )}
              {player.streak === 2 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-[11px] font-semibold text-warning/80 ring-1 ring-warning/20">
                  <Zap className="size-3" /> Hưng phấn
                </span>
              )}
              {player.streak <= -3 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[11px] font-semibold text-accent ring-1 ring-accent/30">
                  <Skull className="size-3" /> Bầm dập · Thua {Math.abs(player.streak)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Calibration Warning */}
        {isCalibrating && (
          <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-3 flex items-start gap-3">
             <div className="rounded-full bg-warning/20 p-2 text-warning"><TriangleAlert className="size-4" /></div>
             <div>
                <p className="text-xs font-bold text-warning uppercase tracking-wider">Đang định chuẩn DUPR</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Hệ thống đang theo dõi. Cần thi đấu thêm <strong className="text-foreground">{matchesToUnlock} trận</strong> để xác định trình độ thực.</p>
             </div>
          </div>
        )}

        <div className="relative mt-8 grid grid-cols-4 gap-3 px-2">
          <CompactBox label="Elo" value={player.elo} accent={tierColor} />
          <CompactBox 
            label="DUPR" 
            value={isCalibrating ? "??" : duprScore} 
            accent={isCalibrating ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"}
            icon={isCalibrating ? <Lock className="size-3 mb-1 opacity-50" /> : undefined}
            subLabel={isCalibrating ? "Chưa mở khóa" : "Hệ số chuẩn"}
          />
          <CompactBox label="Thắng" value={`${winRate}%`} />
          <CompactBox label="Trận" value={totalMatches} />
        </div>

        {/* Rank Progress Bar */}
        {nextLabel && (
          <div className="relative mt-6 px-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Tiến trình hạng</span>
              <span className="text-[10px] font-bold text-foreground/60">Còn {pointsToNext} điểm tới {nextLabel}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-background/40 ring-1 ring-border/20">
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                style={{ 
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${tierColor}, transparent 60%), ${tierColor})`,
                  boxShadow: `0 0 15px color-mix(in srgb, ${tierColor}, transparent 40%)`
                }}
              />
            </div>
            <div className="mt-2 flex justify-between px-0.5">
               <span className="text-[9px] font-black text-muted-foreground uppercase">{tier.label}</span>
               <span className="text-[9px] font-black text-primary uppercase">{nextLabel}</span>
            </div>
          </div>
        )}
      </section>

      {/* Achievement Showcase - Ultra Rounded & Clean */}
      {player.badges && player.badges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
              Thành tích nổi bật
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {player.badges.map((badge: string) => (
              <div 
                key={badge}
                className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/50 p-3 transition-all hover:bg-surface-elevated"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-background/40 p-1.5 shadow-sm">
                  <BadgeImage name={badge} className="size-8" />
                </div>
                <p className="truncate font-display text-[11px] font-bold tracking-tight text-foreground/80">
                  {badge}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Match history */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
            Lịch sử thi đấu
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="size-3" /> {matches.length} trận
          </span>
        </div>

        <ol className="relative space-y-2 border-l border-border/50 pl-4">
          {matches.map((m) => {
            const onTeam1 = m.team1.playerIds.includes(player.id);
            const won = (m.winner === 1 && onTeam1) || (m.winner === 2 && !onTeam1);
            const myScore = onTeam1 ? m.team1.score : m.team2.score;
            const oppScore = onTeam1 ? m.team2.score : m.team1.score;
            const partnerId = (onTeam1 ? m.team1.playerIds : m.team2.playerIds).find((p) => p !== player.id)!;
            const opps = onTeam1 ? m.team2.playerIds : m.team1.playerIds;
            const partner = players.find((p) => p.id === partnerId);
            const oppPlayers = opps.map((o) => players.find((p) => p.id === o)!).filter(Boolean);
            const delta = m.eloDelta[player.id] ?? 0;
            const date = new Date(m.playedAt);

            return (
              <li key={m.id} className="relative">
                <span
                  className="absolute -left-[22px] top-4 size-3 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: won ? "hsl(var(--success))" : "hsl(var(--danger))" }}
                />
                <div className="rounded-xl border border-border/60 bg-surface p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid size-7 place-items-center rounded-lg font-display text-[11px] font-bold uppercase"
                        style={{
                          backgroundColor: won ? "hsl(var(--success) / 0.15)" : "hsl(var(--danger) / 0.15)",
                          color: won ? "hsl(var(--success))" : "hsl(var(--danger))",
                        }}
                      >
                        {won ? "T" : "B"}
                      </span>
                      <div className="leading-tight">
                        <p className="stat-number text-lg font-bold">
                          {myScore} <span className="text-muted-foreground">–</span> {oppScore}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} ·{" "}
                          {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <EloDelta delta={delta} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-background/50 p-2">
                      <p className="text-muted-foreground">Đồng đội</p>
                      <p className="mt-0.5 truncate font-display font-semibold">{partner?.name}</p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-2">
                      <p className="text-muted-foreground">Đối thủ</p>
                      <p className="mt-0.5 truncate font-display font-semibold">
                        {oppPlayers.map((o) => o.name.split(" ")[0]).join(" / ")}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {matches.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            <Trophy className="mx-auto mb-2 size-5 opacity-50" />
            Chưa có trận nào — vào sân thôi!
          </div>
        )}
      </section>

      <section className="mt-8 space-y-3">
        {isMe && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                <Shield className="size-4" /> Bảo mật tài khoản
              </div>
              <button 
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setOldPassword("");
                  setNewPassword("");
                }} 
                className="text-[11px] font-semibold text-primary uppercase tracking-wider"
              >
                {isChangingPassword ? "Huỷ" : "Đổi mật khẩu"}
              </button>
            </div>
            
            {isChangingPassword && (
               <form onSubmit={(e) => {
                 e.preventDefault();
                 if (!oldPassword || newPassword.length < 4) {
                   toast.error("Mật khẩu mới phải từ 4 ký tự trở lên.");
                   return;
                 }
                 changePasswordMutation.mutate({ playerId: player.id, data: { oldPassword, newPassword } }, {
                    onSuccess: () => {
                      setIsChangingPassword(false);
                      setOldPassword("");
                      setNewPassword("");
                    }
                 });
               }} className="space-y-3 pt-2 animate-in fade-in zoom-in-95">
                 <input 
                   type="password" 
                   value={oldPassword} 
                   onChange={e => setOldPassword(e.target.value)} 
                   placeholder="Mật khẩu hiện tại" 
                   className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30" 
                 />
                 <input 
                   type="password" 
                   value={newPassword} 
                   onChange={e => setNewPassword(e.target.value)} 
                   placeholder="Mật khẩu mới (tối thiểu 4 ký tự)" 
                   className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30" 
                 />
                 <button 
                   type="submit" 
                   disabled={changePasswordMutation.isPending || !oldPassword || !newPassword} 
                   className="w-full rounded-lg bg-primary/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                 >
                   {changePasswordMutation.isPending ? "Đang xử lý..." : "Xác nhận đổi"}
                 </button>
               </form>
            )}
          </div>
        )}

        {isMe && (
          <div className="space-y-2">
            <button
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold transition-all active:scale-[0.98]",
                pushStatus === "granted" 
                  ? "border-success/20 bg-success/5 text-success" 
                  : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              )}
            >
              {subscribeMutation.isPending ? (
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : pushStatus === "granted" ? (
                <Check className="size-4" />
              ) : (
                <Bell className="size-4" />
              )}
              {pushStatus === "granted" ? "Đã bật thông báo" : "Nhận thông báo trận đấu"}
            </button>

            {pushStatus === "granted" && (
              <button
                onClick={() => testPushMutation.mutate()}
                disabled={testPushMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/50 py-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-surface-elevated active:scale-[0.98]"
              >
                {testPushMutation.isPending ? (
                  <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : (
                  <Radio className="size-3" />
                )}
                Gửi thông báo thử (Test)
              </button>
            )}
            
            {pushStatus === "denied" && (
              <p className="px-2 text-center text-[10px] text-danger">
                ⚠ Bạn đã chặn quyền thông báo. Hãy vào cài đặt trình duyệt để cấp lại quyền cho PickX.
              </p>
            )}
          </div>
        )}

        {isMe && (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 py-3.5 text-sm font-bold text-danger transition-all hover:bg-danger/10 active:scale-[0.98]"
          >
            <LogOut className="size-4" />
            Đăng xuất tài khoản
          </button>
        )}
      </section>

      <AvatarPicker 
        playerId={player.id} 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
      />
    </div>
  );
}

function CompactBox({ 
  label, 
  value, 
  accent, 
  icon, 
  subLabel 
}: { 
  label: string; 
  value: string | number; 
  accent?: string;
  icon?: React.ReactNode;
  subLabel?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/40 bg-background/30 px-2 py-4 text-center transition-transform active:scale-95 hover:bg-background/40">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-col items-center justify-center">
        {icon && icon}
        <p className="stat-number text-lg font-bold" style={accent ? { color: accent } : undefined}>
          {value}
        </p>
        {subLabel && <p className="mt-0.5 text-[8px] font-medium text-muted-foreground/60">{subLabel}</p>}
      </div>
    </div>
  );
}

function BadgeImage({ name, className }: { name: string; className?: string }) {
  let src = "";
  switch (name) {
    case "Lật Đổ Kèo Trên": src = "/badges/lat_do_new.png"; break;
    case "Độc Cô Cầu Bại": src = "/badges/doc_co.png"; break;
    case "Gánh Đội Thần Thánh": src = "/badges/ganh_doi.png"; break;
    case "Kẻ Ngắt Chuỗi": src = "/badges/ngat_chuoi.png"; break;
    case "Vua Kết Nối": src = "/badges/vua_ket_noi.png"; break;
    default: src = "/badges/lat_do_new.png";
  }
  return <img src={src} alt={name} className={cn("object-contain", className || "size-5")} />;
}