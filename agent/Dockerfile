FROM golang:alpine AS builder
WORKDIR /app
COPY . .
RUN go mod tidy
RUN go build -o agent ./main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/agent .
CMD ["./agent"]