# AKnight Media

Static website for [AKnight Media](https://aknightmedia.com), hosted on AWS S3 + CloudFront.

## Project structure

```
aknightmedia/
├── index.html      # Main page
├── styles.css      # Styles
├── script.js       # Mobile nav + footer year
├── scripts/
│   └── deploy-aws.sh
└── .env            # Local config (not committed or deployed)
```

## Edit the site

1. Open this folder in Cursor.
2. Edit `index.html`, `styles.css`, or `script.js`.
3. Preview locally by opening `index.html` in a browser.

## GitHub workflow

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

Repository: https://github.com/amilene/aknightmedia

## Deploy to AWS

```bash
./scripts/deploy-aws.sh
```

Live site: https://d1yx8foe0modq8.cloudfront.net

### AWS resources (already configured)

| Resource | Value |
|----------|-------|
| S3 bucket | `aknightmedia-319246817188` |
| CloudFront distribution | `E3W0XDJBHPF24U` |
| Region | `us-east-1` |

Override any value via environment variables before running the deploy script.
