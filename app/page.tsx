"use client"; // 因為我們要用到即時監聽與狀態管理，必須宣告為客戶端組件

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import type { Category, Comment, Post, SupabasePostRow } from '@/lib/types';

interface CommentFormState {
  authorName: string;
  body: string;
  submitting: boolean;
  error?: string;
}

function formatPost(item: SupabasePostRow): Post {
  const category = Array.isArray(item.categories)
    ? item.categories[0]
    : item.categories;

  return {
    id: item.id,
    category_id: item.category_id || undefined,
    title: item.title,
    summary: item.summary,
    content: item.content || undefined,
    type: item.type,
    category_name: category?.name || '未分類',
    category_color: category?.color_code || '#94a3b8',
    created_at: item.created_at,
    source_url: item.source_url || undefined,
    image_url: item.image_url || undefined,
  };
}

function mergeComments(existing: Comment[], incoming: Comment) {
  if (existing.some((comment) => comment.id === incoming.id)) {
    return existing;
  }

  return [...existing, incoming].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentCountsByPost, setCommentCountsByPost] = useState<Record<string, number>>({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState<Record<string, boolean>>({});
  const [commentForms, setCommentForms] = useState<Record<string, CommentFormState>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 函數：從 Supabase 抓取所有貼文 (包含分類資訊)
  const fetchPosts = useCallback(async () => {
    try {
      // 我們使用 SQL Join 的方式，同時抓取 post 的內容以及它所屬分類的名稱與顏色
      const { data, error } = await supabase
        .from('posts')
        .select(`
              id,
              title,
              summary,
              content,
              type,
              category_id,
              created_at,
              source_url,
              image_url,
              categories (
                name,
                color_code
              )
            `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 整理資料格式，讓它符合 Post 介面
      const rows = (data ?? []) as SupabasePostRow[];
      const formattedData = rows.map(formatPost);

      setPosts(formattedData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,color_code')
      .order('name', { ascending: true });

    if (!error) {
      setCategories((data ?? []) as Category[]);
    }
  }, []);

  const fetchCommentCounts = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('post_id');

    if (error) {
      console.error('Error fetching comment counts:', error);
      return;
    }

    const counts = (data ?? []).reduce<Record<string, number>>((current, row) => {
      const postId = row.post_id as string | null;

      if (postId) {
        current[postId] = (current[postId] ?? 0) + 1;
      }

      return current;
    }, {});

    setCommentCountsByPost(counts);
  }, []);

  const fetchComments = useCallback(async (postId: string) => {
    setCommentLoadingByPost((current) => ({ ...current, [postId]: true }));

    try {
      const response = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
      const payload = await response.json() as {
        comments?: Comment[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || '留言讀取失敗');
      }

      setCommentsByPost((current) => ({
        ...current,
        [postId]: payload.comments ?? [],
      }));
      setCommentCountsByPost((current) => ({
        ...current,
        [postId]: payload.comments?.length ?? 0,
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentLoadingByPost((current) => ({ ...current, [postId]: false }));
    }
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'all'
        || post.category_id === selectedCategory;
      const searchable = `${post.title} ${post.summary} ${post.content ?? ''}`.toLowerCase();
      const matchesKeyword = !keyword || searchable.includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [posts, searchQuery, selectedCategory]);

  const handleTogglePost = (postId: string) => {
    const nextPostId = expandedPostId === postId ? null : postId;
    setExpandedPostId(nextPostId);

    if (nextPostId && !commentsByPost[nextPostId]) {
      void fetchComments(nextPostId);
    }
  };

  const updateCommentForm = (
    postId: string,
    patch: Partial<CommentFormState>
  ) => {
    const defaultForm: CommentFormState = {
      authorName: '',
      body: '',
      submitting: false,
    };

    setCommentForms((current) => ({
      ...current,
      [postId]: {
        ...defaultForm,
        ...current[postId],
        ...patch,
      },
    }));
  };

  const handleSubmitComment = async (post: Post) => {
    const form = commentForms[post.id] ?? {
      authorName: '',
      body: '',
      submitting: false,
    };

    if (form.body.trim().length < 2) {
      updateCommentForm(post.id, { error: '請輸入至少 2 個字的留言。' });
      return;
    }

    updateCommentForm(post.id, { submitting: true, error: undefined });

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          authorName: form.authorName,
          body: form.body,
        }),
      });
      const payload = await response.json() as {
        comment?: Comment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        throw new Error(payload.error || '留言送出失敗');
      }

      setCommentsByPost((current) => ({
        ...current,
        [post.id]: mergeComments(current[post.id] ?? [], payload.comment as Comment),
      }));
      updateCommentForm(post.id, { body: '', submitting: false });
    } catch (error) {
      updateCommentForm(post.id, {
        submitting: false,
        error: error instanceof Error ? error.message : '留言送出失敗',
      });
    }
  };

  useEffect(() => {
    // 1. 頁面載入時，先抓取一次資料
    const initialFetch = window.setTimeout(() => {
      void fetchPosts();
      void fetchCategories();
      void fetchCommentCounts();
    }, 0);

    // 2. 設定即時監聽 (Realtime Subscription)
    const channel = supabase
      .channel('schema-db-changes') // 頻道名稱可以自訂
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // 我們只監聽「新增」動作
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('收到新貼文！', payload);
          // 當收到新資料時，重新執行 fetchPosts 來更新畫面
          void fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const comment = payload.new as Comment;
          setCommentsByPost((current) => {
            if (!(comment.post_id in current)) {
              return current;
            }

            return {
              ...current,
              [comment.post_id]: mergeComments(current[comment.post_id] ?? [], comment),
            };
          });
          setCommentCountsByPost((current) => ({
            ...current,
            [comment.post_id]: (current[comment.post_id] ?? 0) + 1,
          }));
        }
      )
      .subscribe();

    // 3. 當組件卸載時，取消訂閱以節省資源
    return () => {
      window.clearTimeout(initialFetch);
      supabase.removeChannel(channel);
    };
  }, [fetchCategories, fetchCommentCounts, fetchPosts]);

  return (
    <main className="min-h-screen bg-[#080604] py-10 px-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 頁首 */}
        <header className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#ff7447]">
            AI 與人類共處的新聞聚落
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50">
            Siami Feed
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            即時資訊推送與 AI 對話牆
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-[#2a201c] bg-[#14100f] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="sr-only" htmlFor="feed-search">搜尋新聞</label>
            <input
              id="feed-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋你想看的新聞、議題或關鍵字..."
              className="w-full rounded-xl border border-[#332721] bg-[#0d0a09] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#ff7447] focus:ring-2 focus:ring-[#ff7447]/20"
            />
            <label className="sr-only" htmlFor="category-filter">分類</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-xl border border-[#332721] bg-[#0d0a09] px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#ff7447] focus:ring-2 focus:ring-[#ff7447]/20"
            >
              <option value="all">全部分類</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            目前會讀取 Supabase 中已收錄的新聞；新聞來源抓取由你的 Hermes agent 或後端流程寫入 `posts` 後，這裡會即時更新。
          </p>
        </section>

        {/* 內容區 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ff7447]"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-2">
            {filteredPosts.map((post) => {
              const comments = commentsByPost[post.id] ?? [];
              const commentCount = commentsByPost[post.id]?.length
                ?? commentCountsByPost[post.id]
                ?? 0;
              const form = commentForms[post.id] ?? {
                authorName: '',
                body: '',
                submitting: false,
              };

              return (
              <PostCard
                key={post.id}
                title={post.title}
                summary={post.summary}
                content={post.content}
                type={post.type}
                categoryName={post.category_name}
                categoryColor={post.category_color}
                createdAt={post.created_at}
                sourceUrl={post.source_url}
                commentCount={commentCount}
                isExpanded={expandedPostId === post.id}
                onToggle={() => handleTogglePost(post.id)}
              >
                <div className="space-y-4">
                  <div>
                    <p className="mb-3 text-xs font-semibold text-zinc-500">
                      留言給 Siami AI，讓它根據這篇文章補充更細的脈絡。
                    </p>
                    <div className="grid gap-3">
                      <input
                        value={form.authorName}
                        onChange={(event) =>
                          updateCommentForm(post.id, { authorName: event.target.value })
                        }
                        placeholder="你的名稱（可留空匿名）"
                        className="rounded-xl border border-[#332721] bg-[#0d0a09] px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#ff7447] focus:ring-2 focus:ring-[#ff7447]/20"
                      />
                      <textarea
                        value={form.body}
                        onChange={(event) =>
                          updateCommentForm(post.id, { body: event.target.value })
                        }
                        placeholder="例如：這件事後續可能影響什麼？有沒有更多背景？"
                        rows={3}
                        className="rounded-xl border border-[#332721] bg-[#0d0a09] px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#ff7447] focus:ring-2 focus:ring-[#ff7447]/20"
                      />
                      {form.error && (
                        <p className="text-xs text-red-400">{form.error}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleSubmitComment(post)}
                        disabled={form.submitting}
                        className="w-fit rounded-full bg-[#ff7447] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff8b63] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {form.submitting ? 'AI 回覆生成中...' : '送出留言並取得 AI 回覆'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {commentLoadingByPost[post.id] ? (
                      <p className="text-sm text-zinc-500">讀取留言中...</p>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <article
                          key={comment.id}
                          className="rounded-xl border border-[#2a201c] bg-[#120f0e] p-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-zinc-100">
                              {comment.author_name}
                            </p>
                            <time className="text-xs text-zinc-600">
                              {new Date(comment.created_at).toLocaleString()}
                            </time>
                          </div>
                          <p className="text-sm leading-6 text-zinc-300">{comment.body}</p>
                          <div className="mt-3 rounded-lg border border-[#ff7447]/20 bg-[#211713] p-3">
                            <p className="mb-1 text-xs font-semibold text-[#ff7447]">Siami AI 回覆</p>
                            <p className="whitespace-pre-line text-sm leading-6 text-zinc-100">
                              {comment.ai_reply}
                            </p>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-xl border border-[#2a201c] bg-[#120f0e] p-4 text-sm text-zinc-500">
                        還沒有留言，成為第一個提問的人吧。
                      </p>
                    )}
                  </div>
                </div>
              </PostCard>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-500">
            <p>目前沒有符合條件的內容，請換個關鍵字或分類。</p>
          </div>
        )}
      </div>
    </main>
  );
}
