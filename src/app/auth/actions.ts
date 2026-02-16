'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    restaurantName: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .optional()
        .or(z.literal(''))
        .transform(value => (value ? value : undefined)),
});

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validatedFields = loginSchema.safeParse({
        email,
        password,
    });

    if (!validatedFields.success) {
        return { error: 'Invalid fields' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/auth/post-login');
}

export async function signup(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const restaurantName = (formData.get('restaurant_name') as string | null) ?? '';

    const validatedFields = signupSchema.safeParse({
        email,
        password,
        restaurantName,
    });

    if (!validatedFields.success) {
        return { error: 'Invalid fields' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email: validatedFields.data.email,
        password: validatedFields.data.password,
        options: {
            data: {
                restaurant_name: validatedFields.data.restaurantName || undefined,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');

    if (data.session) {
        redirect('/auth/post-login');
    }

    return { error: null, message: 'Account created. Check your email to confirm sign-up.' };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/');
}
