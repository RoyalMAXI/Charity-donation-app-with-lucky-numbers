"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LuckyNumberDisplay } from "./components/LuckyNumberDisplay"
import { supabase } from "@/lib/supabase"

type CharityId = "children" | "animal" | "water" | "climate"

type CharityRow = {
  id: string
  name: string
  raised: number | null
}

const CHARITIES: { id: CharityId; label: string; icon: string; tagline: string }[] = [
  { id: "children", label: "Children", icon: "🎒", tagline: "Education & safety for kids" },
  { id: "animal", label: "Animals", icon: "🐾", tagline: "Rescue & protect wildlife" },
  { id: "water", label: "Water", icon: "💧", tagline: "Clean water access" },
  { id: "climate", label: "Climate", icon: "🌍", tagline: "Protect our planet" },
]

export default function LotteryLanding() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([])
  const [showNumbers, setShowNumbers] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle")
  const [selectedCharity, setSelectedCharity] = useState<CharityId>("children")
  const [leaderboard, setLeaderboard] = useState<CharityRow[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [amountInput, setAmountInput] = useState("1.00")
  const [amountError, setAmountError] = useState<string | null>(null)

  const parsedAmount = useMemo(() => {
    const value = parseFloat(amountInput.replace(",", "."))
    return Number.isFinite(value) ? value : NaN
  }, [amountInput])

  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount >= 1

  const isCharityId = (value: string | null): value is CharityId =>
    !!value && (["children", "animal", "water", "climate"] as const).includes(value as CharityId)

  const getSelectedCharityName = () => {
    const fromConfig = CHARITIES.find((c) => c.id === selectedCharity)?.label
    const fromDb = leaderboard.find((c) => c.id === selectedCharity)?.name
    return fromDb ?? fromConfig ?? "Charity"
  }

  const getCharityRaised = (id: CharityId) => {
    const row = leaderboard.find((c) => c.id === id)
    return row?.raised ?? 0
  }

  const totalRaised = leaderboard.reduce((sum, charity) => sum + (charity.raised ?? 0), 0)

  const loadLeaderboard = useCallback(async () => {
    if (!supabase) {
      setLeaderboardError("Supabase is not configured.")
      return
    }

    try {
      setIsLoadingLeaderboard(true)
      setLeaderboardError(null)

      const { data, error } = await supabase
        .from("charities")
        .select("id, name, raised")
        .order("raised", { ascending: false })

      if (error) {
        console.error("Error loading leaderboard:", error)
        setLeaderboardError("Unable to load leaderboard.")
        return
      }

      setLeaderboard(data ?? [])
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }, [])

  const incrementCharityRaised = useCallback(
    async (charity: CharityId, amount: number) => {
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from("charities")
          .select("raised")
          .eq("id", charity)
          .single()

        if (error) {
          console.error("Error fetching current raised amount:", error)
          return
        }

        const current = data?.raised ?? 0

        const { error: updateError } = await supabase
          .from("charities")
          .update({ raised: current + amount })
          .eq("id", charity)

        if (updateError) {
          console.error("Error updating raised amount:", updateError)
        }
      } finally {
        // Always try to refresh leaderboard after an attempted update
        loadLeaderboard().catch((err) =>
          console.error("Error refreshing leaderboard after update:", err),
        )
      }
    },
    [loadLeaderboard],
  )

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      if (!isMounted) return
      await loadLeaderboard()
    }

    init()

    const interval = setInterval(() => {
      if (!isMounted) return
      loadLeaderboard().catch((err) =>
        console.error("Error refreshing leaderboard on interval:", err),
      )
    }, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [loadLeaderboard])

  useEffect(() => {
    const success = searchParams.get("success")
    const amountParam = searchParams.get("amount")
    const charityParam = searchParams.get("charity")

    if (success === "true" && amountParam) {
      const paidAmount = parseFloat(amountParam)

      if (!Number.isNaN(paidAmount) && paidAmount >= 1) {
        const charity: CharityId = isCharityId(charityParam) ? charityParam : "children"

        const numbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1)

        // Update Supabase with the new raised amount
        incrementCharityRaised(charity, paidAmount).catch((err) =>
          console.error("Error incrementing charity raised amount:", err),
        )

        setSelectedCharity(charity)
        setLuckyNumbers(numbers)
        setShowNumbers(true)
        setPaymentStatus("success")
        setAmountInput(paidAmount.toFixed(2))
      } else {
        setPaymentStatus("error")
      }

      router.replace("/", { scroll: false })
    } else if (searchParams.get("canceled") === "true") {
      setPaymentStatus("idle")
    }
  }, [router, searchParams])

  const handleCheckout = async () => {
    setAmountError(null)

    if (!isAmountValid) {
      setAmountError("Please enter at least €1.00.")
      return
    }

    try {
      setIsCheckingOut(true)
      setPaymentStatus("idle")
      setShowNumbers(false)

      const amountInCents = Math.round(parsedAmount * 100)

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInCents, charityId: selectedCharity }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to start checkout.")
      }

      const { url } = await response.json()

      if (!url || typeof url !== "string") {
        throw new Error("Stripe did not return a checkout URL.")
      }

      window.location.href = url
    } catch (error: any) {
      console.error("Checkout error:", error)
      setPaymentStatus("error")
      setAmountError(error?.message || "Something went wrong starting checkout.")
    } finally {
      setIsCheckingOut(false)
    }
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
              const raised = getCharityRaised(charity.id)
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
                      {raised > 0 && (
                        <span className="text-[10px] md:text-xs font-mono text-emerald-300">
                          €{raised.toFixed(2)}
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

        {/* Amount input + Main CTA Button */}
        <div className="mb-16 flex flex-col items-center">
          <div className="w-full max-w-xs mb-4">
            <label className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.25em] text-emerald-300/80 mb-2">
              <span>Donation Amount</span>
              <span className="text-[10px] text-emerald-500/80">Min €1.00</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-emerald-300 text-sm">
                €
              </div>
              <input
                type="number"
                min={1}
                step={0.5}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full rounded-xl border border-emerald-700/70 bg-black/60 px-7 py-2 text-sm text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.2)] focus:outline-none focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80"
              />
            </div>
            {amountError && (
              <p className="mt-1 text-xs text-red-400/90 font-mono">{amountError}</p>
            )}
          </div>

          <Button
            onClick={handleCheckout}
            disabled={isCheckingOut || !isAmountValid}
            size="lg"
            className="relative h-auto py-8 px-12 text-xl md:text-2xl font-bold bg-primary text-primary-foreground glow-green-intense hover:glow-green-intense hover:scale-105 transition-all duration-300 rounded-xl border-2 border-primary/50"
          >
            <span className="relative z-10 text-balance">
              {isCheckingOut
                ? "Redirecting to secure checkout..."
                : `Get 5 Lucky Numbers for €${isAmountValid ? parsedAmount.toFixed(2) : "0.00"}`}
            </span>
            {isCheckingOut && (
              <div className="absolute inset-0 bg-primary animate-pulse rounded-xl opacity-60" />
            )}
          </Button>

          <p className="mt-6 text-muted-foreground text-sm md:text-base text-center max-w-md">
            {"Every purchase supports charitable causes. Your luck makes a difference."}
          </p>

          <LuckyNumberDisplay
            showNumbers={showNumbers}
            luckyNumbers={luckyNumbers}
            paymentStatus={paymentStatus}
            getSelectedCharityName={getSelectedCharityName}
          />
        </div>

        {/* Charity Counter */}
        <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm min-w-[280px] md:min-w-[400px]">
          <div className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-mono">
            Total Raised for Charity
          </div>
          <div className="text-5xl md:text-6xl font-bold font-mono text-primary text-glow-green tabular-nums">
            €{totalRaised.toFixed(2)}
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
            {leaderboard.map((charity) => {
              const value = charity.raised ?? 0
              const percentage = totalRaised > 0 ? (value / totalRaised) * 100 : 0
              const config = CHARITIES.find((c) => c.id === charity.id)
              return (
                <div key={charity.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{config?.icon ?? "✨"}</span>
                      <span className="font-medium text-foreground/80">
                        {charity.name ?? config?.label ?? "Charity"}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-400 text-xs">
                      €{value.toFixed(2)}
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
