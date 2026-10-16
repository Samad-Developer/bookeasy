// Usage:  pnpm create-admin someone@example.com
//
// Promotes an EXISTING account to admin. There is deliberately no API endpoint that can do this:
// if there were, anyone who finds it could make themselves an admin. Only someone who can run
// commands on the server (and so already controls the database) can create the first admin.
import { pool } from '../db/pool.ts';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: pnpm create-admin <email>');
    process.exitCode = 1;
    return;
  }

  const { rows } = await pool.query<{ id: number }>(
    `UPDATE users SET role = 'admin', is_active = true WHERE email = $1 RETURNING id`,
    [email],
  );
  
  if (rows.length === 0) {
    console.error(`No account with the email "${email}". Sign up first, then run this again.`);
    process.exitCode = 1;
    return;
  }

  // Their old tokens still say "customer". Deleting them forces a new login with the admin role.
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [rows[0].id]);
  
  console.log(`Done: ${email} is now an admin. They must log in again.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
