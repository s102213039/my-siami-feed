import React from 'react';
import { Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PostCardProps {
    title: string;
    summary: string;
    type: 'news' | 'message';
    categoryName: string;
    categoryColor: string;
    createdAt: string;
    sourceUrl?: string;
}

export default function PostCard({
    title, summary, type, categoryName, categoryColor, createdAt, sourceUrl
}: PostCardProps) {
    return (
        <div className="group relative bg-white border border-slate-100 p-6 rounded-2xl transition-all hover:shadow-sm hover:border-slate-200 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: categoryColor }}
                >
                    {categoryName}
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

            {sourceUrl && (
                <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-500 hover:underline"
                >
                    閱讀全文 →
                </a>
            )}
        </div>
    );
}
