import { NextResponse } from 'next/server';
import { generateLocalCommentReply } from '@/lib/ai/commentReply';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Comment, Post, SupabasePostRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function formatPost(row: SupabasePostRow): Post {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

  return {
    id: row.id,
    category_id: row.category_id || undefined,
    title: row.title,
    summary: row.summary,
    content: row.content || undefined,
    type: row.type,
    category_name: category?.name || '未分類',
    category_color: category?.color_code || '#94a3b8',
    created_at: row.created_at,
    source_url: row.source_url || undefined,
    image_url: row.image_url || undefined,
  };
}

async function generateReply(post: Post, comment: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateLocalCommentReply({ post, comment });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '你是 Siami 的新聞討論助理。請用繁體中文根據文章與留言提供更詳細但精簡的回覆，不要編造文章沒有的事實。',
          },
          {
            role: 'user',
            content: JSON.stringify({
              article: {
                title: post.title,
                summary: post.summary,
                content: post.content,
                source_url: post.source_url,
              },
              comment,
            }),
          },
        ],
        temperature: 0.3,
        max_tokens: 420,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    return payload.choices?.[0]?.message?.content?.trim()
      || generateLocalCommentReply({ post, comment });
  } catch (error) {
    console.error('Failed to generate model reply:', error);
    return generateLocalCommentReply({ post, comment });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = cleanText(searchParams.get('postId'), 80);

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id,post_id,author_name,body,ai_reply,created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: (data ?? []) as Comment[] });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as {
    postId?: unknown;
    authorName?: unknown;
    body?: unknown;
  } | null;

  const postId = cleanText(payload?.postId, 80);
  const authorName = cleanText(payload?.authorName, 40) || '匿名訪客';
  const body = cleanText(payload?.body, 1000);

  if (!postId || body.length < 2) {
    return NextResponse.json(
      { error: 'postId and a comment body are required' },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select(`
      id,
      category_id,
      title,
      summary,
      content,
      type,
      created_at,
      source_url,
      image_url,
      categories (
        name,
        color_code
      )
    `)
    .eq('id', postId)
    .single();

  if (postError || !postData) {
    return NextResponse.json(
      { error: postError?.message || 'Post not found' },
      { status: 404 }
    );
  }

  const post = formatPost(postData as SupabasePostRow);
  const aiReply = await generateReply(post, body);
  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_name: authorName,
      body,
      ai_reply: aiReply,
    })
    .select('id,post_id,author_name,body,ai_reply,created_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ comment: comment as Comment }, { status: 201 });
}
