import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = "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";
const WEBHOOK_SECRET = "whsec_rUiHBnMUHuZc0CeaWXnZ11ZSryadSAaF";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    if (sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ is_premium: true })
          .eq("id", userId);
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      // find sessions with this customer to get user_id
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 1,
      });
      const userId = sessions.data[0]?.metadata?.user_id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ is_premium: false })
          .eq("id", userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Webhook error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
