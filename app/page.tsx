"use client"; // 因為我們要用到即時監聽與狀態管理，必須宣告為客戶端組件

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';

// 定義貼文的資料結構
interface Post {
  id: string;
  title: string;
  summary: string;
  type: 'news' | 'message';
  category_name: string;
  category_color: string;
  created_at: string;
  source_url?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 函數：從 Supabase 抓取所有貼文 (包含分類資訊)
  const fetchPosts = async () => {
    try {
      // 我們使用 SQL Join 的方式，同時抓取 post 的內容以及它所屬分類的名稱與顏色
      const { data, error } = await supabase
        .from('posts')
        .select(`
              id,
              title,
              summary,
              type,
              created_at,
              source_url,
              categories (
                name,
                color_code
              )
            `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 整理資料格式，讓它符合 Post 介面
      const formattedData = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        type: item.type,
        category_name: item.categories?.name || '未分類',
        category_color: item.categories?.color_code || '#94a3b8',
        created_at: item.created_at,
        source_url: item.source_url,
      })) as Post[];

      setPosts(formattedData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. 頁面載入時，先抓取一次資料
    fetchPosts();

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
          fetchPosts();
        }
      )
      .subscribe();

    // 3. 當組件卸載時，取消訂閱以節省資源
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 頁首 */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Siami Feed
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            即時資訊推送與 AI 對話牆
          </p>
        </header>

        {/* 內容區 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                summary={post.summary}
                type={post.type}
                categoryName={post.category_name}
                categoryColor={post.category_color}
                createdAt={post.created_at}
                sourceUrl={post.source_url}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <p>目前還沒有任何內容，請等待推送...</p>
          </div>
        )}
      </div>
    </main>
  );
}
