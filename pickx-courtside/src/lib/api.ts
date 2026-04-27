import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Court, Match, Player } from "./types";
import { toast } from "sonner";

const API_URL = "https://pickx-porject.onrender.com/api";

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/players`);
      if (!res.ok) throw new Error("Failed to fetch");
      return (await res.json()) as Player[];
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/matches`);
      if (!res.ok) throw new Error("Failed to fetch");
      return (await res.json()) as Match[];
    },
  });
}

export function useLiveCourts() {
  return useQuery({
    queryKey: ["live_courts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/live_courts`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return { courts: data.courts as Court[], bench: data.bench as string[] };
    },
    refetchInterval: 5000,
  });
}

export function useMatchmaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerIds: string[]) => {
      const res = await fetch(`${API_URL}/matchmaker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
      });
      if (!res.ok) throw new Error("Matchmaker failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live_courts"] });
      toast.success("Algorithm Complete: Play courts synced!");
    },
    onError: () => {
      toast.error("Failed to run combinations.");
    }
  });
}

export function useRecordMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { team1Ids: string[], team2Ids: string[], score1: number, score2: number, targetScore: number }) => {
      const res = await fetch(`${API_URL}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Record match failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["live_courts"] });
      toast.success("Match success fully recorded!");
    },
    onError: () => {
      toast.error("Failed to record match.");
    }
  });
}

export function useAddPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; password?: string }) => {
      const res = await fetch(`${API_URL}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Validation failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Hồ sơ đã được lưu trữ vĩnh viễn!");
    },
    onError: () => {
      toast.error("Tên người chơi bị trùng.");
    }
  });
}

export function useUserLogin() {
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch(`${API_URL}/login/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.detail || "Sai thông tin đăng nhập");
      }
      return await res.json();
    }
  });
}

export function useRandomizeAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const res = await fetch(`${API_URL}/players/${playerId}/avatar/randomize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Randomization failed");
      return await res.json();
    },
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["players", playerId] });
      toast.success("Avatar đã được làm mới!");
    },
    onError: () => {
      toast.error("Không thể tạo avatar duy nhất.");
    }
  });
}

export function useAvailableAvatars() {
  return useQuery({
    queryKey: ["available_avatars"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/avatars/available`);
      if (!res.ok) throw new Error("Failed to fetch pool");
      return (await res.json()) as string[];
    },
  });
}

export function useSetAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, avatar_url }: { playerId: string; avatar_url: string }) => {
      const res = await fetch(`${API_URL}/players/${playerId}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url }),
      });
      if (!res.ok) throw new Error("Failed to set avatar");
      return await res.json();
    },
    onSuccess: (_, { playerId }) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["players", playerId] });
      queryClient.invalidateQueries({ queryKey: ["available_avatars"] });
      toast.success("Avatar đã được cập nhật!");
    },
    onError: () => {
      toast.error("Avatar này đã có người chọn rồi!");
    }
  });
}

export function useCancelCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courtIdx: number) => {
      const res = await fetch(`${API_URL}/live_courts/${courtIdx}/cancel`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to cancel match");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live_courts"] });
    }
  });
}

export function usePushSubscribe(playerId: string) {
  return useMutation({
    mutationFn: async (subscription: any) => {
      const res = await fetch(`${API_URL}/players/${playerId}/push-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      return await res.json();
    }
  });
}

export function useTestPushNotification(playerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/players/${playerId}/push-test`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Test failed");
      return await res.json();
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu thông báo thử!");
    },
    onError: () => {
      toast.error("Không thể gửi thông báo thử. Hãy kiểm tra kết nối.");
    }
  });
}

export function useAssignCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courtIdx, team1Ids, team2Ids }: { courtIdx: number; team1Ids: string[]; team2Ids: string[] }) => {
      const res = await fetch(`${API_URL}/live_courts/${courtIdx}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Ids, team2Ids, score1: 0, score2: 0 })
      });
      if (!res.ok) throw new Error("Assign failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live_courts"] });
      toast.success("Đã xếp sân và gửi thông báo!");
    }
  });
}
