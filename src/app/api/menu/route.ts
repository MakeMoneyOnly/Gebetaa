import { NextResponse } from 'next/server';
import { FOOD_ITEMS } from '@/lib/constants';
import { FoodItemSchema } from '@/types/zod-schemas';
import { z } from 'zod';

export async function GET() {
    try {
        // Validate the data against our schema to ensure consistency
        const validatedItems = z.array(FoodItemSchema).safeParse(FOOD_ITEMS);

        if (!validatedItems.success) {
            console.error('Data validation failed:', validatedItems.error);
            return NextResponse.json({ error: 'Data inconsistency' }, { status: 500 });
        }

        return NextResponse.json(validatedItems.data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

const PostSchema = z.object({
    title: z.string().min(2),
    shop: z.string().min(2),
    price: z.number().positive(),
    category: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = PostSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.format() }, { status: 400 });
        }

        // In a real app, we would save to Supabase here
        return NextResponse.json({ message: 'Item validated successfully', data: validated.data });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
}
