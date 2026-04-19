"use client";

import { Sparkles, Star, Trophy, Clock, Flame } from "lucide-react";
import { useLoyaltyTracker } from "@/hooks/use-loyalty";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_EMOJIS: Record<number, string> = {
  1: "🆕",
  2: "⭐",
  3: "🌟",
  4: "💫",
  5: "🔥",
  6: "💎",
  7: "👑",
  8: "🏆",
  9: "🎖️",
  10: "🏅",
};

const LEVEL_NAMES: Record<number, string> = {
  1: "Newcomer",
  2: "Viewer",
  3: "Fan",
  4: "Enthusiast",
  5: "Binge Watcher",
  6: "Connoisseur",
  7: "Cinephile",
  8: "Expert",
  9: "Master",
  10: "Legend",
};

export function XpBadge({ isWatching }: { isWatching: boolean }) {
  const { xp, level, totalMinutes, xpToNextLevel, progressPercent, xpJustEarned } =
    useLoyaltyTracker(isWatching);

  return (
    <div className="relative">
      <AnimatePresence>
        {xpJustEarned && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 shadow-lg shadow-yellow-500/10">
              <Sparkles size={12} className="text-yellow-400" />
              <span className="text-[11px] font-bold text-yellow-400">+10 XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-yellow-500/30 hover:bg-yellow-500/[0.03] transition-all duration-300 group cursor-default">
        {/* Level Icon */}
        <div className="relative flex-shrink-0">
          <span className="text-lg">{LEVEL_EMOJIS[level]}</span>
          {isWatching && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"
            />
          )}
        </div>

        {/* XP Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-yellow-400">{xp.toLocaleString()} XP</span>
            </div>
            <span className="text-[10px] text-streamex-text-secondary/50">Lv.{level}</span>
          </div>

          {/* Progress Bar */}
          {level < 10 && (
            <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
              />
            </div>
          )}
          {level >= 10 && (
            <div className="text-[9px] text-yellow-500/50 font-medium">MAX LEVEL</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function XpProfileCard({ isWatching }: { isWatching: boolean }) {
  const { xp, level, totalMinutes, xpToNextLevel, progressPercent, xpJustEarned } =
    useLoyaltyTracker(isWatching);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="bg-streamex-surface rounded-xl border border-streamex-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 flex items-center justify-center">
          <span className="text-2xl">{LEVEL_EMOJIS[level]}</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{LEVEL_NAMES[level]}</h3>
          <p className="text-[11px] text-streamex-text-secondary">Level {level} • {xp.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {level < 10 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-streamex-text-secondary">
              Progress to Level {level + 1}
            </span>
            <span className="text-[10px] text-yellow-400 font-medium">
              {xpToNextLevel.toLocaleString()} XP needed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300"
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
          <Clock size={14} className="text-streamex-text-secondary mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{hours}h {mins}m</p>
          <p className="text-[9px] text-streamex-text-secondary">Watch Time</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
          <Star size={14} className="text-yellow-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{xp.toLocaleString()}</p>
          <p className="text-[9px] text-streamex-text-secondary">Total XP</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
          <Trophy size={14} className="text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{level}</p>
          <p className="text-[9px] text-streamex-text-secondary">Rank</p>
        </div>
      </div>

      {/* Status */}
      {isWatching && (
        <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Flame size={14} className="text-green-400" />
          <span className="text-[11px] font-medium text-green-400">
            Earning XP — +10 every 5 min
          </span>
        </div>
      )}
      {!isWatching && (
        <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[11px] text-streamex-text-secondary">
            Start watching to earn XP
          </span>
        </div>
      )}
    </div>
  );
}
