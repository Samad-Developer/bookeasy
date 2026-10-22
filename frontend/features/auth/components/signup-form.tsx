'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyServerError } from '@/features/auth/form-errors';
import { useSignup } from '@/features/auth/hooks';
import { signupSchema, type SignupValues } from '../schema';
import { useNextPath } from '@/features/auth/use-next-path';

const ROLE_OPTIONS = [
  { value: 'customer', title: 'Book venues', hint: 'Find a venue and reserve a slot.' },
  { value: 'owner', title: 'List my venues', hint: 'Add venues, slots and prices.' },
] as const;

export function SignupForm() {
  const next = useNextPath();
  const signup = useSignup();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'customer' },
  });

  function onSubmit(values: SignupValues) {
    // confirmPassword is only for the browser, so we do not send it to the API
    const payload = { name: values.name, email: values.email, password: values.password, role: values.role };
    signup.mutate(payload, {
      onError: (error) => applyServerError(error, setError, ['name', 'email', 'password', 'role']),
    });
  }

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>It takes less than a minute.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">I want to</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input type="radio" value={option.value} className="sr-only" {...register('role')} />
                  <span className="font-medium">{option.title}</span>
                  <span className="text-muted-foreground">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
          </FormField>

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

          <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
          </FormField>

          <FormField label="Repeat password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              {...register('confirmPassword')}
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={signup.isPending}>
            {signup.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="gap-1 text-sm text-muted-foreground">
        Already have an account?
        <Link href={loginHref} className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}