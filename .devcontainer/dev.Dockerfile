# Use the official Python image from the Docker Hub
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . /workspace

# Install useful tools for development
RUN apt-get update && apt-get install -y \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory to /workspace
WORKDIR /workspace

# Set the environment variable for Python
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["python", "bot.py"]