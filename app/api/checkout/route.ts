import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe checkout will not work.")
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 500 },
      )
    }

    const body = await req.json()
    const { amount, charityId } = body as { amount?: number; charityId?: string }

    if (!amount || typeof amount !== "number" || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 })
    }

    // Minimum 1 EUR == 100 cents
    if (amount < 100) {
      return NextResponse.json({ error: "Minimum amount is €1.00." }, { status: 400 })
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Lucky Numbers Charity Donation",
              description: "Support a cause and receive 5 lucky numbers.",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}?success=true&amount=${amount / 100}&charity=${encodeURIComponent(
        charityId ?? "",
      )}`,
      cancel_url: `${origin}?canceled=true`,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error)
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 })
  }
}

