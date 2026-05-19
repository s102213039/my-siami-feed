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
    onToggle,
    children,
}: PostCardProps) {
    const typeLabel = type === 'news' ? '新聞' : '留言';

    return (
        <div className="group relative bg-white border border-slate-100 p-6 rounded-2xl transition-all hover:shadow-sm hover:border-slate-200 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: categoryColor }}
                >
                    {categoryName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                    {typeLabel}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(createdAt).toLocaleDateString()}
                </span>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {title}
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                {summary}
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                    <MessageCircle size={14} />
                    {isExpanded ? '收合討論' : `展開討論 (${commentCount})`}
                </button>

                {sourceUrl && (
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline"
                    >
                        閱讀來源
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>

            {isExpanded && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                    {content && (
                        <div className="mb-5 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-500 mb-2">AI 整理重點</p>
                            <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">
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
