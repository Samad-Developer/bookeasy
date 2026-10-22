'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyServerError } from '@/features/auth/form-errors';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginValues } from '../schema';
import { useNextPath } from '@/features/auth/use-next-path';

export function LoginForm() {
  const next = useNextPath();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // handleSubmit runs the Zod schema first. This function only runs when the form is valid.
  function onSubmit(values: LoginValues) {
    login.mutate(values, {
      onError: (error) => applyServerError(error, setError, ['email', 'password']),
    });
  }

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Log in</CardTitle>
        <CardDescription>Enter your email and password to continue.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="gap-1 text-sm text-muted-foreground">
        New to BookEasy?
        <Link href={signupHref} className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}