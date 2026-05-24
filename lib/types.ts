export type PostType = 'news' | 'message';

export interface Post {
  id: string;
  title: string;
  summary: string;
  content?: string;
  detail?: string;
  type: PostType;
  category_id?: string;
  category_name: string;
  category_color: string;
  created_at: string;
  source_url?: string;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color_code: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  body: string;
  ai_reply: string;
  created_at: string;
}

export interface SupabasePostRow {
  id: string;
  category_id: string | null;
  title: string;
  summary: string;
  content: string | null;
  detail: string | null;
  type: PostType;
  created_at: string;
  source_url: string | null;
  image_url: string | null;
  categories:
    | {
        name: string;
        color_code: string;
      }
    | {
        name: string;
        color_code: string;
      }[]
    | null;
}
