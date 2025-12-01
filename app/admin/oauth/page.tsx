"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
          setClientId(data.provider.clientId || "");
          setClientSecret(data.provider.clientSecret || "");
          setAuthorizationUrl(data.provider.authorizationUrl || "");
          setTokenUrl(data.provider.tokenUrl || "");
          setUserInfoUrl(data.provider.userInfoUrl || "");
          setScope(data.provider.scope || "openid profile email");
          setIsEnabled(data.provider.isEnabled || false);
        }
      })
      .catch((err) => {
        console.error("Error fetching OAuth settings:", err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Authentik",
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
        setError(data.error || "Failed to save OAuth settings.");
      } else {
        setSuccess("OAuth settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">OAuth Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Authentik Configuration</CardTitle>
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
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="your-client-id"
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
                placeholder="your-client-secret"
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
                placeholder="openid profile email"
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isEnabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                disabled={loading}
              />
              <Label htmlFor="isEnabled" className="cursor-pointer">
                Enable OAuth Provider
              </Label>
            </div>
            
            {isEnabled && (
              <div className="p-4 bg-muted rounded-md">
                <Label className="text-sm font-semibold">Redirect URI (Callback URL)</Label>
                <div className="mt-2 p-2 bg-background rounded border">
                  <p className="text-sm font-mono break-all" id="redirectUrl">
                    {typeof window !== "undefined" 
                      ? `${window.location.origin}/api/auth/callback/authentik`
                      : "Loading..."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const url = document.getElementById("redirectUrl")?.textContent;
                    if (url) {
                      navigator.clipboard.writeText(url);
                      setSuccess("Redirect URL copied to clipboard!");
                      setTimeout(() => setSuccess(""), 2000);
                    }
                  }}
                >
                  Copy Redirect URL
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy this URL and add it to your Authentik application&apos;s redirect URIs.
                </p>
              </div>
            )}
            
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
