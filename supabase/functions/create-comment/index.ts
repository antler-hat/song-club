import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { track_id, content } = await req.json()

    if (!track_id || !content) {
      return new Response(
        JSON.stringify({ error: 'Track ID and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Input validation
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (trimmedContent.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Comment cannot exceed 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting - max 10 comments per hour per user
    const { data: recentComments } = await supabaseClient
      .from('comments')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (recentComments && recentComments.length >= 10) {
      return new Response(
        JSON.stringify({ error: 'Comment rate limit exceeded. Maximum 10 comments per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify track exists
    const { data: track, error: trackError } = await supabaseClient
      .from('tracks')
      .select('id')
      .eq('id', track_id)
      .single()

    if (trackError || !track) {
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create comment
    const { data: comment, error: commentError } = await supabaseClient
      .from('comments')
      .insert({
        user_id: user.id,
        track_id,
        content: trimmedContent,
      })
      .select(`
        *,
        profiles:user_id (username)
      `)
      .single()

    if (commentError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create comment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ comment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
