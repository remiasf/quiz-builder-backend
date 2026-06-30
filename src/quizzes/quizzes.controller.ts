import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizzesService.create(createQuizDto);
  }

  @Get()
  findAll(@Query('page') page?: string) {
    const parsedPage = page ? Number(page) : 1;

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    return this.quizzesService.findAll(parsedPage);
  }

  @Get('most-attempted')
  findMostAttempted() {
    return this.quizzesService.findMostAttempted();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.quizzesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.quizzesService.remove(id);
  }

  @Patch(':id/start')
  startQuiz(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.quizzesService.startQuiz(id);
  }
}
