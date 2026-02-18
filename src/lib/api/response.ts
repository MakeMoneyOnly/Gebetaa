import { NextResponse } from 'next/server';

type ErrorBody = {
    error: string;
    code?: string;
    details?: unknown;
};

type SuccessBody<T> = {
    data: T;
};

export function apiSuccess<T>(data: T, status: number = 200) {
    return NextResponse.json<SuccessBody<T>>({ data }, { status });
}

export function apiError(
    error: string,
    status: number = 400,
    code?: string,
    details?: unknown
) {
    const body: ErrorBody = { error };
    if (code) {
        body.code = code;
    }
    if (typeof details !== 'undefined') {
        body.details = details;
    }

    return NextResponse.json(body, { status });
}
