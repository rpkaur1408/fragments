# Dockerfile
FROM node:22.12.0

# metadata about image
# LABEL adds key value pairs to an image

LABEL maintainer="Rehatpreet Kaur <rpkaur4@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Environment variables

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false


# Use /app as our working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory

# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
COPY package*.json /app/


# Install node dependencies defined in package-lock.json
RUN npm install


# Copy src to /app/src/
COPY ./src ./src


# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd





# Start the container by running our server
CMD npm start


# We run our service on port 8080
EXPOSE 8080