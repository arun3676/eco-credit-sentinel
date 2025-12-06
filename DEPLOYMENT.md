# Deployment Guide for Vercel

## Quick Deploy Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository: `arun3676/eco-credit-sentinel`
4. Vercel will auto-detect Next.js settings

### 2. Configure Environment Variables

In Vercel project settings, add these environment variables:

```
APIFY_TOKEN=your_apify_api_token
APIFY_KEY_VALUE_STORE_ID=your_key_value_store_id
APIFY_ACTOR_ID=momentous_hill/greenwashing-detector-for-esgs
```

**How to add:**
- Go to Project Settings → Environment Variables
- Add each variable for **Production**, **Preview**, and **Development**
- Click **Save**

### 3. Deploy

- Click **"Deploy"** button
- Wait for build to complete (usually 1-2 minutes)
- Your app will be live at `https://your-project.vercel.app`

### 4. Verify Deployment

1. Check the deployment logs for any errors
2. Visit your live URL
3. Test the upload and audit flow

## Environment Variables Setup

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `APIFY_TOKEN` | Apify API authentication token | [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations) |
| `APIFY_KEY_VALUE_STORE_ID` | Key-Value Store ID for file storage | [Apify Console → Storage → Key-Value Stores](https://console.apify.com/storage/key-value-stores) |
| `APIFY_ACTOR_ID` | Actor ID (required) | `momentous_hill/greenwashing-detector-for-esgs` |

### Getting Your Credentials

#### APIFY_TOKEN
1. Sign in to [Apify Console](https://console.apify.com/)
2. Navigate to **Settings** → **Integrations**
3. Copy your **API token**

#### APIFY_KEY_VALUE_STORE_ID
1. In Apify Console, go to **Storage** → **Key-Value Stores**
2. Create a new store (or use existing)
3. Copy the **Store ID** from the store details page

#### APIFY_ACTOR_ID
- Required: `momentous_hill/greenwashing-detector-for-esgs`
- This is the Actor ID used for the audit process

## Build Configuration

Vercel automatically detects Next.js projects. The build settings are:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Rebuild on environment variable changes

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure Node.js version is 18+ (Vercel auto-detects)

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify Apify credentials are correct
- Test API endpoints individually

### File Upload Issues
- Verify `APIFY_KEY_VALUE_STORE_ID` is correct
- Check Apify store permissions
- Ensure store is accessible with your token

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build successful
- [ ] Homepage loads correctly
- [ ] File upload works
- [ ] Audit trigger works
- [ ] Status polling works
- [ ] Results display correctly

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Apify credentials
4. Review API endpoint responses

