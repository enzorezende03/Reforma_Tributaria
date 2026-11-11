# AGENTS.md
- Client login is email+password; first access and recovery use Supabase Auth email OTP, then forced password creation gated by `clients.must_set_password`; codes are requested only via the `request-login-code` edge function (checks active client first, `shouldCreateUser: false`). Why: only registered clients may receive codes.
- Client auth accounts are created/linked server-side by `admin-provision-client` (also sends access email) and the `handle_new_admin_user` auth trigger, which links `clients.user_id` by email. Why: service role must never reach the browser.
- Client identity = `clients.user_id = auth.uid()`; never store client session objects in localStorage. Why: single auth system shared with admins and SSO.
