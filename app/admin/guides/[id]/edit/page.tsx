"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [steps, setSteps] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchGuide(p.id);
    });
  }, [params]);

  const fetchGuide = async (guideId: string) => {
    try {
      const response = await fetch(`/api/admin/guides/${guideId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load guide");
      } else if (data.guide) {
        setTitle(data.guide.title);
        setDescription(data.guide.description || "");
        setContent(data.guide.content);
        setSteps(data.guide.steps);
        setIsPublished(data.guide.isPublished);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!title || !content || !steps) {
      setError("Title, content, and steps are required");
      setLoading(false);
      return;
    }

    try {
      // Validate steps is valid JSON array
      const stepsArray = JSON.parse(steps);
      if (!Array.isArray(stepsArray)) {
        setError("Steps must be a valid JSON array");
        setLoading(false);
        return;
      }
    } catch (err) {
      setError("Steps must be a valid JSON array (e.g., [\"Step 1\", \"Step 2\"])");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/guides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, content, steps, isPublished }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update lab guide.");
      } else {
        router.push("/admin/guides");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Edit Lab Guide</h1>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Lab Guide</h1>
      <Card>
        <CardHeader>
          <CardTitle>Guide Details</CardTitle>
          <CardDescription>Edit the details for your lab guide.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
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
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML/Markdown) *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">
                Steps (JSON array) *{" "}
                <span className="text-xs text-muted-foreground">
                  e.g., ["Step 1: Do this", "Step 2: Do that"]
                </span>
              </Label>
              <Textarea
                id="steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                required
                disabled={loading}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={loading}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish Guide
              </Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
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
