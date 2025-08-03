import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"; 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

serve(async(req:any)=>{
  if(req.method === "OPTIONS"){
    return new Response("ok",{headers:corsHeaders})
  }

  try{
    const{userIds} = await req.json();

    if(!userIds || !Array.isArray(userIds) || userIds.length === 0){
      return new Response(JSON.stringify([]),{
        headers:{...corsHeaders,"Content-Type":"application/json"},
        status:200
      })
    }

    if(!SUPABASE_URL || !SERVICE_ROLE_KEY){
      throw new Error("Supabase URL or Service Role Key is not set in environment variables.");
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY
    );

    const {data:usersData, error:listUsersError} = await supabaseAdmin.auth.admin.listUsers();
    if(listUsersError) throw listUsersError;

    const requestedUsers = usersData.users
    .filter((user:any)=> userIds.includes(user.id))
    .map((user:any) => ({id:user.id,email:user.email}));

    return new Response(JSON.stringify(requestedUsers),{
      headers:{...corsHeaders,"Content-Type":"application/json"},
      status:200
    });
  }catch(error:any){
    console.error('Error in fetch-user-emails Edge Function:',error);
    return new Response(JSON.stringify({error:error.message}),{
      headers:{...corsHeaders,"Content-Type":"application/json"},
      status:500
    })
  }
})