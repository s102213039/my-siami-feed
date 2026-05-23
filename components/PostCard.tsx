import React from 'react';
import { Clock, ExternalLink, MessageCircle } from 'lucide-react';

interface PostCardProps {
    title: string;
    summary: string;
    content?: string;
    type: 'news' | 'message';
    categoryName: string;
    categoryColor: string;
    createdAt: string;
    sourceUrl?: string;
    commentCount?: number;
    isExpanded: boolean;
    showFullSummary?: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}

export default function PostCard({
    title,
    summary,
    content,
    type,
    categoryName,
    categoryColor,
    createdAt,
    sourceUrl,
    commentCount = 0,
    isExpanded,
    showFullSummary = false,
    onToggle,
    children,
}: PostCardProps) {
    const typeLabel = type === 'news' ? '新聞' : '留言';

    return (
        <div className="group relative rounded-2xl border border-[#2a201c] bg-[#1b1715] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] transition-all hover:border-[#ff7447]/50 hover:bg-[#211b18] mb-4">
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: categoryColor }}
                >
                    {categoryName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#2b2420] text-[10px] font-medium text-[#ffb199]">
                    {typeLabel}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={12} />
                    {new Date(createdAt).toLocaleDateString()}
                </span>
            </div>

            <h3 className="mb-2 text-xl font-semibold text-zinc-50 transition-colors group-hover:text-[#ff7447]">
                {title}
            </h3>

            <p
                className={`mb-4 text-sm leading-relaxed text-zinc-400 ${
                    showFullSummary ? '' : 'line-clamp-2'
                }`}
            >
                {summary}
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-[#ff7447]"
                >
                    <MessageCircle size={14} />
                    {isExpanded ? '收合討論' : `展開討論 (${commentCount})`}
                </button>

                {sourceUrl && (
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#ff7447] hover:underline"
                    >
                        閱讀來源
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>

            {isExpanded && (
                <div className="mt-5 border-t border-[#2a201c] pt-5">
                    {content && (
                        <div className="mb-5 rounded-xl border border-[#2a201c] bg-[#120f0e] p-4">
                            <p className="mb-2 text-xs font-semibold text-[#ff7447]">AI 整理重點</p>
                            <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">
                                {content}
                            </p>
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    );
}
