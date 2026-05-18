# Publish to the official MCP Registry

Server id: `io.github.Fabio662/yieldagentx402`  
Verify URL (latest version): https://registry.modelcontextprotocol.io/v0.1/servers/io.github.Fabio662%2Fyieldagentx402/versions/latest

## 1. Use the correct directory

From the monorepo root:

```bash
cd integrations/mcp-server
```

If you see `no such file or directory: integrations/mcp-server`, you are not in **Master-BaselineV2** (or the folder is named differently). Run:

```bash
cd /Users/fabianjefferson/Desktop/Master-BaselineV2/integrations/mcp-server
```

## 2. Install the publisher CLI (no `#` on the same line)

**Do not** paste comments into the npm command. This breaks npm:

```bash
# WRONG — npm treats "#" as a package name
npm i -g @modelcontextprotocol/mcp-publisher # if needed
```

**Correct:**

```bash
npm install -g @modelcontextprotocol/mcp-publisher
```

## 3. Log in again (fixes 401 / expired JWT)

Registry JWTs are **short-lived** (~minutes). If you see:

`Invalid or expired Registry JWT token` / `token is expired`

you must **log in immediately before publish**:

```bash
cd integrations/mcp-server
mcp-publisher login github
```

Follow the device flow at https://github.com/login/device, then:

```bash
./scripts/publish-mcp-registry.sh
```

Publish **within a few minutes** of login. Do not wait hours between `login` and `publish`.

## 4. Requirements

- GitHub user **Fabio662** must own or have rights to publish `io.github.Fabio662/yieldagentx402`
- `server.json` `name` must stay `io.github.Fabio662/yieldagentx402`
- `server.json` `version` must match `package.json` (currently **1.0.3**)
- Public repo in manifest: https://github.com/Fabio662/yieldagentx402-sdks (`mcp-server/` subfolder)

## 5. After publish

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.Fabio662%2Fyieldagentx402/versions/latest"
```

Expect **200**. PulseMCP does **not** require this; it uses your live `/.well-known/server.json`.

## Optional: clear stale credentials

If login keeps failing, remove old publisher config and log in again (path may vary by OS):

```bash
rm -f ~/.config/mcp-publisher/credentials.json 2>/dev/null
rm -f ~/.mcp-publisher/credentials.json 2>/dev/null
mcp-publisher login github
```
