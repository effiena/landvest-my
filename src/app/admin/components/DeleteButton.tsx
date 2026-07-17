"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    await fetch(`/api/lands/${id}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        background: "red",
        color: "white",
        padding: "6px 10px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
      }}
    >
      Delete
    </button>
  );
}
