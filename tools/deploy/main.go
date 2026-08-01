package main

import (
	"fmt"
	"os"
	"os/exec"
)

func run(name string, args ...string) {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("Lỗi: '%s' thất bại với mã %d\n", name, cmd.ProcessState.ExitCode())
		os.Exit(1)
	}
}

func main() {
	fmt.Println("1. Generate version info...")
	if err := os.MkdirAll("data", 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "Lỗi: không tạo được thư mục data: %v\n", err)
		os.Exit(1)
	}
	format := `{"hash":"%h","date":"%ad"}`
	dateFmt := "format:%d-%m-%Y %H:%M:%S"
	out, err := exec.Command("git", "log", "-1", "--format="+format, "--date="+dateFmt).Output()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Lỗi: git log thất bại: %v\n", err)
		os.Exit(1)
	}
	if err := os.WriteFile("data/version.json", out, 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "Lỗi: không ghi được data/version.json: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("2. Generate ML-based related posts...")
	run("go", "run", "./tools/ml-related")

	fmt.Println("3. Build static site with Hugo...")
	run("hugo", "--minify")

	fmt.Println("\nBuild hoàn tất. Output tại: public/")
	fmt.Println("4. Để deploy, push code lên GitHub (GitHub Actions sẽ tự động build và deploy):")
	fmt.Println("   git add . && git commit -m 'update' && git push origin main")
	fmt.Println("\n5. Hoặc chạy deploy local:")
	fmt.Println("   cd public && python3 -m http.server 8080")
}
