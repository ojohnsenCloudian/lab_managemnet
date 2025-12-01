"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/guides/rich-text-editor";

export default function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: guideId } = use(params);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [steps, setSteps] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGuide(guideId);
  }, [guideId]);

  const loadGuide = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/guides/${id}`);
      if (response.ok) {
        const guide = await response.json();
        setTitle(guide.title);
        setDescription(guide.description || "");
        setContent(guide.content);
        setSteps(guide.steps || "[]");
        setIsPublished(guide.isPublished);
      }
    } catch (err) {
      setError("Failed to load guide");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/guides/${guideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content,
          steps: steps ? JSON.parse(steps) : [],
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update guide");
      } else {
        router.push("/admin/guides");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Lab Guide</h1>
      <Card>
        <CardHeader>
          <CardTitle>Guide Details</CardTitle>
          <CardDescription>Update the lab guide information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">Steps (JSON array)</Label>
              <Textarea
                id="steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder='["Step 1", "Step 2", "Step 3"]'
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={saving}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

