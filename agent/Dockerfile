FROM alpine:latest
WORKDIR /app
COPY . .
RUN apk add --no-cache go
RUN go build -o agent ./main.go
CMD ["./agent"]