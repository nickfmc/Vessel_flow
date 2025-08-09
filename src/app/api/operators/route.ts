import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { generateUniqueSlug } from '~/utils/slugify';

const createOperatorSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOperatorSchema.parse(body);

    // Check if email already exists
    const existingOperator = await db.operator.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (existingOperator) {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
        message: 'An operator with this email already exists',
      }, { status: 409 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(
      validatedData.name,
      async (slug) => {
        const existing = await db.operator.findFirst({
          where: { slug },
        });
        return !!existing;
      }
    );

    const operator = await db.operator.create({
      data: {
        ...validatedData,
        slug,
      },
    });

    return NextResponse.json({
      success: true,
      data: operator,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating operator:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the operator',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const operators = await db.operator.findMany({
      include: {
        _count: {
          select: {
            vessels: true,
            tours: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: operators,
    });

  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch operators',
    }, { status: 500 });
  }
}