package main

import (
	"context"
	"fmt"
	"math"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/shirou/gopsutil/v4/cpu"
    "github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

func getCPUUsage() float64 {
	percents, err := cpu.Percent(1*time.Second, false)
	if err != nil || len(percents) == 0 {
		fmt.Println("[Agent] Error getting CPU usage:", err)
		return 0.0
	}
	return percents[0]
}

func getMemoryUsage() float64 {
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		fmt.Println("[Agent] Error getting Memory usage:", err)
		return 0.0
	}
	return vmStat.UsedPercent
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		fmt.Println("[Agent] Error getting hostname:", err)
		return "unknown"
	}
	return hostname
}

func getLastDeployment() string {
	os.Chdir("../infra")
	deploy, _ := exec.Command("sh", "-c", "docker compose logs --since=24h | grep -Eic 'Starting|Recreating|Pulling|Creating'").Output()
	return strings.TrimSpace(string(deploy))
}

func getUptime() string {
    uptime, err := host.Uptime()
    if err != nil {
        fmt.Println("[Agent] Error getting uptime:", err)
        return "0"
    }
    return strconv.FormatUint(uptime, 10)
}

func getRedisClient() *redis.Client {
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", host, port),
	})
	return rdb
}

func metrics() {
	redisClient := getRedisClient()
	ctx := context.Background()

	hostname := "arch"
	fmt.Println("[Agent] Hostname:", hostname)
	for true {
		hashField := map[string]string{
			"cpu":         strconv.FormatFloat(math.Round(getCPUUsage()*100)/100, 'f', 2, 64),
			"memory":      strconv.FormatFloat(math.Round(getMemoryUsage()*100)/100, 'f', 2, 64),
			"deployments": getLastDeployment(),
			"timestamp":   strconv.FormatInt(time.Now().Unix(), 10),
			"uptime": 	getUptime(),
		}
		fmt.Printf("[Agent] Collected Metrics - CPU: %s%%, Memory: %s%%, Deployments Last 24h: %s, Uptime: %s seconds\n", hashField["cpu"], hashField["memory"], hashField["deployments"], hashField["uptime"])
		redisClient.HSet(ctx, hostname, hashField)
		time.Sleep(10 * time.Second)
	}
	defer redisClient.Close()
}

func main() {
	fmt.Println("[Agent] Starting agent...")
	fmt.Println("[Agent] Collecting metrics...")

	metrics()
}
