import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cria o cliente usando a service role para conseguir atualizar o perfil sem travar no RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Valida se o usuário está logado de verdade
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Atualiza o usuário para Premium imediatamente no banco de dados
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // 2. Pega o link do canal do YouTube que você vai cadastrar no painel do Supabase
    // Se não tiver nenhum cadastrado, ele usa um link padrão
    const youtubeLink = Deno.env.get("YOUTUBE_CHANNEL_LINK") || "https://youtube.com";
    
    // Cria o link final com o pop-up de confirmação de inscrição automática
    const finalUrl = `${youtubeLink}?sub_confirmation=1`;

    // Retorna a URL para o site abrir, fingindo que era a URL do Stripe!
    return new Response(JSON.stringify({ url: finalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erro na inscrição do canal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
