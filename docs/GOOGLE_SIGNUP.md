# Sign up with Google

"Sign up with Google" is wired on the frontend. To make it work end-to-end
you need two things: a Google OAuth Client ID and a backend endpoint.

## 1. Frontend (already done)

- `@react-oauth/google` is installed.
- The app is wrapped in `<GoogleOAuthProvider>` in `src/main.jsx`, reading
  the client id from `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
- `src/pages/auth/SignUp.jsx` renders the `<GoogleLogin>` button on step 1
  (account creation) and calls `googleAuth({ credential, role })`.
- `googleAuth()` lives in `src/controllers/user_controller.js` and posts to
  `POST /user/google`, storing the returned tokens on success.

## 2. Set the Client ID

1. Google Cloud Console → APIs & Services → Credentials → Create
   "OAuth 2.0 Client ID" → Application type **Web application**.
2. Add your app origins to **Authorized JavaScript origins**, e.g.
   `http://localhost:5173` (dev) and your production domain.
3. Copy the client id into `.env`:

   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

4. Restart the dev server (Vite only reads env at startup).

> Until a valid client id is set, the Google button will not render / will
> error. Everything else (manual signup) is unaffected.

## 3. Backend endpoint to implement

The frontend expects:

```
POST /user/google
Content-Type: application/json

{
  "credential": "<google id_token JWT from the button>",
  "role": "Enterprenuer" | "Investor" | "Mentor" | "Reviewer" | "Finance"
}
```

The backend should:

1. Verify the `credential` JWT with Google
   (`https://oauth2.googleapis.com/tokeninfo?id_token=...` or the
   `google-auth-library`), checking the `aud` matches the same client id.
2. Extract `email`, `name`, `picture`, `email_verified`.
3. Find the user by email, or create a new one with the given `role`
   (mark email as verified, no password).
4. Return the **same response shape as `POST /user/register`**:

   ```json
   {
     "status": true,
     "message": "...",
     "tokens": { "ACCESS_TOKEN": "...", "REFRESH_TOKEN": "..." },
     "body": { "uuid": "...", "role": "...", "...": "..." }
   }
   ```

On success the frontend stores `tokens` and redirects to `/dashboard`.

> Note: role-specific profiles (Business / InvestorProfile / MentorProfile)
> are **not** created by Google signup — the user completes those afterward
> from Edit Profile. Adjust if you want the backend to create an empty
> profile shell on first Google login.
