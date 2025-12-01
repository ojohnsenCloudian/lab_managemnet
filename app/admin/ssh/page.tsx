"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";

interface SSHCredential {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
}

export default function SSHCredentialsPage() {
  const [credentials, setCredentials] = useState<SSHCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 22,
    username: "",
    password: "",
    privateKey: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch("/api/admin/ssh");
      const data = await response.json();
      if (data.credentials) {
        setCredentials(data.credentials);
      }
    } catch (err) {
      console.error("Error fetching credentials:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name || !formData.host || !formData.username) {
      setError("Name, host, and username are required");
      setLoading(false);
      return;
    }

    if (!formData.password && !formData.privateKey) {
      setError("Either password or private key must be provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create credential");
      } else {
        setSuccess("SSH credential created successfully!");
        setDialogOpen(false);
        setFormData({
          name: "",
          host: "",
          port: 22,
          username: "",
          password: "",
          privateKey: "",
        });
        fetchCredentials();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ssh/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      fetchCredentials();
      setSuccess("SSH credential deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete credential");
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">SSH Credentials</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New SSH Credential</DialogTitle>
              <DialogDescription>
                Enter the details for the new SSH connection. Either password or private key is required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Server"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="192.168.1.100"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="root"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty if using private key"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Textarea
                  id="privateKey"
                  className="font-mono text-xs"
                  value={formData.privateKey}
                  onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                  rows={6}
                  disabled={loading}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && !dialogOpen && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
          {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {credentials.map((cred) => (
          <Card key={cred.id}>
            <CardHeader>
              <CardTitle>{cred.name}</CardTitle>
              <CardDescription>
                {cred.username}@{cred.host}:{cred.port}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(cred.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No SSH credentials configured yet. Click "Add New Credential" to get started.
        </div>
      )}
    </div>
  );
}
