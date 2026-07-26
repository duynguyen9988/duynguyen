import subprocess
import sys
import os


def run(cmd: str, cwd: str | None = None) -> None:
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"Lỗi: '{cmd}' thất bại với mã {result.returncode}")
        sys.exit(result.returncode)


def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_root)

    print("1. Generate version info...")
    os.makedirs("data", exist_ok=True)
    run('git log -1 --format=\'{"hash":"%h","date":"%ad"}\' --date=format:"%d-%m-%Y %H:%M:%S" > data/version.json')

    print("2. Build static site with Hugo...")
    run("hugo --minify")

    print(f"\n2. Build hoàn tất. Output tại: {repo_root}/public/")
    print("3. Để deploy, push code lên GitHub (GitHub Actions sẽ tự động build và deploy):")
    print("   git add . && git commit -m 'update' && git push origin main")
    print("\n4. Hoặc chạy deploy local:")
    print("   cd public && python3 -m http.server 8080")


if __name__ == "__main__":
    main()
