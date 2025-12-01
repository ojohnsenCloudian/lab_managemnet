"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/guides/rich-text-editor";

export default function NewGuidePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [steps, setSteps] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/guides", {
        method: "POST",
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
        setError(data.error || "Failed to create guide");
      } else {
        router.push("/admin/guides");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create New Lab Guide</h1>
      <Card>
        <CardHeader>
          <CardTitle>Guide Details</CardTitle>
          <CardDescription>Create a new lab guide with step-by-step instructions</CardDescription>
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
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">Steps (JSON array)</Label>
              <Textarea
                id="steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder='["Step 1", "Step 2", "Step 3"]'
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Enter steps as a JSON array of strings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Guide"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
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

