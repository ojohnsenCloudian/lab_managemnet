"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteGuideButton({ guideId }: { guideId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this guide?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/guides/${guideId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Error deleting guide:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

