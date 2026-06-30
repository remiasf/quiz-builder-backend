import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';

export class CreateQuizDto {
	@ApiProperty({
		description: 'Quiz title',
		example: 'JavaScript Fundamentals',
		minLength: 5,
		maxLength: 50,
	})
	@IsString()
	@MinLength(5)
	@MaxLength(50)
	title!: string;

	@ApiPropertyOptional({
		description: 'Optional quiz description',
		example: 'A short quiz about JS basics',
		maxLength: 400,
	})
	@IsOptional()
	@IsString()
	@MaxLength(400)
	description?: string;

	@ApiProperty({
		description: 'List of quiz questions',
		type: CreateQuestionDto,
		isArray: true,
		minItems: 1,
		maxItems: 20,
	})
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@ValidateNested({ each: true })
	@Type(() => CreateQuestionDto)
	questions!: CreateQuestionDto[];
}
