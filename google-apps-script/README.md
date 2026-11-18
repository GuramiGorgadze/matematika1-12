# Google Sheets bridge (Apps Script)

`Code.gs` receives batches of rows from the server and inserts or updates them by the key in column A,
creating the tabs **მოსწავლეები**, **ტესტები** and **პასუხები** with their header rows on first use.

1. Create a Google Sheet → **Extensions → Apps Script** → paste `Code.gs`.
2. Set `SECRET` in the file to a long random value.
3. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone** → Deploy → authorize.
4. Put the `/exec` URL and the secret into `server/.env`:

```env
SHEETS_MODE=apps-script
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
SHEETS_WEBHOOK_SECRET=…same as SECRET…
```

Opening the `/exec` URL in a browser returns `{"ok":true,…}` with the list of tabs — a quick health check.
After changing `Code.gs`, publish a new version (Deploy → Manage deployments → Edit → New version).
