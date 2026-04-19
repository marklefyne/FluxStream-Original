"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LoyaltyData {
  xp: number;
  level: number;
  totalMinutes: number;
}

const XP_PER_INTERVAL = 10;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  if (xp < 4000) return 6;
  if (xp < 8000) return 7;
  if (xp < 15000) return 8;
  if (xp < 30000) return 9;
  return 10;
}

function getXpForLevel(level: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
  return thresholds[level - 1] || 0;
}

function getXpForNextLevel(level: number): number {
  const thresholds = [100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, Infinity];
  return thresholds[level - 1] || 999999;
}

function getNodeId(): string {
  if (typeof window === "undefined") return "";
  let nodeId = localStorage.getItem("node_id");
  if (!nodeId) {
    nodeId = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("node_id", nodeId);
  }
  return nodeId;
}

async function fetchLoyaltyData(nodeId: string): Promise<LoyaltyData> {
  try {
    const res = await fetch(`/api/loyalty?node_id=${nodeId}`);
    if (res.ok) {
      const data = await res.json();
      const xp = data.xp || 0;
      return { xp, level: getLevel(xp), totalMinutes: data.total_minutes || 0 };
    }
  } catch {
    // Silent fail
  }
  return { xp: 0, level: 1, totalMinutes: 0 };
}

export function useLoyaltyTracker(isWatching: boolean) {
  const [loyalty, setLoyalty] = useState<LoyaltyData>({ xp: 0, level: 1, totalMinutes: 0 });
  const [xpJustEarned, setXpJustEarned] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nodeIdRef = useRef(getNodeId());
  const hasFetched = useRef(false);

  const syncXp = useCallback(async () => {
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: nodeIdRef.current,
          xp_added: XP_PER_INTERVAL,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newXp = data.total_xp || 0;
        setLoyalty({
          xp: newXp,
          level: getLevel(newXp),
          totalMinutes: data.total_minutes || 0,
        });
        setXpJustEarned(true);
        setTimeout(() => setXpJustEarned(false), 3000);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Fetch loyalty data once on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLoyaltyData(nodeIdRef.current).then(setLoyalty);
    }
  }, []);

  const refreshLoyalty = useCallback(() => {
    fetchLoyaltyData(nodeIdRef.current).then(setLoyalty);
  }, []);

  // Start/stop XP timer based on watching state
  useEffect(() => {
    if (isWatching && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        syncXp();
      }, INTERVAL_MS);
    }

    if (!isWatching && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isWatching, syncXp]);

  const progressPercent = loyalty.level >= 10
    ? 100
    : ((loyalty.xp - getXpForLevel(loyalty.level)) / (getXpForNextLevel(loyalty.level) - getXpForLevel(loyalty.level))) * 100;

  return {
    xp: loyalty.xp,
    level: loyalty.level,
    totalMinutes: loyalty.totalMinutes,
    xpToNextLevel: loyalty.level >= 10 ? 0 : getXpForNextLevel(loyalty.level) - loyalty.xp,
    progressPercent: Math.min(progressPercent, 100),
    xpJustEarned,
    refreshLoyalty,
  };
}
