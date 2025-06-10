const request = require('supertest');

const app = require('../../src/app');

describe("GET /some-unknoenwn-endpoint", () => {
    test("undefined endpoint should return 404", async () => {
        const res = await request(app).get("/some-unknoenwn-endpoint");
        expect(res.statusCode).toBe(404);
        expect(res.body.status).toEqual("error");
        expect(res.body.error.code).toEqual(404);
        expect(res.body.error.message).toEqual("Not Found");
    }
    );
})