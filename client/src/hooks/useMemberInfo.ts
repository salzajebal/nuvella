import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface MemberInfo {
  id: string;
  username: string;
  name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bank: string | null;
  accountNumber: string | null;
  pointBalance: number;
  isFrozen: boolean;
  createdAt: string;
}

export function useMemberInfo() {
  const memberToken = localStorage.getItem("memberToken");
  const isLoggedIn = !!memberToken;

  const query = useQuery<MemberInfo>({
    queryKey: ["member-info"],
    queryFn: async () => {
      const res = await fetch("/api/members/me", {
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    isLoggedIn,
    memberToken,
  };
}

export function useInvalidateMemberInfo() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["member-info"] });
}
