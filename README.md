# fragments

### Command	Description

npm start	 -->  Run production server

npm run dev	 -->  Run with auto-restart and debug logs

npm run debug	 -->  Run with debugger on port 9229

npm run lint	-->  Check code quality


### Health Check Endpoint

curl http://localhost:8080

### To run docker by including env

docker run --rm --name fragments --env-file .env fragments:latest