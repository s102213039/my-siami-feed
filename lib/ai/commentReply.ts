import type { Post } from '@/lib/types';

interface ReplyInput {
  post: Pick<Post, 'title' | 'summary' | 'content' | 'source_url'>;
  comment: string;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function pickRelevantExcerpt(source: string, comment: string) {
  const normalizedSource = normalizeWhitespace(source);
  const keywords = normalizeWhitespace(comment)
    .split(/[，。！？、\s,.!?]+/)
    .filter((word) => word.length >= 2)
    .slice(0, 6);

  const sentences = normalizedSource
    .split(/(?<=[。！？.!?])\s*/)
    .filter(Boolean);

  const matched = sentences.find((sentence) =>
    keywords.some((keyword) => sentence.includes(keyword))
  );

  return (matched || sentences[0] || normalizedSource).slice(0, 180);
}

export function generateLocalCommentReply({ post, comment }: ReplyInput) {
  const sourceText = post.content || post.summary;
  const excerpt = pickRelevantExcerpt(sourceText, comment);
  const sourceNote = post.source_url ? `你也可以打開來源連結交叉確認。` : `目前這篇沒有附來源連結。`;

  return [
    `你提到「${normalizeWhitespace(comment).slice(0, 80)}」，這點可以從〈${post.title}〉的脈絡來看。`,
    `重點是：${excerpt}`,
    `${sourceNote} 如果要追更細，我會優先看事件時間線、相關利害關係人，以及後續是否有官方說法更新。`,
  ].join('\n\n');
}
