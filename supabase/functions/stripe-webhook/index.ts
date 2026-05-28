import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Trata requisições de segurança (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Recebe o ID do usuário que clicou no botão de se inscrever
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID válido é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ativa o Premium/Inscrito do usuário no banco de dados
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (error) throw error;

    // Busca o link do canal configurado nas variáveis de ambiente do Supabase
    const youtubeLink = Deno.env.get("YOUTUBE_CHANNEL_LINK") || "https://youtube.com";

    return new Response(JSON.stringify({ success: true, redirectUrl: `${youtubeLink}?sub_confirmation=1` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro ao processar inscrição" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
