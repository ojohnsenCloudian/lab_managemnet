"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function OAuthConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState({
    issuer: "",
    clientId: "",
    clientSecret: "",
    authorizationUrl: "",
    tokenUrl: "",
    userInfoUrl: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/oauth");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig({
            issuer: data.issuer || "",
            clientId: data.clientId || "",
            clientSecret: data.clientSecret || "",
            authorizationUrl: data.authorizationUrl || "",
            tokenUrl: data.tokenUrl || "",
            userInfoUrl: data.userInfoUrl || "",
          });
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save configuration");
      } else {
        setSuccess("OAuth configuration saved successfully!");
        setTimeout(() => {
          router.refresh();
        }, 1500);
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
      <h1 className="text-3xl font-bold mb-8">Authentik OAuth Configuration</h1>
      <Card>
        <CardHeader>
          <CardTitle>Provider Settings</CardTitle>
          <CardDescription>
            Configure Authentik as an OAuth provider for user authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="issuer">Issuer URL</Label>
              <Input
                id="issuer"
                placeholder="https://authentik.example.com"
                value={config.issuer}
                onChange={(e) =>
                  setConfig({ ...config, issuer: e.target.value })
                }
                required
                disabled={saving}
              />
              <p className="text-sm text-muted-foreground">
                Your Authentik instance base URL
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Enter client ID"
                value={config.clientId}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter client secret"
                value={config.clientSecret}
                onChange={(e) =>
                  setConfig({ ...config, clientSecret: e.target.value })
                }
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizationUrl">Authorization URL</Label>
              <Input
                id="authorizationUrl"
                placeholder="https://authentik.example.com/application/o/authorize/"
                value={config.authorizationUrl}
                onChange={(e) =>
                  setConfig({ ...config, authorizationUrl: e.target.value })
                }
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenUrl">Token URL</Label>
              <Input
                id="tokenUrl"
                placeholder="https://authentik.example.com/application/o/token/"
                value={config.tokenUrl}
                onChange={(e) =>
                  setConfig({ ...config, tokenUrl: e.target.value })
                }
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userInfoUrl">User Info URL</Label>
              <Input
                id="userInfoUrl"
                placeholder="https://authentik.example.com/application/o/userinfo/"
                value={config.userInfoUrl}
                onChange={(e) =>
                  setConfig({ ...config, userInfoUrl: e.target.value })
                }
                required
                disabled={saving}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

