"use client";

import { deleteServiceAction } from "../actions";

export function DeleteButton({
  serviceId,
  title,
}: {
  serviceId: string;
  title: string;
}) {
  return (
    <form
      action={deleteServiceAction.bind(null, serviceId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `"${title}"을(를) 삭제할까요? 되돌릴 수 없어요.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="cursor-pointer text-sm text-[color:var(--accent)] underline underline-offset-4 hover:opacity-80"
      >
        이 서비스 삭제
      </button>
    </form>
  );
}
