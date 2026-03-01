"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type CharityId = "children" | "animal" | "water" | "climate"

const CHARITIES: { id: CharityId; label: string; icon: string; tagline: string }[] = [
  { id: "children", label: "Children", icon: "🎒", tagline: "Education & safety for kids" },
  { id: "animal", label: "Animals", icon: "🐾", tagline: "Rescue & protect wildlife" },
  { id: "water", label: "Water", icon: "💧", tagline: "Clean water access" },
  { id: "climate", label: "Climate", icon: "🌍", tagline: "Protect our planet" },
]

export default function LotteryLanding() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([])
  const [showNumbers, setShowNumbers] = useState(false)
  const [selectedCharity, setSelectedCharity] = useState<CharityId>("children")
  const [charityTotals, setCharityTotals] = useState<Record<CharityId, number>>({
    children: 0,
    animal: 0,
    water: 0,
    climate: 0,
  })

  const totalRaised = Object.values(charityTotals).reduce((sum, amount) => sum + amount, 0)

  const handleGetNumbers = () => {
    setIsAnimating(true)
    setShowNumbers(false)

    const numbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1)

    setTimeout(() => {
      const amount = 0.5
      setCharityTotals((prev) => ({
        ...prev,
        [selectedCharity]: prev[selectedCharity] + amount,
      }))
      setLuckyNumbers(numbers)
      setShowNumbers(true)
      setIsAnimating(false)
    }, 300)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse [animation-delay:1s]" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo/Brand */}
        <div className="mb-12">
          <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-wider text-primary text-glow-green">
            LUCKYDRAW
          </h1>
        </div>

        {/* Charity selection */}
        <div className="mb-10 w-full max-w-xl">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.25em] text-emerald-300/80 mb-3">
            Choose where your luck gives back
          </p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {CHARITIES.map((charity) => {
              const isActive = selectedCharity === charity.id
              return (
                <button
                  key={charity.id}
                  type="button"
                  onClick={() => setSelectedCharity(charity.id)}
                  className={[
                    "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 md:px-4 md:py-4 text-left transition-all duration-200",
                    "bg-black/60 backdrop-blur-sm hover:border-emerald-400/60 hover:bg-emerald-900/20",
                    isActive
                      ? "border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.6)]"
                      : "border-emerald-800/60 shadow-[0_0_15px_rgba(4,120,87,0.4)]",
                  ].join(" ")}
                >
                  <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-emerald-500/10 text-lg md:text-xl">
                    <span>{charity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-semibold text-emerald-100">
                        {charity.label}
                      </span>
                      {charityTotals[charity.id] > 0 && (
                        <span className="text-[10px] md:text-xs font-mono text-emerald-300">
                          ${charityTotals[charity.id].toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] md:text-xs text-emerald-300/80">
                      {charity.tagline}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl border border-emerald-400/60 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main CTA Button */}
        <div className="mb-16 flex flex-col items-center">
          <Button
            onClick={handleGetNumbers}
            disabled={isAnimating}
            size="lg"
            className="relative h-auto py-8 px-12 text-xl md:text-2xl font-bold bg-primary text-primary-foreground glow-green-intense hover:glow-green-intense hover:scale-105 transition-all duration-300 rounded-xl border-2 border-primary/50"
          >
            <span className="relative z-10 text-balance">Get 5 Lucky Numbers for $0.50</span>
            {isAnimating && <div className="absolute inset-0 bg-primary animate-pulse rounded-xl" />}
          </Button>

          <p className="mt-6 text-muted-foreground text-sm md:text-base text-center max-w-md">
            {"Every purchase supports charitable causes. Your luck makes a difference."}
          </p>

          {showNumbers && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-primary text-sm font-mono uppercase tracking-wider text-glow-green">
                Your Lucky Numbers
              </p>
              <div className="flex items-center gap-3 md:gap-4">
                {luckyNumbers.map((number, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/90 to-primary border-2 border-primary/50 glow-green font-mono text-2xl md:text-3xl font-bold text-primary-foreground animate-in zoom-in duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charity Counter */}
        <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm min-w-[280px] md:min-w-[400px]">
          <div className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-mono">
            Total Raised for Charity
          </div>
          <div className="text-5xl md:text-6xl font-bold font-mono text-primary text-glow-green tabular-nums">
            ${totalRaised.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{"Live updating"}</span>
          </div>
        </div>

        {/* Charity Leaderboard */}
        <div className="mt-10 w-full max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
            <span>Charity Leaderboard</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Impact by cause
            </span>
          </div>
          <div className="space-y-3">
            {CHARITIES.map((charity) => {
              const value = charityTotals[charity.id] ?? 0
              const percentage = totalRaised > 0 ? (value / totalRaised) * 100 : 0
              return (
                <div key={charity.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{charity.icon}</span>
                      <span className="font-medium text-foreground/80">{charity.label}</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-xs">
                      ${value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-emerald-950/40 overflow-hidden border border-emerald-800/60">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.9)] transition-all duration-500"
                      style={{
                        width: `${totalRaised === 0 ? 0 : Math.max(6, percentage)}%`,
                        opacity: value > 0 ? 1 : 0.18,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer text */}
        <div className="mt-16 text-center space-y-2">
          <p className="text-xs md:text-sm text-muted-foreground">
            {"Instant digital delivery • Secure payment • 100% transparent"}
          </p>
        </div>
      </div>
    </div>
  )
}
