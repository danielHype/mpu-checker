FROM node:18.17.0

WORKDIR /usr/src/app

COPY web/package.json web/yarn.lock ./

RUN yarn

EXPOSE 3000

CMD [ "yarn", "build"]

# Dockerfile
# Use the official nginx base image from Docker Hub
FROM nginx

# Copy the contents of the current directory to the specified directory in the container
COPY . /usr/share/nginx/html