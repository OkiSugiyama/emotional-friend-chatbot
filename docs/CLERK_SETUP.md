# Clerk setup for Emotional Friend

Use the [official Clerk React/Vite quickstart](https://clerk.com/docs/react/getting-started/quickstart) as the source for dashboard and SDK setup.

## Clerk Dashboard

1. Create or select the Emotional Friend application.
2. Enable the email and Google sign-in methods you want users to see.
3. Open **API keys** and copy the **Publishable Key**.
4. On the same page, choose **Show JWT public key**, select the PEM public key, and copy the complete `BEGIN PUBLIC KEY` through `END PUBLIC KEY` value.

## Vercel environment variables

Add both values to Production, Preview, and Development unless you intentionally use separate Clerk instances per environment.

| Key | Value | Sensitive | Note | Branch |
|---|---|---:|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key (`pk_test_...` or `pk_live_...`) | No | Clerk browser configuration | Leave blank |
| `CLERK_JWT_KEY` | Complete PEM JWT public key | No | Server token verification | Leave blank |

The JWT key is public cryptographic material, but it remains a server-only variable because the browser does not need it. Vercel accepts the PEM as a multiline value. If entering it through a shell, preserve newlines or use literal `\n` sequences.

No Clerk secret key is required by this implementation. Existing Firebase browser variables and Firebase Admin credentials remain required because Firestore is still the chat database.

## Local configuration

Add this to uncommitted `.env.local`:

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\nYOUR_KEY\n-----END PUBLIC KEY-----"
```

The app entry point wraps the application in Clerk:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
);
```

The signed-out and signed-in controls use Clerk's current React components:

```tsx
<Show when="signed-out">
  <SignInButton mode="modal"><button>Sign in</button></SignInButton>
  <SignUpButton mode="modal"><button>Create account</button></SignUpButton>
</Show>
<Show when="signed-in">
  <UserButton />
</Show>
```

After adding or changing a `VITE_` variable, redeploy; Vite embeds public variables at build time.
