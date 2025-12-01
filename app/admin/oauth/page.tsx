"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthPage() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authorizationUrl, setAuthorizationUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [userInfoUrl, setUserInfoUrl] = useState("");
  const [scope, setScope] = useState("openid profile email");
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/oauth")
      .then((res) => res.json())
      .then((data) => {
        if (data.provider) {
          setClientId(data.provider.clientId);
          setClientSecret(data.provider.clientSecret);
          setAuthorizationUrl(data.provider.authorizationUrl);
          setTokenUrl(data.provider.tokenUrl);
          setUserInfoUrl(data.provider.userInfoUrl);
          setScope(data.provider.scope);
          setIsEnabled(data.provider.isEnabled);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
          authorizationUrl,
          tokenUrl,
          userInfoUrl,
          scope,
          isEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save OAuth configuration");
        setLoading(false);
        return;
      }

      setSuccess("OAuth configuration saved successfully!");
      setLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">OAuth Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Authentik Configuration</CardTitle>
          <CardDescription>Configure Authentik as an OAuth provider</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizationUrl">Authorization URL *</Label>
              <Input
                id="authorizationUrl"
                value={authorizationUrl}
                onChange={(e) => setAuthorizationUrl(e.target.value)}
                placeholder="https://authentik.example.com/application/o/authorize/"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenUrl">Token URL *</Label>
              <Input
                id="tokenUrl"
                value={tokenUrl}
                onChange={(e) => setTokenUrl(e.target.value)}
                placeholder="https://authentik.example.com/application/o/token/"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userInfoUrl">User Info URL *</Label>
              <Input
                id="userInfoUrl"
                value={userInfoUrl}
                onChange={(e) => setUserInfoUrl(e.target.value)}
                placeholder="https://authentik.example.com/application/o/userinfo/"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="isEnabled">Enable OAuth provider</Label>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
