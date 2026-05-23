import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';

export interface ArchiveDateGroup {
  dateKey: string;
  label: string;
  posts: Post[];
}

interface NewsArchiveSidebarProps {
  groups: ArchiveDateGroup[];
  collapsedDates: ReadonlySet<string>;
  selectedPostId: string | null;
  onToggleDate: (dateKey: string) => void;
  onSelectPost: (postId: string) => void;
}

export default function NewsArchiveSidebar({
  groups,
  collapsedDates,
  selectedPostId,
  onToggleDate,
  onSelectPost,
}: NewsArchiveSidebarProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <aside className="mb-6 lg:mb-0">
      <div className="rounded-2xl border border-[#2a201c] bg-[#14100f] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7447]">
          歷史新聞
        </p>
        <h2 className="mt-1 mb-4 text-sm font-semibold text-zinc-50">
          依日期瀏覽
        </h2>

        <div className="space-y-3">
          {groups.map((group) => {
            const isCollapsed = collapsedDates.has(group.dateKey);

            return (
              <section key={group.dateKey} className="rounded-xl border border-[#2a201c] bg-[#0d0a09]">
                <button
                  type="button"
                  onClick={() => onToggleDate(group.dateKey)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-zinc-100 transition hover:text-[#ff7447]"
                  aria-expanded={!isCollapsed}
                >
                  <span>{group.label}</span>
                  <span className="flex items-center gap-1 text-xs font-normal text-zinc-500">
                    {group.posts.length} 則
                    {isCollapsed ? (
                      <ChevronRight size={16} aria-hidden />
                    ) : (
                      <ChevronDown size={16} aria-hidden />
                    )}
                  </span>
                </button>

                {!isCollapsed && (
                  <ul className="space-y-0.5 border-t border-[#2a201c] px-2 py-2">
                    {group.posts.map((post) => {
                      const isSelected = selectedPostId === post.id;

                      return (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => onSelectPost(post.id)}
                            className={`w-full rounded-lg px-2 py-2 text-left text-xs leading-5 transition ${
                              isSelected
                                ? 'bg-[#ff7447]/15 text-[#ffb199]'
                                : 'text-zinc-400 hover:bg-[#211b18] hover:text-zinc-100'
                            }`}
                          >
                            {post.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
