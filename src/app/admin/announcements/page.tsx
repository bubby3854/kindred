import { AnnouncementForm } from "./announcement-form";

export const metadata = { title: "공지 작성 · 관리자 · kindred" };

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl leading-tight">전체 공지.</h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          작성한 공지는 모든 사용자의 알림함(헤더 종 모양)에 즉시 표시되며,
          빨간 점으로 미확인 상태가 표시됩니다.
        </p>
      </header>

      <AnnouncementForm />
    </div>
  );
}
