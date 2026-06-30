import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('QuizzesController (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	const createQuizPayload = (title: string) => ({
		title,
		description: `${title} description`,
		questions: [
			{
				prompt: 'What is the capital of France?',
				type: 'INPUT',
				isRequired: true,
				options: [],
			},
			{
				prompt: 'JavaScript is single-threaded.',
				type: 'BOOLEAN',
				isRequired: false,
				options: [],
			},
		],
	});

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		prisma = app.get(PrismaService);
	});

	beforeEach(async () => {
		await prisma.question.deleteMany();
		await prisma.quiz.deleteMany();
	});

	afterAll(async () => {
		await prisma.question.deleteMany();
		await prisma.quiz.deleteMany();
		await app.close();
	});

	it('GET /quizzes/:id returns full quiz details including all questions', async () => {
		const created = await request(app.getHttpServer())
			.post('/quizzes')
			.send(createQuizPayload('Geography Quiz'))
			.expect(201);

		const quizId = created.body.id as string;

		const response = await request(app.getHttpServer())
			.get(`/quizzes/${quizId}`)
			.expect(200);

		expect(response.body.id).toBe(quizId);
		expect(response.body.title).toBe('Geography Quiz');
		expect(response.body.description).toBe('Geography Quiz description');
		expect(Array.isArray(response.body.questions)).toBe(true);
		expect(response.body.questions).toHaveLength(2);
		expect(response.body.questions[0]).toEqual(
			expect.objectContaining({
				prompt: expect.any(String),
				type: expect.any(String),
			}),
		);
	});

	it('DELETE /quizzes/:id deletes a quiz', async () => {
		const created = await request(app.getHttpServer())
			.post('/quizzes')
			.send(createQuizPayload('Delete Me Quiz'))
			.expect(201);

		const quizId = created.body.id as string;

		await request(app.getHttpServer()).delete(`/quizzes/${quizId}`).expect(200);

		await request(app.getHttpServer()).get(`/quizzes/${quizId}`).expect(404);
	});

	it('POST /quizzes/:id/start starts a quiz and increments attempt count', async () => {
		const created = await request(app.getHttpServer())
			.post('/quizzes')
			.send(createQuizPayload('Start Quiz'))
			.expect(201);

		const quizId = created.body.id as string;

		const started = await request(app.getHttpServer())
			.post(`/quizzes/${quizId}/start`)
			.expect(201);

		expect(started.body).toEqual(
			expect.objectContaining({
				id: quizId,
				title: 'Start Quiz',
			}),
		);

		const mostAttempted = await request(app.getHttpServer())
			.get('/quizzes/most-attempted')
			.expect(200);

		expect(Array.isArray(mostAttempted.body)).toBe(true);
		const startedQuiz = mostAttempted.body.find((quiz: { id: string }) => quiz.id === quizId);
		expect(startedQuiz).toBeDefined();
		expect(startedQuiz.attemptsCount).toBeGreaterThanOrEqual(1);
	});

	it('GET /quizzes/most-attempted returns quizzes sorted by attempts count', async () => {
		const first = await request(app.getHttpServer())
			.post('/quizzes')
			.send(createQuizPayload('Low Attempts Quiz'))
			.expect(201);
		const second = await request(app.getHttpServer())
			.post('/quizzes')
			.send(createQuizPayload('High Attempts Quiz'))
			.expect(201);

		const firstId = first.body.id as string;
		const secondId = second.body.id as string;

		await request(app.getHttpServer()).post(`/quizzes/${firstId}/start`).expect(201);
		await request(app.getHttpServer()).post(`/quizzes/${secondId}/start`).expect(201);
		await request(app.getHttpServer()).post(`/quizzes/${secondId}/start`).expect(201);

		const response = await request(app.getHttpServer())
			.get('/quizzes/most-attempted')
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBeGreaterThanOrEqual(2);
		expect(response.body[0].id).toBe(secondId);
		expect(response.body[0].attemptsCount).toBeGreaterThanOrEqual(response.body[1].attemptsCount);
	});
});
