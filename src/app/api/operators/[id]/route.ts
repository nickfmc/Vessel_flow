import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { generateUniqueSlug } from '~/utils/slugify';

const updateOperatorSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateOperatorSchema.parse(body);
    const operatorId = params.id;

    // Check if operator exists
    const existingOperator = await db.operator.findUnique({
      where: { id: operatorId },
    });

    if (!existingOperator) {
      return NextResponse.json({
        success: false,
        error: 'Operator not found',
        message: 'The specified operator does not exist',
      }, { status: 404 });
    }

    // Check if email conflicts with another operator (excluding current operator)
    const emailConflict = await db.operator.findFirst({
      where: {
        email: validatedData.email,
        id: { not: operatorId },
      },
    });

    if (emailConflict) {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
        message: 'Another operator with this email already exists',
      }, { status: 409 });
    }

    // Generate new slug if name changed
    let updateData: any = validatedData;
    if (validatedData.name !== existingOperator.name) {
      const newSlug = await generateUniqueSlug(
        validatedData.name,
        async (slug) => {
          const existing = await db.operator.findFirst({
            where: { 
              slug,
              id: { not: operatorId },
            },
          });
          return !!existing;
        }
      );
      updateData.slug = newSlug;
    }

    const updatedOperator = await db.operator.update({
      where: { id: operatorId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedOperator,
    });

  } catch (error) {
    console.error('Error updating operator:', error);

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
      message: 'An unexpected error occurred while updating the operator',
    }, { status: 500 });
  }
}