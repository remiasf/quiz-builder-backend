import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuestionTypeDto } from './dto/create-question.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
  private readonly pageSize = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(createQuizDto: CreateQuizDto) {
    for (const question of createQuizDto.questions) {
      if (
        (question.type === QuestionTypeDto.INPUT || question.type === QuestionTypeDto.BOOLEAN) &&
        question.options !== undefined
      ) {
        throw new BadRequestException('options is not allowed when type is INPUT or BOOLEAN');
      }

      if (question.type === QuestionTypeDto.CHECKBOX) {
        if (!question.options || question.options.length < 2 || question.options.length > 5) {
          throw new BadRequestException(
            'options must contain between 2 and 5 items when type is CHECKBOX',
          );
        }
      }
    }

    const created = await this.prisma.quiz.create({
      data: {
        title: createQuizDto.title,
        description: createQuizDto.description,
        questions: {
          create: createQuizDto.questions.map((question) => ({
            prompt: question.prompt,
            type: question.type,
            isRequired: question.isRequired,
            options: question.options ?? [],
          })),
        },
      },
      include: {
        questions: true,
      },
    });
    return created;
  }

  async findAll(parsedPage: number) {
    const page = parsedPage || 1;
    const skip = (page - 1) * this.pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quiz.findMany({
        skip,
        take: this.pageSize,
        include: {
          questions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.quiz.count(),
    ]);

    return {
      page,
      perPage: this.pageSize,
      total,
      totalPages: Math.ceil(total / this.pageSize),
      data: items.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        numberOfQuestions: quiz.questions.length,
        attemptsCount: quiz.attemptsCount,
      })),
    };
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${id} not found`);
    }

    return quiz;
  }

  async remove(id: string) {
    const exists = await this.prisma.quiz.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Quiz with id ${id} not found`);
    }

    await this.prisma.quiz.delete({
      where: { id },
    });

    return { message: `Quiz ${id} deleted` };
  }

  async findMostAttempted() {
    const quizzes = await this.prisma.quiz.findMany({
      orderBy: {
        attemptsCount: 'desc',
      },
      take: 5,
      include: {
        questions: true,
      },
    });
    return quizzes;
  }

  async startQuiz(id: string) {
    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data: { 
        attemptsCount: { increment: 1 } 
      },
      include: {
        questions: true,
      },
    }).catch(() => {
      throw new NotFoundException(`Quiz with id ${id} not found`);
    });
    return updatedQuiz;
  };
}
