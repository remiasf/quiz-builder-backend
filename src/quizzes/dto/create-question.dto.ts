import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDefined,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QuestionTypeDto {
	BOOLEAN = 'BOOLEAN',
	INPUT = 'INPUT',
	CHECKBOX = 'CHECKBOX',
}

function IsOptionsForbiddenForInputOrBoolean(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string): void => {
        registerDecorator({
            name: 'isOptionsForbiddenForInputOrBoolean',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments): boolean {
                    const dto = args.object as CreateQuestionDto;
                    if (
                        dto.type === QuestionTypeDto.INPUT ||
                        dto.type === QuestionTypeDto.BOOLEAN
                    ) {
                        return value === undefined;
                    }
                    return true;
                },
            },
        });
    };
}

export class CreateQuestionDto {
    @ApiProperty({
        description: 'Question text shown to the user',
        example: 'What does JS stand for?',
        minLength: 5,
        maxLength: 100,
    })
    @IsString()
    @MinLength(5)
    @MaxLength(100)
    prompt!: string;

    @ApiProperty({
        description: 'Type of question',
        enum: QuestionTypeDto,
        example: QuestionTypeDto.INPUT,
    })
    @IsEnum(QuestionTypeDto)
    type!: QuestionTypeDto;

    @ApiPropertyOptional({
        description: 'Whether this question is required',
        default: true,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @ApiPropertyOptional({
        description: 'Answer options. Required for CHECKBOX and forbidden for INPUT/BOOLEAN.',
        type: String,
        isArray: true,
        minItems: 2,
        maxItems: 5,
        example: ['Option A', 'Option B'],
    })
    @ValidateIf((o: CreateQuestionDto) => o.type === QuestionTypeDto.CHECKBOX)
    @IsDefined({ message: 'options is required when type is CHECKBOX' })
    @IsArray({ message: 'options must be an array of strings when type is CHECKBOX' })
    @ArrayMinSize(2, { message: 'options must contain at least 2 items when type is CHECKBOX' })
    @ArrayMaxSize(5, { message: 'options must contain at most 5 items when type is CHECKBOX' })
    @IsString({ each: true, message: 'each options item must be a string' })
    @MaxLength(40, { each: true, message: 'each options item must be at most 40 characters' })
    @IsOptionsForbiddenForInputOrBoolean({
        message: 'options is not allowed when type is INPUT or BOOLEAN',
    })
    options?: string[];
}

