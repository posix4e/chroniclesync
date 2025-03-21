FROM docker.all-hands.dev/all-hands-ai/runtime:0.29-nikolaik

# Install required packages
RUN apt-get update && apt-get install -y vim xauth zip
RUN npx playwright install --with-deps 
