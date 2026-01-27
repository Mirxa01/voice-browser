# ⚠️ Important: Do Not Load This Directory Directly

This is the **source code** directory for the Mirza Browser extension. Chrome cannot load this directory directly because it contains TypeScript source files and a `manifest.js` file instead of a `manifest.json` file.

## How to Load the Extension

You need to **build the extension first**:

1. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Build the extension**:
   ```bash
   pnpm build
   ```

3. **Load the built extension**:
   - Open `chrome://extensions/` in Chrome
   - Enable "Developer mode" (top right)
   - Click "Load unpacked" (top left)
   - Select the **`dist`** folder (not this `chrome-extension` folder!)

## Development Mode

If you're developing the extension, use:

```bash
pnpm dev
```

This will watch for changes and automatically rebuild the extension to the `dist/` directory.

## Need Help?

See the main [README.md](../README.md) in the root directory for complete installation and build instructions.
